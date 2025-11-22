# 🚀 Guía de Deployment - ASL Recognition System

## Opciones de Deployment

### 1. Render.com (Recomendado)

#### Preparación
```bash
# Asegurar requirements.txt actualizado
pip freeze > requirements.txt

# Crear archivo de configuración para Render
echo "web: python app.py" > Procfile
```

#### Variables de Entorno
```bash
# En Render Dashboard > Environment
FLASK_ENV=production
FLASK_DEBUG=False
```

#### Build Settings
- **Runtime**: Python 3.8+
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

#### Archivos Estáticos
- El modelo `.h5` debe subirse por separado (límite 1GB en Render)
- Usar Google Drive/Dropbox para distribución del modelo

### 2. Heroku

#### Archivos Requeridos
```yaml
# runtime.txt
python-3.8.10

# Procfile
web: python app.py

# requirements.txt (actualizado)
Flask==2.3.3
tensorflow==2.13.0
opencv-python==4.8.0.76
mediapipe==0.10.2
numpy==1.24.3
Pillow==10.0.0
```

#### Configuración
```bash
# Variables de entorno
heroku config:set FLASK_ENV=production
heroku config:set FLASK_DEBUG=False
```

### 3. VPS/Dedicated Server

#### Configuración del Servidor
```bash
# Instalar Python y dependencias del sistema
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Instalar dependencias de MediaPipe/OpenCV
sudo apt install libgl1-mesa-glx libglib2.0-0

# Crear usuario para la aplicación
sudo useradd -m -s /bin/bash asl_app
sudo su - asl_app
```

#### Configuración con Gunicorn
```bash
# requirements-prod.txt
Flask==2.3.3
gunicorn==21.2.0
tensorflow-cpu==2.13.0  # Versión CPU para servidores
opencv-python==4.8.0.76
mediapipe==0.10.2
numpy==1.24.3
Pillow==10.0.0

# Ejecutar con Gunicorn
gunicorn --bind 0.0.0.0:8000 --workers 4 app:app
```

#### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/asl-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /path/to/your/app/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Docker Deployment

#### Dockerfile
```dockerfile
FROM python:3.8-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la aplicación
WORKDIR /app

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Exponer puerto
EXPOSE 5000

# Comando para ejecutar
CMD ["python", "app.py"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  asl-app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=False
    volumes:
      - ./models:/app/models:ro
    restart: unless-stopped
```

## 📋 Checklist Pre-Deployment

### ✅ Código
- [ ] Variables de entorno configuradas
- [ ] `FLASK_DEBUG=False` en producción
- [ ] Logs apropiados para producción
- [ ] Manejo de errores robusto

### ✅ Seguridad
- [ ] HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Validación de entrada de usuario

### ✅ Rendimiento
- [ ] Archivos JavaScript minificados
- [ ] CSS optimizado
- [ ] Imágenes comprimidas
- [ ] Cache headers configurados

### ✅ Base de Datos/Modelos
- [ ] Modelo `.h5` disponible en servidor
- [ ] `class_mapping.json` presente
- [ ] Permisos de archivo correctos
- [ ] Backup del modelo configurado

## 🔧 Configuración de Producción

### Variables de Entorno
```bash
# .env.production
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here
MODEL_PATH=/app/models/asl_quick_model.h5
MAX_CONTENT_LENGTH=10485760  # 10MB
```

### Configuración Flask
```python
# En app.py
if os.environ.get('FLASK_ENV') == 'production':
    app.config.update(
        DEBUG=False,
        TESTING=False,
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        MAX_CONTENT_LENGTH=int(os.environ.get('MAX_CONTENT_LENGTH', 10*1024*1024))
    )
```

## 📊 Monitoreo

### Logs
```bash
# Configurar logging para producción
import logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Health Check
```python
# Endpoint de health check
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
```

## 🚨 Troubleshooting

### Problemas Comunes

#### "Model file not found"
```bash
# Verificar ruta del modelo
ls -la models/
# Asegurar permisos correctos
chmod 644 models/*.h5
```

#### "Memory Error"
- Reducir batch size en configuración
- Usar modelo optimizado para CPU
- Aumentar RAM del servidor

#### "Camera not accessible"
- Verificar HTTPS en producción
- Configurar permisos de cámara
- Probar con diferentes navegadores

#### "Slow loading"
- Habilitar compresión Gzip
- Configurar CDN para assets estáticos
- Optimizar imágenes y minificar JS/CSS

## 🔄 Actualizaciones

### Estrategia de Deployment
1. **Blue-Green**: Mantener dos versiones activas
2. **Rolling**: Actualizar gradualmente
3. **Canary**: Probar con subset de usuarios

### Backup del Modelo
```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp models/asl_quick_model.h5 models/backup/asl_model_$DATE.h5
```

## 📞 Soporte

Para problemas específicos de deployment:
1. Revisar logs de la aplicación
2. Verificar configuración del servidor
3. Probar localmente con configuración de producción
4. Consultar documentación de la plataforma de hosting

---

**¡Deployment exitoso!** 🎉