"""
Sistema de Detección de Señas Básica para Soporte al Cliente
Aplicación Flask principal para reconocimiento de lenguaje de señas
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import cv2
import json
import os
import base64
import numpy as np
import hashlib
import sqlite3
from datetime import datetime
from io import BytesIO
from PIL import Image

def load_env_file(path=".env"):
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    if key and value is not None:
                        os.environ.setdefault(key, value)
    except Exception:
        pass

# Importar componentes del sistema
from src.hand_detector import HandDetector
from src.asl_alphabet_recognizer_v2 import ASLAlphabetRecognizerV2

# Inicializar aplicación Flask
load_env_file()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'deteccion-senas-soporte-2024')

# Configuración de la aplicación
app.config.update(
    DEBUG=str(os.environ.get('FLASK_DEBUG', '1')).lower() in ('1', 'true', 'yes'),
    TEMPLATES_AUTO_RELOAD=True
)

# Inicializar componentes de detección
try:
    # Inicializar detector de manos para localizar la mano
    hand_detector = HandDetector(
        static_image_mode=False,
        max_num_hands=1,  # Solo una mano para ASL
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # USAR EXCLUSIVAMENTE EL NUEVO MODELO ENTRENADO
    asl_recognizer = ASLAlphabetRecognizerV2(
        model_path=os.environ.get("MODEL_PATH", "models/asl_quick_model.h5"),
        class_mapping_path=os.environ.get("CLASS_MAPPING_PATH", "models/class_mapping_quick.json")
    )
    
    print("Detector de manos inicializado")
    print("NUEVO modelo ASL cargado con 97.5% de precision")
    print(f"Letras disponibles: {asl_recognizer.get_available_letters()}")
    
except Exception as e:
    print(f"Error inicializando componentes: {e}")
    print("💡 Asegúrate de haber ejecutado 'python quick_train.py' primero")
    hand_detector = None
    asl_recognizer = None

# Variables de optimización de rendimiento
frame_counter = 0
FRAME_SKIP_RATE = int(os.environ.get('FRAME_SKIP_RATE', 3))
CACHE_DURATION = float(os.environ.get('CACHE_DURATION', 0.1))
last_detection_result = None
last_detection_time = 0
result_cache = {
    'result': None,
    'timestamp': 0,
    'frame_hash': None
}

def ensure_data_dir():
    try:
        os.makedirs('data', exist_ok=True)
    except Exception:
        pass

def get_db():
    ensure_data_dir()
    conn = sqlite3.connect('data/users.db')
    conn.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, name TEXT, password_salt TEXT, password_hash TEXT, role TEXT, plan TEXT, created_at TEXT)')
    return conn

def make_password(password):
    salt = hashlib.sha256(os.urandom(32)).hexdigest()
    h = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return salt, h

def check_password(salt, h, password):
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest() == h

# Variables globales para comunicación entre cliente y agente
latest_client_gesture = {
    'gesture': None,
    'confidence': 0.0,
    'timestamp': None,
    'description': '',
    'category': ''
}

latest_agent_response = {
    'gesture': None,
    'timestamp': None,
    'description': '',
    'category': ''
}

def extract_hand_region(frame, landmarks):
    """
    Extrae la región de la mano del frame usando los landmarks.
    
    Args:
        frame: Frame de la imagen
        landmarks: Lista de landmarks de la mano
        
    Returns:
        numpy array: Región recortada de la mano
    """
    try:
        height, width = frame.shape[:2]
        
        # Convertir landmarks normalizados a coordenadas de píxeles
        x_coords = [int(lm[0] * width) for lm in landmarks]
        y_coords = [int(lm[1] * height) for lm in landmarks]
        
        # Encontrar bounding box de la mano
        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)
        
        # Agregar margen alrededor de la mano (20% extra)
        margin_x = int((max_x - min_x) * 0.2)
        margin_y = int((max_y - min_y) * 0.2)
        
        # Aplicar margen con límites del frame
        min_x = max(0, min_x - margin_x)
        max_x = min(width, max_x + margin_x)
        min_y = max(0, min_y - margin_y)
        max_y = min(height, max_y + margin_y)
        
        # Extraer región de la mano
        hand_region = frame[min_y:max_y, min_x:max_x]
        
        # Asegurar que la región no esté vacía
        if hand_region.size == 0:
            return frame  # Devolver frame completo si hay error
        
        return hand_region
        
    except Exception as e:
        print(f"Error extrayendo región de mano: {e}")
        return frame  # Devolver frame completo si hay error

def generate_frame_hash(frame):
    """
    Generar hash simple del frame para detectar cambios significativos
    Usa una versión reducida del frame para mayor eficiencia
    """
    try:
        # Reducir frame a 32x32 para hash rápido
        small_frame = cv2.resize(frame, (32, 32))
        # Convertir a escala de grises
        gray_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
        # Generar hash MD5
        frame_bytes = gray_frame.tobytes()
        return hashlib.md5(frame_bytes).hexdigest()
    except Exception:
        return None

def is_cache_valid(current_time, frame_hash):
    """
    Verificar si el cache es válido basado en tiempo y similitud del frame
    """
    global result_cache
    
    # Verificar si el cache existe y no ha expirado
    time_valid = (current_time - result_cache['timestamp']) < CACHE_DURATION
    
    # Verificar si el frame es similar al anterior
    frame_similar = (frame_hash and 
                    result_cache['frame_hash'] and 
                    frame_hash == result_cache['frame_hash'])
    
    return time_valid and frame_similar and result_cache['result'] is not None

def update_cache(result, timestamp, frame_hash):
    """
    Actualizar el cache con nuevo resultado
    """
    global result_cache
    result_cache = {
        'result': result.copy() if result else None,
        'timestamp': timestamp,
        'frame_hash': frame_hash
    }

@app.route('/')
def index():
    try:
        if not session.get('user_id') and not session.get('is_guest'):
            return redirect(url_for('landing'))
        return render_template('index.html', is_guest=bool(session.get('is_guest')))
    except Exception as e:
        # Si no existe el template, devolver una página básica
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sistema de Detección de Señas - Cliente</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Sistema de Detección de Señas para Cliente Sordo</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p>La interfaz web será implementada en tareas posteriores.</p>
            <div>
                <h3>Endpoints disponibles:</h3>
                <ul>
                    <li>GET / - Esta página (Cliente)</li>
                    <li>GET /agent - Panel del Agente</li>
                    <li>POST /detect_gesture - Procesar gestos</li>
                    <li>GET /get_gestures - Lista de gestos disponibles</li>
                </ul>
            </div>
        </body>
        </html>
        """, 200

