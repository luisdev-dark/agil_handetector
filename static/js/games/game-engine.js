/**
 * GameEngine - Motor de juegos compartido para todos los mini-juegos ASL
 * 
 * Proporciona funcionalidad común para:
 * - Inicialización y gestión de cámara
 * - Detección de gestos mediante API existente
 * - Cálculo de puntuación genérico
 * - Manejo de sesión de juego
 * 
 * Reutiliza código existente de index.html y practice.html
 * Requirements: 1.1, 6.3
 */

class GameEngine {
  /**
   * Constructor del motor de juegos
   * @param {string} gameType - Tipo de juego (spell-word, time-attack, memory-game)
   * @param {Object} options - Opciones de configuración
   */
  constructor(gameType, options = {}) {
    this.gameType = gameType;
    this.score = 0;
    this.isActive = false;
    this.isDetecting = false;
    this.detectionCallback = null;

    // Referencias a elementos DOM
    this.video = null;
    this.canvas = null;
    this.ctx = null;

    // Configuración
    this.config = {
      detectionInterval: options.detectionInterval || 300, // ms entre detecciones
      confidenceThreshold: options.confidenceThreshold || 0.7, // Umbral mínimo de confianza
      videoWidth: options.videoWidth || 640,
      videoHeight: options.videoHeight || 480,
      enableVisualFeedback: options.enableVisualFeedback !== false, // Feedback visual habilitado por defecto
      enableSounds: options.enableSounds || false, // Sonidos deshabilitados por defecto
      ...options
    };

    // Sesión de juego
    this.session = {
      startTime: null,
      endTime: null,
      correctDetections: 0,
      totalAttempts: 0,
      detections: []
    };

    // Estado de detección
    this.lastDetection = null;
    this.detectionLoopId = null;
    this.lastDetectionTime = 0; // Para debounce

    // Sistema de mensajes de estado
    this.statusMessage = '';
    this.statusElement = null;
    this.statusCallbacks = [];

    // Integración con UIEffects
    this.uiEffects = typeof UIEffects !== 'undefined' ? UIEffects : null;

    // Sonidos de feedback (opcional)
    this.sounds = {
      success: null,
      error: null,
      detection: null
    };
  }

