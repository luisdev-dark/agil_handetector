"""
Detector de manos usando MediaPipe
Implementa la detección de puntos clave de las manos para el sistema de señas
"""

import cv2
import numpy as np
from typing import List, Optional, Tuple, Dict, Any

# Importar MediaPipe con manejo de errores
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ MediaPipe no disponible: {e}")
    MEDIAPIPE_AVAILABLE = False
    mp = None


class HandDetector:
    """
    Clase para detectar manos y extraer landmarks usando MediaPipe
    
    Detecta hasta 2 manos y extrae 21 puntos clave por mano
    Normaliza las coordenadas para comparación de patrones
    """
    
    def __init__(self, 
                 static_image_mode: bool = False,
                 max_num_hands: int = 2,
                 min_detection_confidence: float = 0.3,
                 min_tracking_confidence: float = 0.3):
        """
        Inicializar MediaPipe Hands con configuración básica
        
        Args:
            static_image_mode: Si procesar imágenes estáticas o video
            max_num_hands: Número máximo de manos a detectar (2 para gestos completos)
            min_detection_confidence: Confianza mínima para detección
            min_tracking_confidence: Confianza mínima para seguimiento
        """
        # Verificar disponibilidad de MediaPipe
        if not MEDIAPIPE_AVAILABLE:
            raise ImportError("MediaPipe no está disponible. Instale con: pip install mediapipe==0.10.3")
        
        # Inicializar MediaPipe
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Configurar detector de manos
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        # Estado interno
        self.last_detection = None
        self.detection_count = 0
        
    def detect_hands(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Procesar frame y detectar manos
        
        Args:
            frame: Frame de video en formato BGR (OpenCV)
            
        Returns:
            Dict con información de detección:
            - hands_detected: bool, si se detectaron manos
            - num_hands: int, número de manos detectadas
            - results: objeto MediaPipe results
            - processed_frame: frame procesado
        """
        if frame is None:
            return {
                'hands_detected': False,
                'num_hands': 0,
                'results': None,
                'processed_frame': None
            }
        
        # Convertir BGR a RGB para MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Procesar frame con MediaPipe
        results = self.hands.process(rgb_frame)
        
        # Determinar si se detectaron manos
        hands_detected = results.multi_hand_landmarks is not None
        num_hands = len(results.multi_hand_landmarks) if hands_detected else 0
        
        # Actualizar contador de detecciones
        if hands_detected:
            self.detection_count += 1
            self.last_detection = results
        
        return {
            'hands_detected': hands_detected,
            'num_hands': num_hands,
            'results': results,
            'processed_frame': frame.copy()
        }
    
    def get_landmarks(self, frame: np.ndarray) -> Optional[List[List[float]]]:
        """
        Extraer 21 puntos clave de las manos detectadas
        
        Args:
            frame: Frame de video en formato BGR
            
        Returns:
            Lista de landmarks por mano detectada, cada landmark es [x, y, z]
            None si no se detectan manos
        """
        detection_result = self.detect_hands(frame)
        
        if not detection_result['hands_detected']:
            return None
        
        results = detection_result['results']
        all_landmarks = []
        
        # Extraer landmarks de cada mano detectada
        for hand_landmarks in results.multi_hand_landmarks:
            hand_points = []
            
            # Extraer los 21 puntos de la mano
            for landmark in hand_landmarks.landmark:
                hand_points.append([
                    landmark.x,  # Coordenada X normalizada (0-1)
                    landmark.y,  # Coordenada Y normalizada (0-1)
                    landmark.z   # Profundidad relativa
                ])
            
            all_landmarks.append(hand_points)
        
        return all_landmarks
    
    def draw_landmarks(self, frame: np.ndarray, results) -> np.ndarray:
        """
        Dibujar puntos clave detectados en el frame
        
        Args:
            frame: Frame original
            results: Resultados de MediaPipe
            
        Returns:
            Frame con landmarks dibujados
        """
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Dibujar conexiones de la mano
                self.mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
        
        return frame
    
    def normalize_landmarks(self, landmarks: List[List[float]]) -> Optional[List[List[float]]]:
        """
        Normalizar landmarks para coordenadas 0-1 y manejar casos sin detección
        
        Args:
            landmarks: Lista de puntos [x, y, z] de una mano
            
        Returns:
            Landmarks normalizados o None si no hay datos válidos
        """
        if not landmarks or len(landmarks) == 0:
            return None
        
        # Verificar que tenemos exactamente 21 puntos
        if len(landmarks) != 21:
            return None
        
        try:
            normalized_landmarks = []
            
            # MediaPipe ya devuelve coordenadas normalizadas (0-1)
            # Pero vamos a asegurar la normalización y manejar outliers
            for point in landmarks:
                if len(point) != 3:
                    return None
                
                x, y, z = point
                
                # Asegurar que las coordenadas estén en rango 0-1
                x = max(0.0, min(1.0, float(x)))
                y = max(0.0, min(1.0, float(y)))
                z = float(z)  # Z puede ser negativo (profundidad relativa)
                
                normalized_landmarks.append([x, y, z])
            
            return normalized_landmarks
            
        except (ValueError, TypeError, IndexError) as e:
            # Manejar errores de conversión o formato
            return None
    
    def normalize_multiple_hands(self, all_landmarks: List[List[List[float]]]) -> List[List[List[float]]]:
        """
        Normalizar landmarks de múltiples manos detectadas
        
        Args:
            all_landmarks: Lista de landmarks por cada mano detectada
            
        Returns:
            Lista de landmarks normalizados, filtrando manos inválidas
        """
        if not all_landmarks:
            return []
        
        normalized_hands = []
        
        for hand_landmarks in all_landmarks:
            normalized = self.normalize_landmarks(hand_landmarks)
            if normalized is not None:
                normalized_hands.append(normalized)
        
        return normalized_hands
    
    def get_normalized_landmarks(self, frame: np.ndarray) -> Optional[List[List[float]]]:
        """
        Obtener landmarks normalizados directamente desde un frame
        
        Args:
            frame: Frame de video
            
        Returns:
            Landmarks normalizados de la primera mano detectada o None
        """
        raw_landmarks = self.get_landmarks(frame)
        
        if not raw_landmarks or len(raw_landmarks) == 0:
            return None
        
        # Retornar solo la primera mano (para compatibilidad)
        first_hand = raw_landmarks[0]
        return self.normalize_landmarks(first_hand)
    
    def get_all_normalized_landmarks(self, frame: np.ndarray) -> Optional[List[List[List[float]]]]:
        """
        Obtener landmarks normalizados de todas las manos detectadas
        
        Args:
            frame: Frame de video
            
        Returns:
            Lista de landmarks normalizados por cada mano detectada o None
        """
        raw_landmarks = self.get_landmarks(frame)
        
        if not raw_landmarks or len(raw_landmarks) == 0:
            return None
        
        # Normalizar todas las manos detectadas
        return self.normalize_multiple_hands(raw_landmarks)
    
    def validate_landmarks(self, landmarks: List[List[float]]) -> bool:
        """
        Validar que los landmarks tienen el formato correcto
        
        Args:
            landmarks: Lista de puntos a validar
            
        Returns:
            True si los landmarks son válidos
        """
        if not landmarks:
            return False
        
        # Debe tener exactamente 21 puntos
        if len(landmarks) != 21:
            return False
        
        # Cada punto debe tener 3 coordenadas
        for point in landmarks:
            if not isinstance(point, (list, tuple)) or len(point) != 3:
                return False
            
            # Verificar que son números válidos
            try:
                x, y, z = point
                float(x), float(y), float(z)
            except (ValueError, TypeError):
                return False
        
        return True
    
    def get_detection_stats(self) -> Dict[str, Any]:
        """
        Obtener estadísticas de detección
        
        Returns:
            Dict con estadísticas del detector
        """
        return {
            'total_detections': self.detection_count,
            'has_recent_detection': self.last_detection is not None,
            'detector_initialized': self.hands is not None
        }
    
    def cleanup(self):
        """
        Limpiar recursos del detector
        """
        if self.hands:
            self.hands.close()
        self.last_detection = None
        self.detection_count = 0