@app.route('/landing')
def landing():
    try:
        return render_template('landing/index.html')
    except Exception as e:
        return redirect(url_for('index'))

@app.route('/auth/login', methods=['GET', 'POST'])
def auth_login():
    try:
        if request.method == 'GET':
            return render_template('auth/login.html')
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        if not email or not password:
            return render_template('auth/login.html', error='Correo y contraseña requeridos')
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id, name, password_salt, password_hash, role, plan FROM users WHERE email = ?', (email,))
        row = cur.fetchone()
        conn.close()
        if not row or not check_password(row[2], row[3], password):
            return render_template('auth/login.html', error='Credenciales inválidas')
        session.clear()
        session['user_id'] = row[0]
        session['name'] = row[1]
        session['role'] = row[4] or 'user'
        session['plan'] = row[5] or 'personal'
        return redirect(url_for('index'))
    except Exception:
        return render_template('auth/login.html', error='Error de inicio de sesión')

@app.route('/auth/register', methods=['GET', 'POST'])
def auth_register():
    try:
        if request.method == 'GET':
            return render_template('auth/register.html')
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        if not name or not email or not password:
            return render_template('auth/register.html', error='Todos los campos son requeridos')
        salt, h = make_password(password)
        conn = get_db()
        try:
            conn.execute('INSERT INTO users (email, name, password_salt, password_hash, role, plan, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', (email, name, salt, h, 'user', 'personal', datetime.now().isoformat()))
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return render_template('auth/register.html', error='El correo ya está registrado')
        cur = conn.cursor()
        cur.execute('SELECT id FROM users WHERE email = ?', (email,))
        row = cur.fetchone()
        conn.close()
        session.clear()
        session['user_id'] = row[0]
        session['name'] = name
        session['role'] = 'user'
        session['plan'] = 'personal'
        return redirect(url_for('index'))
    except Exception:
        return render_template('auth/register.html', error='Error al crear la cuenta')

@app.route('/auth/guest', methods=['POST'])
def auth_guest():
    try:
        session.clear()
        session['is_guest'] = True
        session['name'] = 'Invitado'
        return redirect(url_for('index'))
    except Exception:
        return redirect(url_for('landing'))

@app.route('/auth/logout', methods=['POST', 'GET'])
def auth_logout():
    session.clear()
    return redirect(url_for('landing'))