  /**
   * Iniciar cámara del usuario
   * Reutiliza lógica de index.html y practice.html
   * 
   * @param {HTMLVideoElement} videoElement - Elemento de video donde mostrar la cámara
   * @returns {Promise<boolean>} - true si se inició correctamente
   */
  async startCamera(videoElement) {
    try {
      if (!videoElement) {
        throw new Error('Video element is required');
      }

      this.video = videoElement;

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.config.videoWidth },
          height: { ideal: this.config.videoHeight },
          facingMode: 'user'
        }
      });

      this.video.srcObject = stream;

      // Esperar a que el video esté completamente cargado
      await new Promise((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play()
            .then(resolve)
            .catch(reject);
        };
        
        // Timeout de 5 segundos
        setTimeout(() => reject(new Error('Camera timeout')), 5000);
      });

      // Esperar un poco más para asegurar que el video esté renderizando
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Camera started successfully');
      return true;

    } catch (error) {
      console.error('Error starting camera:', error);
      this.handleError('camera', error);
      return false;
    }
  }

  /**
   * Detener cámara y liberar recursos
   */
  stopCamera() {
    try {
      if (this.video && this.video.srcObject) {
        const tracks = this.video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.video.srcObject = null;
      }
      console.log('Camera stopped');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  /**
   * Iniciar detección de gestos en loop
   * @param {Function} callback - Función a ejecutar con cada detección
   */
  startDetection(callback) {
    if (this.isDetecting) {
      console.warn('Detection already running');
      return;
    }

    this.isDetecting = true;
    this.detectionCallback = callback;
    this.detectLoop();
    
    console.log('Detection started');
  }

  /**
   * Detener detección de gestos
   */
  stopDetection() {
    this.isDetecting = false;
    
    if (this.detectionLoopId) {
      clearTimeout(this.detectionLoopId);
      this.detectionLoopId = null;
    }
    
    console.log('Detection stopped');
  }

  /**
   * Loop de detección continua
   * Reutiliza lógica de detectLoop de practice.html
   */
  async detectLoop() {
    if (!this.isDetecting) {
      return;
    }

    try {
      // Verificar que el video esté listo
      if (!this.video || this.video.videoWidth === 0 || this.video.videoHeight === 0) {
        console.log('Video not ready yet...');
        this.updateStatus('waiting', 'Iniciando cámara...');
        this.detectionLoopId = setTimeout(() => this.detectLoop(), 500);
        return;
      }

      // Implementar debounce: evitar detecciones demasiado frecuentes
      const now = Date.now();
      const timeSinceLastDetection = now - this.lastDetectionTime;
      if (timeSinceLastDetection < 200) { // Mínimo 200ms entre detecciones
        this.detectionLoopId = setTimeout(() => this.detectLoop(), this.config.detectionInterval);
        return;
      }

      // Capturar frame del video
      const imageData = this.captureFrame();

      if (!imageData || imageData === 'data:,') {
        console.log('Invalid image data, retrying...');
        this.updateStatus('waiting', 'Preparando detección...');
        this.detectionLoopId = setTimeout(() => this.detectLoop(), 500);
        return;
      }

      // Detectar gesto usando API existente
      const result = await this.detectGesture(imageData);

      // Procesar resultado y proporcionar feedback visual
      if (result) {
        this.lastDetection = result;
        this.lastDetectionTime = now; // Actualizar timestamp de última detección

        // Actualizar estado basado en confianza
        if (result.success && result.confidence) {
          if (result.confidence >= 0.7) {
            this.updateStatus('success', '¡Perfecto!');
            this.showVisualFeedback('success', result);
          } else if (result.confidence >= 0.5) {
            this.updateStatus('warning', 'Casi... mantén la posición');
            this.showVisualFeedback('warning', result);
          } else {
            this.updateStatus('info', 'Ajusta la posición...');
          }
        } else {
          this.updateStatus('idle', 'Muestra una letra...');
        }

        // Ejecutar callback si existe
        if (this.detectionCallback && typeof this.detectionCallback === 'function') {
          this.detectionCallback(result);
        }
      } else {
        this.updateStatus('idle', 'Muestra una letra...');
      }

    } catch (error) {
      console.error('Error in detection loop:', error);
      this.updateStatus('error', 'Error en detección');
      this.handleError('detection', error);
    }

    // Continuar el loop si sigue activo
    if (this.isDetecting) {
      this.detectionLoopId = setTimeout(() => this.detectLoop(), this.config.detectionInterval);
    }
  }

  /**
   * Capturar frame actual del video como imagen base64
   * @returns {string} - Imagen en formato base64
   */
  captureFrame() {
    try {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
      }

      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0);

      return this.canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Detectar gesto usando el endpoint /detect_gesture existente
   * Reutiliza la API existente sin modificarla
   * 
   * @param {string} imageData - Imagen en formato base64
   * @returns {Promise<Object>} - Resultado de la detección
   */
  async detectGesture(imageData) {
    try {
      const response = await fetch('/detect_gesture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      
      // Agregar timestamp a la detección
      if (result.success) {
        result.timestamp = Date.now();
      }
      
      return result;

    } catch (error) {
      console.error('Error detecting gesture:', error);
      return null;
    }
  }

  /**
   * Iniciar sesión de juego
   */
  startGame() {
    this.isActive = true;
    this.score = 0;
    this.session = {
      startTime: Date.now(),
      endTime: null,
      correctDetections: 0,
      totalAttempts: 0,
      detections: []
    };
    
    console.log(`Game started: ${this.gameType}`);
  }

  /**
   * Finalizar sesión de juego
   * @returns {Object} - Resumen de la sesión
   */
  endGame() {
    this.isActive = false;
    this.session.endTime = Date.now();
    
    const duration = this.session.endTime - this.session.startTime;
    const accuracy = this.session.totalAttempts > 0 
      ? (this.session.correctDetections / this.session.totalAttempts) * 100 
      : 0;

    const summary = {
      gameType: this.gameType,
      score: this.score,
      duration: duration,
      durationSeconds: Math.floor(duration / 1000),
      correctDetections: this.session.correctDetections,
      totalAttempts: this.session.totalAttempts,
      accuracy: Math.round(accuracy * 10) / 10,
      detections: this.session.detections
    };

    console.log('Game ended:', summary);
    return summary;
  }

  /**
   * Registrar una detección en la sesión
   * @param {string} letter - Letra detectada
   * @param {number} confidence - Nivel de confianza
   * @param {boolean} isCorrect - Si la detección fue correcta
   */
  recordDetection(letter, confidence, isCorrect) {
    this.session.totalAttempts++;
    
    if (isCorrect) {
      this.session.correctDetections++;
    }
    
    this.session.detections.push({
      letter: letter,
      confidence: confidence,
      isCorrect: isCorrect,
      timestamp: Date.now()
    });
  }

  /**
   * Calcular puntuación genérica basada en detecciones correctas y tiempo
   * @param {number} correctDetections - Número de detecciones correctas
   * @param {number} timeElapsed - Tiempo transcurrido en milisegundos
   * @param {Object} bonusFactors - Factores de bonus adicionales
   * @returns {number} - Puntuación calculada
   */
  calculateScore(correctDetections, timeElapsed, bonusFactors = {}) {
    let score = 0;

    // Puntos base por detecciones correctas
    const basePointsPerDetection = bonusFactors.basePoints || 10;
    score += correctDetections * basePointsPerDetection;

    // Bonus por velocidad (menos tiempo = más puntos)
    if (bonusFactors.speedBonus && timeElapsed) {
      const timeInSeconds = timeElapsed / 1000;
      const speedMultiplier = bonusFactors.speedMultiplier || 1;
      
      // Bonus inversamente proporcional al tiempo
      if (timeInSeconds < 30) {
        score += Math.floor(50 * speedMultiplier);
      } else if (timeInSeconds < 60) {
        score += Math.floor(30 * speedMultiplier);
      } else if (timeInSeconds < 120) {
        score += Math.floor(10 * speedMultiplier);
      }
    }

    // Bonus por precisión
    if (bonusFactors.accuracyBonus && this.session.totalAttempts > 0) {
      const accuracy = this.session.correctDetections / this.session.totalAttempts;
      if (accuracy >= 0.95) {
        score += Math.floor(100 * (bonusFactors.accuracyMultiplier || 1));
      } else if (accuracy >= 0.85) {
        score += Math.floor(50 * (bonusFactors.accuracyMultiplier || 1));
      } else if (accuracy >= 0.75) {
        score += Math.floor(25 * (bonusFactors.accuracyMultiplier || 1));
      }
    }

    // Bonus por juego perfecto (sin errores)
    if (bonusFactors.perfectBonus && this.session.correctDetections === this.session.totalAttempts && this.session.totalAttempts > 0) {
      score += Math.floor(200 * (bonusFactors.perfectMultiplier || 1));
    }

    // Bonus personalizados adicionales
    if (bonusFactors.customBonus) {
      score += bonusFactors.customBonus;
    }

    this.score = score;
    return score;
  }

  /**
   * Agregar puntos al score actual
   * @param {number} points - Puntos a agregar
   */
  addScore(points) {
    this.score += points;
    return this.score;
  }

  /**
   * Obtener puntuación actual
   * @returns {number} - Puntuación actual
   */
  getScore() {
    return this.score;
  }

  /**
   * Verificar si una detección es válida según el umbral de confianza
   * @param {Object} detection - Resultado de detección
   * @returns {boolean} - true si es válida
   */
  isValidDetection(detection) {
    return detection && 
           detection.success && 
           detection.letter && 
           detection.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Obtener última detección válida
   * @returns {Object|null} - Última detección o null
   */
  getLastDetection() {
    return this.lastDetection;
  }

  /**
   * Obtener estadísticas de la sesión actual
   * @returns {Object} - Estadísticas de la sesión
   */
  getSessionStats() {
    const duration = this.session.endTime 
      ? this.session.endTime - this.session.startTime
      : Date.now() - this.session.startTime;

    const accuracy = this.session.totalAttempts > 0
      ? (this.session.correctDetections / this.session.totalAttempts) * 100
      : 0;

    return {
      duration: duration,
      durationSeconds: Math.floor(duration / 1000),
      correctDetections: this.session.correctDetections,
      totalAttempts: this.session.totalAttempts,
      accuracy: Math.round(accuracy * 10) / 10,
      score: this.score,
      isActive: this.isActive
    };
  }

  /**
   * Resetear el motor de juegos
   */
  reset() {
    this.stopDetection();
    this.score = 0;
    this.isActive = false;
    this.lastDetection = null;
    this.session = {
      startTime: null,
      endTime: null,
      correctDetections: 0,
      totalAttempts: 0,
      detections: []
    };
  }

  /**
   * Limpiar recursos y detener todo
   */
  cleanup() {
    this.stopDetection();
    this.stopCamera();
    this.reset();
    
    // Limpiar referencias
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.detectionCallback = null;
    
    console.log('GameEngine cleaned up');
  }

  /**
   * Manejar errores del motor
   * @param {string} type - Tipo de error
   * @param {Error} error - Objeto de error
   */
  handleError(type, error) {
    const errorMessage = {
      camera: 'No se pudo acceder a la cámara. Verifica permisos.',
      detection: 'Error en la detección. Intenta de nuevo.',
      network: 'Error de conexión con el servidor.',
      unknown: 'Error desconocido.'
    };

    console.error(`GameEngine Error [${type}]:`, error);

    // Emitir evento de error si hay listeners
    if (this.onError && typeof this.onError === 'function') {
      this.onError({
        type: type,
        message: errorMessage[type] || errorMessage.unknown,
        error: error
      });
    }
  }

  /**
   * Registrar callback para errores
   * @param {Function} callback - Función a ejecutar en caso de error
   */
  setErrorHandler(callback) {
    if (typeof callback === 'function') {
      this.onError = callback;
    }
  }

  /**
   * Obtener información del estado actual del motor
   * @returns {Object} - Estado actual
   */
  getStatus() {
    return {
      gameType: this.gameType,
      isActive: this.isActive,
      isDetecting: this.isDetecting,
      score: this.score,
      cameraActive: this.video && this.video.srcObject !== null,
      session: this.getSessionStats(),
      statusMessage: this.statusMessage
    };
  }

  /**
   * Actualizar mensaje de estado
   * @param {string} type - Tipo de estado: 'idle', 'waiting', 'info', 'warning', 'success', 'error'
   * @param {string} message - Mensaje a mostrar
   */
  updateStatus(type, message) {
    this.statusMessage = message;
    
    // Actualizar elemento DOM si existe
    if (this.statusElement) {
      this.statusElement.textContent = message;
      
      // Actualizar clases CSS según tipo
      this.statusElement.className = `status-message status-${type}`;
    }
    
    // Notificar a callbacks registrados
    this.statusCallbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback({ type, message });
      }
    });
  }

  /**
   * Registrar elemento DOM para mostrar mensajes de estado
   * @param {HTMLElement} element - Elemento donde mostrar el estado
   */
  setStatusElement(element) {
    if (element instanceof HTMLElement) {
      this.statusElement = element;
    }
  }

  /**
   * Registrar callback para cambios de estado
   * @param {Function} callback - Función a ejecutar cuando cambie el estado
   */
  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusCallbacks.push(callback);
    }
  }

  /**
   * Mostrar feedback visual mejorado en detección
   * @param {string} type - Tipo de feedback: 'success', 'warning', 'error'
   * @param {Object} detection - Datos de la detección
   */
  showVisualFeedback(type, detection) {
    if (!this.config.enableVisualFeedback) return;
    
    // Usar UIEffects si está disponible
    if (this.uiEffects) {
      switch (type) {
        case 'success':
          // Agregar efecto de pulso al video
          if (this.video) {
            this.uiEffects.addPulseRing(this.video.parentElement);
            setTimeout(() => {
              this.uiEffects.removePulseRing(this.video.parentElement);
            }, 500);
          }
          
          // Reproducir sonido de éxito si está habilitado
          this.playSound('success');
          break;
          
        case 'warning':
          // Feedback visual sutil para advertencia
          this.playSound('detection');
          break;
          
        case 'error':
          // Shake para error
          if (this.video) {
            this.uiEffects.shakeElement(this.video.parentElement);
          }
          this.playSound('error');
          break;
      }
    }
  }

  /**
   * Mostrar feedback de detección correcta
   * @param {HTMLElement} element - Elemento donde mostrar el feedback
   * @param {number} points - Puntos ganados (opcional)
   */
  showCorrectFeedback(element, points = null) {
    if (!this.config.enableVisualFeedback || !this.uiEffects) return;
    
    this.uiEffects.showSuccess(element);
    
    if (points && points > 0) {
      this.uiEffects.animatePoints(element, points, points > 50 ? 'bonus' : 'normal');
    }
    
    this.playSound('success');
  }

  /**
   * Mostrar feedback de detección incorrecta
   * @param {HTMLElement} element - Elemento donde mostrar el feedback
   */
  showIncorrectFeedback(element) {
    if (!this.config.enableVisualFeedback || !this.uiEffects) return;
    
    this.uiEffects.showError(element);
    this.playSound('error');
  }

  /**
   * Cargar sonidos de feedback
   * @param {Object} soundUrls - URLs de los archivos de sonido
   */
  loadSounds(soundUrls = {}) {
    if (!this.config.enableSounds) return;
    
    try {
      if (soundUrls.success) {
        this.sounds.success = new Audio(soundUrls.success);
        this.sounds.success.volume = 0.3;
      }
      
      if (soundUrls.error) {
        this.sounds.error = new Audio(soundUrls.error);
        this.sounds.error.volume = 0.3;
      }
      
      if (soundUrls.detection) {
        this.sounds.detection = new Audio(soundUrls.detection);
        this.sounds.detection.volume = 0.2;
      }
      
      console.log('Sounds loaded successfully');
    } catch (error) {
      console.warn('Error loading sounds:', error);
    }
  }

  /**
   * Reproducir sonido de feedback
   * @param {string} type - Tipo de sonido: 'success', 'error', 'detection'
   */
  playSound(type) {
    if (!this.config.enableSounds || !this.sounds[type]) return;
    
    try {
      // Reiniciar el sonido si ya está reproduciéndose
      this.sounds[type].currentTime = 0;
      this.sounds[type].play().catch(err => {
        // Ignorar errores de reproducción (puede ocurrir si el usuario no ha interactuado)
        console.debug('Sound play prevented:', err);
      });
    } catch (error) {
      console.debug('Error playing sound:', error);
    }
  }

  /**
   * Habilitar/deshabilitar sonidos
   * @param {boolean} enabled - true para habilitar, false para deshabilitar
   */
  setSoundsEnabled(enabled) {
    this.config.enableSounds = enabled;
  }

  /**
   * Habilitar/deshabilitar feedback visual
   * @param {boolean} enabled - true para habilitar, false para deshabilitar
   */
  setVisualFeedbackEnabled(enabled) {
    this.config.enableVisualFeedback = enabled;
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