@app.route('/dashboard')
def dashboard_page():
    """Dashboard de métricas del sistema"""
    try:
        return render_template('dashboard.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>📊 Dashboard de Métricas ASL</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>
        """, 200

@app.route('/practice')
def practice_page():
    """Página de práctica del abecedario ASL"""
    try:
        return render_template('practice.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Práctica ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>🤟 Práctica del Abecedario ASL</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>
        """, 200

@app.route('/agent')
def teacher_panel():
    """Panel para maestros y padres para monitorear el progreso de aprendizaje"""
    try:
        return render_template('agent.html')
    except Exception as e:
        # Si no existe el template, devolver una página básica
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sistema de Detección de Señas - Soporte</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>Sistema de Detección de Señas para Soporte al Cliente</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p>La interfaz web será implementada en tareas posteriores.</p>
            <div>
                <h3>Endpoints disponibles:</h3>
                <ul>
                    <li>GET / - Esta página</li>
                    <li>POST /detect_gesture - Procesar gestos</li>
                    <li>GET /get_gestures - Lista de gestos disponibles</li>
                </ul>
            </div>
        </body>
        </html>
        """, 200

@app.route('/detect_asl_letter', methods=['POST'])
def detect_asl_letter():
    """Endpoint para reconocer letras del alfabeto ASL"""
    try:
        # Verificar que los componentes estén disponibles
        if not asl_recognizer or not hand_detector:
            return jsonify({
                'success': False,
                'message': 'Componentes de detección no disponibles',
                'letter': None,
                'confidence': 0.0,
                'error': 'components_not_available'
            }), 503
        
        # Obtener datos del request
        if not request.json:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos JSON',
                'letter': None,
                'confidence': 0.0,
                'error': 'no_data'
            }), 400
        
        # Extraer imagen del request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({
                'success': False,
                'message': 'No se recibió imagen en el request',
                'letter': None,
                'confidence': 0.0,
                'error': 'no_image'
            }), 400
        
        # Decodificar imagen base64
        try:
            # Remover prefijo data:image si existe
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decodificar base64
            image_bytes = base64.b64decode(image_data)
            
            # Convertir a imagen PIL
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Convertir a array numpy (OpenCV format)
            frame = np.array(pil_image)
            
            # Convertir RGB a BGR si es necesario
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error procesando imagen: {str(e)}',
                'letter': None,
                'confidence': 0.0,
                'error': 'image_processing_failed'
            }), 400
        
        # Detectar manos primero
        detection_result = hand_detector.detect_hands(frame)
        
        if not detection_result['hands_detected']:
            response_data = {
                'success': False,
                'message': 'No se detectaron manos en la imagen',
                'letter': None,
                'confidence': 0.0,
                'error': 'no_hands_detected',
                'timestamp': datetime.now().isoformat()
            }
        else:
            # Extraer región de la mano y reconocer letra ASL
            landmarks = hand_detector.get_normalized_landmarks(frame)
            if landmarks:
                hand_region = extract_hand_region(frame, landmarks)
                letter, confidence = asl_recognizer.predict(hand_region, landmarks)
                
                if letter:
                    # Obtener top 3 predicciones
                    top_predictions = asl_recognizer.get_top_predictions(hand_region, top_k=3)
                    
                    response_data = {
                        'success': True,
                        'message': f'Letra ASL reconocida: {letter}',
                        'letter': letter,
                        'confidence': confidence,
                        'top_predictions': [
                            {'letter': pred_letter, 'confidence': pred_conf}
                            for pred_letter, pred_conf in top_predictions
                        ],
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    response_data = {
                        'success': False,
                        'message': 'Mano detectada pero letra no reconocida',
                        'letter': None,
                        'confidence': 0.0,
                        'error': 'recognition_failed',
                        'timestamp': datetime.now().isoformat()
                    }
            else:
                response_data = {
                    'success': False,
                    'message': 'No se pudieron extraer landmarks de la mano',
                    'letter': None,
                    'confidence': 0.0,
                    'error': 'invalid_landmarks',
                    'timestamp': datetime.now().isoformat()
                }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno en reconocimiento ASL: {str(e)}',
            'letter': None,
            'confidence': 0.0,
            'error': 'internal_error'
        }), 500

@app.route('/detect_gesture', methods=['POST'])
def detect_gesture():
    """Endpoint para procesar frames y detectar letras ASL"""
    try:
        # Verificar que el reconocedor ASL esté disponible
        if not asl_recognizer:
            return jsonify({
                'success': False,
                'message': 'Reconocedor ASL no disponible',
                'letter': None,
                'confidence': 0.0,
                'error': 'asl_recognizer_not_available'
            }), 503
        
        # Obtener datos del request
        if not request.json:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos JSON',
                'gesture': None,
                'confidence': 0.0,
                'error': 'no_data'
            }), 400
        
        # Extraer imagen del request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({
                'success': False,
                'message': 'No se recibió imagen en el request',
                'gesture': None,
                'confidence': 0.0,
                'error': 'no_image'
            }), 400
        
        # Decodificar imagen base64
        try:
            # Remover prefijo data:image si existe
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decodificar base64
            image_bytes = base64.b64decode(image_data)
            
            # Convertir a imagen PIL
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Optimización de rendimiento: Reducir resolución a 640x480 para procesamiento
            original_size = pil_image.size
            target_size = (640, 480)
            
            # Solo redimensionar si la imagen es más grande que el objetivo
            if original_size[0] > target_size[0] or original_size[1] > target_size[1]:
                pil_image = pil_image.resize(target_size, Image.Resampling.LANCZOS)
            
            # Convertir a array numpy (OpenCV format)
            frame = np.array(pil_image)
            
            # Convertir RGB a BGR si es necesario
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error procesando imagen: {str(e)}',
                'gesture': None,
                'confidence': 0.0,
                'error': 'image_processing_failed'
            }), 400
        
        # Optimización de rendimiento: Cache de resultados y frame skipping
        global frame_counter, last_detection_result, last_detection_time
        frame_counter += 1
        current_time = datetime.now().timestamp()
        
        # Generar hash del frame para detectar cambios
        frame_hash = generate_frame_hash(frame)
        
        # Verificar cache antes de procesar
        if is_cache_valid(current_time, frame_hash):
            cached_result = result_cache['result'].copy()
            cached_result['from_cache'] = True
            cached_result['cache_age_ms'] = int((current_time - result_cache['timestamp']) * 1000)
            return jsonify(cached_result)
        
        # Procesar solo cada FRAME_SKIP_RATE frames para frames diferentes
        if frame_counter % FRAME_SKIP_RATE != 0:
            # Usar último resultado si está disponible y es reciente (menos de 500ms)
            if last_detection_result and (current_time - last_detection_time) < 0.5:
                skipped_result = last_detection_result.copy()
                skipped_result['frame_skipped'] = True
                skipped_result['frame_number'] = frame_counter
                return jsonify(skipped_result)
            else:
                # Si no hay resultado reciente, devolver estado de espera
                return jsonify({
                    'success': False,
                    'message': 'Procesando frame...',
                    'gesture': None,
                    'confidence': 0.0,
                    'hands_detected': False,
                    'frame_skipped': True,
                    'frame_number': frame_counter
                })
        
        # Primero detectar manos en el frame
        detection_result = hand_detector.detect_hands(frame)
        
        if not detection_result['hands_detected']:
            response_data = {
                'success': False,
                'message': 'No se detectaron manos en la imagen',
                'letter': None,
                'gesture': None,
                'confidence': 0.0,
                'hands_detected': False,
                'error': 'no_hands_detected',
                'frame_processed': True,
                'frame_number': frame_counter,
                'suggestions': [
                    'Coloque su mano frente a la cámara',
                    'Asegúrese de que la mano esté completamente visible',
                    'Use buena iluminación',
                    'Mantenga la mano a 30-60 cm de la cámara'
                ]
            }
        else:
            # Si hay manos detectadas, extraer región de la mano y reconocer letra ASL
            try:
                # Obtener landmarks de la mano
                landmarks = hand_detector.get_normalized_landmarks(frame)
                all_landmarks = hand_detector.get_all_normalized_landmarks(frame)
                
                if landmarks:
                    # Calcular bounding box para visualización
                    height, width = frame.shape[:2]
                    x_coords = [int(lm[0] * width) for lm in landmarks]
                    y_coords = [int(lm[1] * height) for lm in landmarks]
                    
                    bounding_box = {
                        'min_x': min(x_coords),
                        'max_x': max(x_coords),
                        'min_y': min(y_coords),
                        'max_y': max(y_coords),
                        'width': max(x_coords) - min(x_coords),
                        'height': max(y_coords) - min(y_coords)
                    }
                    
                    # Extraer región de la mano del frame
                    hand_region = extract_hand_region(frame, landmarks)
                    
                    # Reconocer letra ASL en la región de la mano (con landmarks para detección de movimiento)
                    letter, confidence = asl_recognizer.predict(hand_region, landmarks)
                    
                    # Obtener información de estabilidad
                    stability_info = asl_recognizer.get_stability_info()
                    
                    # Obtener top 3 predicciones
                    top_predictions = asl_recognizer.get_top_predictions(hand_region, top_k=3)
                    
                    # Evaluar resultado SIMPLE
                    if letter and confidence > 0.5:  # Predicciones con 50%+ de confianza
                        response_data = {
                            'success': True,
                            'message': f'Letra ASL detectada: {letter}',
                            'letter': letter,
                            'gesture': letter,
                            'confidence': confidence,
                            'description': f'Letra del alfabeto ASL: {letter}',
                            'category': 'alfabeto_asl',
                            'hands_detected': True,
                            'landmarks': all_landmarks if all_landmarks else [landmarks],
                            'bounding_box': bounding_box,
                            'hand_region_size': {
                                'width': hand_region.shape[1],
                                'height': hand_region.shape[0]
                            },
                            'stability_info': stability_info,
                            'top_predictions': [
                                {'letter': pred_letter, 'confidence': pred_conf}
                                for pred_letter, pred_conf in top_predictions
                            ],
                            'timestamp': datetime.now().isoformat(),
                            'frame_processed': True,
                            'frame_number': frame_counter
                        }
                    elif letter and confidence > 0.3:  # Predicción detectada con confianza baja
                        stability_message = stability_info.get('message', 'Analizando estabilidad...')
                        response_data = {
                            'success': False,
                            'message': f'Detectando: {letter} - {stability_message}',
                            'letter': letter,
                            'gesture': None,
                            'confidence': confidence,
                            'description': f'Posible letra ASL: {letter} - Mantenga la posición',
                            'category': 'alfabeto_asl',
                            'hands_detected': True,
                            'landmarks': all_landmarks if all_landmarks else [landmarks],
                            'bounding_box': bounding_box,
                            'stability_info': stability_info,
                            'top_predictions': [
                                {'letter': pred_letter, 'confidence': pred_conf}
                                for pred_letter, pred_conf in top_predictions
                            ],
                            'frame_processed': True,
                            'frame_number': frame_counter,
                            'suggestions': [
                                f'Mantenga la posición de la letra {letter} por 2-3 segundos',
                                'Asegúrese de formar la letra claramente',
                                'Use buena iluminación uniforme'
                            ]
                        }
                    else:
                        response_data = {
                            'success': False,
                            'message': 'Mano detectada pero letra no reconocida',
                            'letter': None,
                            'gesture': None,
                            'confidence': confidence if letter else 0.0,
                            'description': 'Forme una letra ASL clara',
                            'category': 'alfabeto_asl',
                            'hands_detected': True,
                            'landmarks': all_landmarks if all_landmarks else [landmarks],
                            'bounding_box': bounding_box,
                            'stability_info': stability_info,
                            'top_predictions': [
                                {'letter': pred_letter, 'confidence': pred_conf}
                                for pred_letter, pred_conf in top_predictions
                            ] if top_predictions else [],
                            'frame_processed': True,
                            'frame_number': frame_counter,
                            'suggestions': [
                                'Forme claramente una letra del alfabeto ASL',
                                'Mantenga la posición por unos segundos',
                                'Asegúrese de que los dedos estén bien posicionados'
                            ]
                        }
                else:
                    response_data = {
                        'success': False,
                        'message': 'No se pudieron extraer landmarks de la mano',
                        'letter': None,
                        'gesture': None,
                        'confidence': 0.0,
                        'hands_detected': True,
                        'error': 'invalid_landmarks',
                        'frame_processed': True,
                        'frame_number': frame_counter
                    }
                    
            except Exception as e:
                response_data = {
                    'success': False,
                    'message': f'Error en reconocimiento ASL: {str(e)}',
                    'letter': None,
                    'gesture': None,
                    'confidence': 0.0,
                    'hands_detected': True,
                    'error': 'asl_recognition_error',
                    'frame_processed': True,
                    'frame_number': frame_counter
                }
        
        # Actualizar último gesto para el panel del agente
        global latest_client_gesture
        if response_data['success']:
            # Letra ASL reconocida exitosamente
            latest_client_gesture = {
                'gesture': response_data['letter'],
                'confidence': response_data['confidence'],
                'timestamp': response_data['timestamp'],
                'description': response_data['description'],
                'category': response_data['category'],
                'status': 'recognized'
            }
        else:
            # No se reconoció letra clara
            latest_client_gesture = {
                'gesture': 'letra_no_reconocida',
                'confidence': response_data.get('confidence', 0.0),
                'timestamp': response_data.get('timestamp', datetime.now().isoformat()),
                'description': response_data['message'],
                'category': 'alfabeto_asl',
                'status': 'not_recognized'
            }
        
        # Cachear resultado para frames saltados y cache avanzado
        last_detection_result = response_data.copy()
        last_detection_time = current_time
        update_cache(response_data, current_time, frame_hash)
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno en detección: {str(e)}',
            'gesture': None,
            'confidence': 0.0,
            'error': 'internal_error'
        }), 500

@app.route('/get_gestures', methods=['GET'])
def get_gestures():
    """Obtener lista de letras ASL disponibles del NUEVO MODELO"""
    try:
        if not asl_recognizer:
            return jsonify({
                'success': False,
                'gestures': [],
                'message': 'Reconocedor ASL no disponible'
            }), 503
        
        # Obtener letras directamente del modelo entrenado
        available_letters = asl_recognizer.get_available_letters()
        
        # Formatear letras para la respuesta
        gestures_list = []
        for letter in available_letters:
            gestures_list.append({
                'name': letter,
                'description': f'Letra {letter} del alfabeto ASL (Modelo entrenado)',
                'category': 'alfabeto_asl'
            })
        
        return jsonify({
            'success': True,
            'gestures': gestures_list,
            'total_gestures': len(gestures_list),
            'message': f'Modelo entrenado - {len(gestures_list)} letras disponibles con 97.5% precisión',
            'model_info': {
                'accuracy': '97.5%',
                'letters_count': len(available_letters),
                'model_path': 'models/asl_quick_model.h5'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'gestures': [],
            'message': f'Error obteniendo letras ASL: {str(e)}'
        }), 500

@app.route('/get_latest_gesture', methods=['GET'])
def get_latest_gesture():
    """Obtener el último gesto detectado para el panel del agente"""
    try:
        global latest_client_gesture
        
        if latest_client_gesture['gesture']:
            return jsonify({
                'success': True,
                'gesture': latest_client_gesture['gesture'],
                'confidence': latest_client_gesture['confidence'],
                'timestamp': latest_client_gesture['timestamp'],
                'description': latest_client_gesture['description'],
                'category': latest_client_gesture['category'],
                'has_gesture': True
            })
        else:
            return jsonify({
                'success': True,
                'gesture': None,
                'confidence': 0.0,
                'timestamp': None,
                'description': 'Esperando señas del cliente...',
                'category': '',
                'has_gesture': False
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo último gesto: {str(e)}'
        }), 500

@app.route('/send_agent_response', methods=['POST'])
def send_agent_response():
    """Enviar respuesta del agente al cliente"""
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos JSON'
            }), 400
        
        letter = request.json.get('gesture') or request.json.get('letter')
        if not letter:
            return jsonify({
                'success': False,
                'message': 'Letra requerida'
            }), 400
        
        # Información de la letra ASL
        gesture_info = {
            'description': f'Letra {letter} del alfabeto ASL',
            'category': 'alfabeto_asl'
        }
        
        # Actualizar respuesta del agente
        global latest_agent_response
        latest_agent_response = {
            'gesture': letter,
            'timestamp': datetime.now().isoformat(),
            'description': gesture_info['description'],
            'category': gesture_info['category']
        }
        
        return jsonify({
            'success': True,
            'message': f'Letra "{letter}" enviada al cliente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error enviando respuesta: {str(e)}'
        }), 500

@app.route('/get_agent_response', methods=['GET'])
def get_agent_response():
    """Obtener la última respuesta del agente para el cliente"""
    try:
        global latest_agent_response
        
        if latest_agent_response['gesture']:
            return jsonify({
                'success': True,
                'gesture': latest_agent_response['gesture'],
                'timestamp': latest_agent_response['timestamp'],
                'description': latest_agent_response['description'],
                'category': latest_agent_response['category'],
                'has_response': True
            })
        else:
            return jsonify({
                'success': True,
                'gesture': None,
                'timestamp': None,
                'description': 'Esperando respuesta del agente...',
                'category': '',
                'has_response': False
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo respuesta del agente: {str(e)}'
        }), 500



@app.route('/status', methods=['GET'])
def get_status():
    """Obtener estado del sistema y estadísticas"""
    try:
        status_data = {
            'system_status': 'running',
            'components': {
                'hand_detector': hand_detector is not None,
                'asl_alphabet_recognizer': asl_recognizer is not None
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Agregar estadísticas de los componentes
        if asl_recognizer:
            status_data['asl_stats'] = {
                'model_loaded': asl_recognizer.model is not None,
                'available_letters': len(asl_recognizer.class_names),
                'letters': asl_recognizer.class_names
            }
        
        if hand_detector:
            status_data['detection_stats'] = hand_detector.get_detection_stats()
        
        # Agregar estadísticas de rendimiento
        status_data['performance_stats'] = {
            'frame_counter': frame_counter,
            'frame_skip_rate': FRAME_SKIP_RATE,
            'cache_duration_ms': int(CACHE_DURATION * 1000),
            'effective_fps': 30 / FRAME_SKIP_RATE,  # Asumiendo 30 FPS de entrada
            'cache_valid': result_cache['result'] is not None,
            'cache_age_ms': int((datetime.now().timestamp() - result_cache['timestamp']) * 1000) if result_cache['result'] else 0
        }
        
        return jsonify({
            'success': True,
            'data': status_data,
            'message': 'Sistema funcionando correctamente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo estado: {str(e)}',
            'data': None
        }), 500

# ============================================
# GAMIFICATION SYSTEM ROUTES (NEW)
# ============================================

@app.route('/games')
def games_menu():
    """Menú de mini-juegos"""
    try:
        return render_template('games/menu.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Juegos ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>🎮 Menú de Juegos ASL</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>
        """, 200

@app.route('/games/spell-word')
def spell_word_game():
    """Juego de deletrear palabras"""
    try:
        return render_template('games/spell-word.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Deletrea la Palabra - ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>🔤 Deletrea la Palabra</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/games">← Volver a juegos</a></p>
        </body>
        </html>
        """, 200

@app.route('/games/time-attack')
def time_attack_game():
    """Juego contra reloj"""
    try:
        return render_template('games/time-attack.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Contra Reloj - ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>⏱️ Contra Reloj</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/games">← Volver a juegos</a></p>
        </body>
        </html>
        """, 200

@app.route('/games/memory')
def memory_game():
    """Juego de memoria"""
    try:
        return render_template('games/memory-game.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Memoria ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>🧠 Memoria ASL</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/games">← Volver a juegos</a></p>
        </body>
        </html>
        """, 200

@app.route('/guide')
def asl_guide():
    """Guía visual de letras ASL"""
    try:
        return render_template('games/guide.html')
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Guía Visual ASL</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1>📖 Guía Visual ASL</h1>
            <p>Error: Template no encontrado. {str(e)}</p>
            <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>
        """, 200

# ============================================
# GAMIFICATION API ENDPOINTS (NEW)
# ============================================

# Variable global para almacenar puntuaciones en memoria
game_scores = []
leaderboard_data = []

@app.route('/api/random-word', methods=['GET'])
def get_random_word():
    """Obtener palabra aleatoria para el juego"""
    try:
        difficulty = request.args.get('difficulty', 'easy')
        
        # Palabras organizadas por dificultad
        words = {
            'easy': ['HOLA', 'CASA', 'GATO', 'PERRO', 'SOL', 'LUNA', 'AMOR', 'VIDA'],
            'medium': ['AMIGO', 'LIBRO', 'FELIZ', 'MUNDO', 'VERDE', 'CIELO', 'FLOR'],
            'hard': ['ALFABETO', 'LENGUAJE', 'COMUNICAR', 'APRENDER', 'FAMILIA']
        }
        
        import random
        word_list = words.get(difficulty, words['easy'])
        word = random.choice(word_list)
        
        return jsonify({
            'success': True,
            'word': word,
            'difficulty': difficulty
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo palabra: {str(e)}',
            'word': 'HOLA'  # Fallback word
        }), 500

@app.route('/api/save-game-score', methods=['POST'])
def save_game_score():
    """Guardar puntuación de juego (en memoria, no persistente)"""
    try:
        if not request.json:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos JSON'
            }), 400
        
        # Extraer datos del juego
        game_type = request.json.get('gameType', 'unknown')
        score = request.json.get('score', 0)
        player_name = request.json.get('playerName', 'Jugador')
        
        # Crear registro de puntuación
        score_entry = {
            'gameType': game_type,
            'score': score,
            'playerName': player_name,
            'timestamp': datetime.now().isoformat()
        }
        
        # Guardar en memoria
        global game_scores, leaderboard_data
        game_scores.append(score_entry)
        
        # Actualizar leaderboard (mantener top 10)
        leaderboard_data.append({
            'rank': 0,  # Se calculará después
            'name': player_name,
            'score': score,
            'gameType': game_type
        })
        
        # Ordenar por puntuación descendente
        leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
        
        # Mantener solo top 10
        leaderboard_data = leaderboard_data[:10]
        
        # Actualizar rankings
        for i, entry in enumerate(leaderboard_data):
            entry['rank'] = i + 1
        
        return jsonify({
            'success': True,
            'message': 'Puntuación guardada exitosamente',
            'score': score,
            'rank': next((i + 1 for i, e in enumerate(leaderboard_data) if e['score'] == score and e['name'] == player_name), None)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error guardando puntuación: {str(e)}'
        }), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Obtener tabla de clasificación"""
    try:
        global leaderboard_data
        
        # Si no hay datos, devolver mock data
        if not leaderboard_data:
            mock_leaderboard = [
                {'rank': 1, 'name': 'Jugador Pro', 'score': 500, 'gameType': 'spell-word'},
                {'rank': 2, 'name': 'ASL Master', 'score': 450, 'gameType': 'time-attack'},
                {'rank': 3, 'name': 'Aprendiz', 'score': 400, 'gameType': 'memory'}
            ]
            return jsonify({
                'success': True,
                'leaderboard': mock_leaderboard,
                'message': 'Datos de ejemplo - Juega para aparecer en el ranking'
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard_data,
            'message': f'{len(leaderboard_data)} jugadores en el ranking'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo leaderboard: {str(e)}',
            'leaderboard': []
        }), 500

@app.route('/api/daily-challenge', methods=['GET'])
def get_daily_challenge():
    """Obtener desafío diario"""
    try:
        import random
        
        # Usar la fecha actual como semilla para que el desafío sea el mismo todo el día
        today = datetime.now().date()
        random.seed(str(today))
        
        # Tipos de desafíos
        challenges = [
            {
                'type': 'spell',
                'target': random.choice(['DESAFIO', 'VICTORIA', 'CAMPEON', 'ESTRELLA']),
                'reward': 100,
                'description': 'Deletrea la palabra del día'
            },
            {
                'type': 'time',
                'target': 15,
                'reward': 80,
                'description': 'Detecta 15 letras correctas en modo contra reloj'
            },
            {
                'type': 'perfect',
                'target': random.choice(['PERFECTO', 'EXCELENTE', 'GENIAL']),
                'reward': 120,
                'description': 'Deletrea la palabra sin errores'
            },
            {
                'type': 'memory',
                'target': 6,
                'reward': 90,
                'description': 'Completa el juego de memoria con 6 pares'
            }
        ]
        
        # Seleccionar desafío del día
        challenge = random.choice(challenges)
        challenge['date'] = str(today)
        challenge['expiresIn'] = '24 horas'
        
        # Resetear semilla
        random.seed()
        
        return jsonify({
            'success': True,
            'challenge': challenge,
            'message': 'Desafío diario disponible'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error obteniendo desafío diario: {str(e)}',
            'challenge': None
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Manejo de errores 404"""
    return jsonify({
        'success': False,
        'message': 'Endpoint no encontrado'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Manejo de errores 500"""
    return jsonify({
        'success': False,
        'message': 'Error interno del servidor'
    }), 500

if __name__ == '__main__':
    # Verificar que existen los directorios necesarios
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('src', exist_ok=True)
    
    print("Iniciando Sistema Educativo ASL con MODELO ENTRENADO")
    print("Estructura de proyecto configurada")
    
    # Verificar estado de componentes
    if hand_detector and asl_recognizer:
        print("Detector de manos listo")
        print("MODELO ENTRENADO cargado (97.5% precision)")
        print("Sistema educativo con modelo personalizado")
        print(f"Letras disponibles: {', '.join(asl_recognizer.get_available_letters())}")
        print("Usando modelo entrenado con tu dataset personalizado")
    else:
        print("Algunos componentes no están disponibles")
        if not hand_detector:
            print("   - Detector de manos: No inicializado")
        if not asl_recognizer:
            print("   - Reconocedor ASL: No inicializado")
            print("Ejecuta 'python quick_train.py' para entrenar el modelo")
    
    print("Aplicacion educativa disponible en: http://localhost:5000")
    print("Interfaces disponibles:")
    print("   - GET  /           - Juego Educativo ASL para Ninos")
    print("   - GET  /agent      - Panel del Maestro/Padre")
    print("Endpoints API:")
    print("   - POST /detect_gesture    - Reconocimiento de letras ASL")
    print("   - POST /detect_asl_letter - Reconocimiento ASL alternativo")
    print("   - GET  /get_gestures      - Lista de letras ASL (A-Z)")
    print("   - GET  /status            - Estado del sistema")
    
    # Ejecutar aplicación Flask
    app.run(
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000)),
        debug=app.config.get('DEBUG', True),
        use_reloader=True
    )