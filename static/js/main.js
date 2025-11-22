class GestureDetectionApp {
    constructor() {
        this.video = document.getElementById('videoElement');
        this.canvas = document.getElementById('overlayCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDetecting = false;
        this.stream = null;
        this.detectionInterval = null;
        this.gestureHistory = [];
        this.maxHistorySize = 5;
        
        // Control de estado de gestos para evitar duplicados
        this.lastRecognizedGesture = null;
        this.gestureStateTimeout = null;
        this.gestureHoldTime = 500; // 0.5 segundos para considerar gesto "sostenido"
        this.isGestureActive = false;
        
        // Variables para captura de gestos
        this.isCapturing = false;
        this.capturedLandmarks = [];
        this.capturePanel = document.getElementById('capturePanel');
        this.gestureNameInput = document.getElementById('gestureNameInput');
        this.gestureDescInput = document.getElementById('gestureDescInput');
        this.gestureCategorySelect = document.getElementById('gestureCategorySelect');
        this.startCaptureBtn = document.getElementById('startCaptureBtn');
        this.saveCaptureBtn = document.getElementById('saveCaptureBtn');
        this.cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
        this.captureStatus = document.getElementById('captureStatus');
        
        // Variables para respuestas del agente
        this.agentResponse = document.getElementById('agentResponse');
        this.lastAgentResponse = null;
        this.agentPollingInterval = null;
        
        // Variables para demostración visual
        this.gestureDemo = document.getElementById('gestureDemo');
        this.gestureVisual = document.getElementById('gestureVisual');
        this.demoGestureName = document.getElementById('demoGestureName');
        this.gestureSteps = document.getElementById('gestureSteps');
        this.closeDemoBtn = document.getElementById('closeDemoBtn');
        
        // Control de timeout y detección
        this.lastHandDetectionTime = null;
        this.noHandsTimeout = 5000; // 5 segundos
        this.timeoutWarningShown = false;
        this.positioningGuideShown = false;
        this.consecutiveNoDetections = 0;
        this.maxConsecutiveNoDetections = 15; // ~4.5 segundos a 300ms por frame
        
        // Inicializar visualizador de manos
        this.handVisualizer = null;
        
        // Referencias a elementos DOM
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.showTipsBtn = document.getElementById('showTipsBtn');
        this.captureGestureBtn = document.getElementById('captureGestureBtn');
        this.currentGesture = document.getElementById('currentGesture');
        this.confidenceLevel = document.getElementById('confidenceLevel');
        this.gestureHistoryEl = document.getElementById('gestureHistory');
        this.availableGesturesEl = document.getElementById('availableGesturesList');
        this.handIndicator = document.getElementById('handIndicator');
        this.messagePanel = document.getElementById('messagePanel');
        this.messageText = document.getElementById('messageText');
        this.closeMessage = document.getElementById('closeMessage');
        
        // Estados de elementos
        this.cameraStatus = document.getElementById('cameraStatus').querySelector('.status-value');
        this.detectionStatus = document.getElementById('detectionStatus').querySelector('.status-value');
        this.connectionStatus = document.getElementById('connectionStatus').querySelector('.status-value');
        
        this.initializeApp();
    }

    async initializeApp() {
        this.setupEventListeners();
        await this.loadAvailableGestures();
        this.updateConnectionStatus();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startDetection());
        this.stopBtn.addEventListener('click', () => this.stopDetection());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.showTipsBtn.addEventListener('click', () => this.showDetectionTips());
        this.captureGestureBtn.addEventListener('click', () => this.showCapturePanel());
        
        // Botón de gestionar gestos
        this.manageGesturesBtn = document.getElementById('manageGesturesBtn');
        this.manageGesturesBtn.addEventListener('click', () => this.showGestureManager());
        
        // Botones de gestos del cliente
        this.setupGestureButtons();
        this.startCaptureBtn.addEventListener('click', () => this.startGestureCapture());
        this.saveCaptureBtn.addEventListener('click', () => this.saveGesture());
        this.cancelCaptureBtn.addEventListener('click', () => this.hideCapturePanel());
        this.closeDemoBtn.addEventListener('click', () => this.hideGestureDemo());
        this.closeMessage.addEventListener('click', () => this.hideMessage());
        
        // Manejar redimensionamiento del video
        this.video.addEventListener('loadedmetadata', () => {
            this.resizeCanvas();
        });
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    async loadAvailableGestures() {
        try {
            const response = await fetch('/get_gestures');
            if (response.ok) {
                const data = await response.json();
                this.displayAvailableGestures(data.gestures || []);
            } else {
                console.error('Error cargando gestos disponibles');
            }
        } catch (error) {
            console.error('Error conectando con el servidor:', error);
            this.updateConnectionStatus(false);
        }
    }

    displayAvailableGestures(gestures) {
        this.availableGesturesEl.innerHTML = '';
        gestures.forEach(gesture => {
            const gestureItem = document.createElement('div');
            gestureItem.className = 'gesture-item';
            
            // Verificar si gesture es un objeto o string
            let gestureName = '';
            if (typeof gesture === 'object' && gesture.name) {
                gestureName = gesture.name;
                gestureItem.textContent = gesture.name;
                gestureItem.title = gesture.description || '';
            } else if (typeof gesture === 'string') {
                gestureName = gesture;
                gestureItem.textContent = gesture;
            } else {
                gestureItem.textContent = 'Gesto desconocido';
            }
            
            // Agregar botón de eliminar (solo visible en modo gestión)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-gesture-btn hidden';
            deleteBtn.textContent = '❌';
            deleteBtn.title = `Eliminar gesto: ${gestureName}`;
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteGesture(gestureName);
            };
            
            gestureItem.appendChild(deleteBtn);
            this.availableGesturesEl.appendChild(gestureItem);
        });
    }
    
    showGestureManager() {
        // Mostrar/ocultar botones de eliminar
        const deleteButtons = document.querySelectorAll('.delete-gesture-btn');
        const isManaging = !deleteButtons[0]?.classList.contains('hidden');
        
        deleteButtons.forEach(btn => {
            if (isManaging) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });
        
        // Cambiar texto del botón
        this.manageGesturesBtn.textContent = isManaging ? 'Gestionar Gestos' : 'Terminar Gestión';
        
        if (!isManaging) {
            this.showMessage('Haga clic en ❌ para eliminar gestos', 'info');
        }
    }
    
    async deleteGesture(gestureName) {
        if (!confirm(`¿Está seguro de eliminar el gesto "${gestureName}"?`)) {
            return;
        }
        
        try {
            const response = await fetch('/delete_gesture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: gestureName
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showMessage(`Gesto "${gestureName}" eliminado exitosamente`, 'success');
                await this.loadAvailableGestures(); // Recargar lista
            } else {
                const error = await response.json();
                this.showMessage(`Error eliminando gesto: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error eliminando gesto:', error);
            this.showMessage('Error de conexión al eliminar el gesto', 'error');
        }
    }

    async startDetection() {
        try {
            // Verificar si MediaDevices está disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
            }

            // Verificar si hay dispositivos de video disponibles
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length === 0) {
                throw new Error('NO_CAMERA_FOUND');
            }

            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = this.stream;
            this.updateCameraStatus(true);
            
            // Esperar a que el video esté listo con timeout
            await Promise.race([
                new Promise((resolve) => {
                    this.video.onloadedmetadata = resolve;
                }),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('VIDEO_LOAD_TIMEOUT')), 10000);
                })
            ]);
            
            // Verificar que el video tenga dimensiones válidas
            if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
                throw new Error('INVALID_VIDEO_DIMENSIONS');
            }
            
            this.resizeCanvas();
            this.isDetecting = true;
            this.updateDetectionStatus(true);
            this.updateButtons();
            this.hideHandIndicator();
            
            // Resetear variables de timeout
            this.lastHandDetectionTime = null;
            this.timeoutWarningShown = false;
            this.positioningGuideShown = false;
            this.consecutiveNoDetections = 0;
            
            // Iniciar detección cada 300ms (aproximadamente 3 FPS)
            this.detectionInterval = setInterval(() => {
                this.captureAndDetect();
            }, 300);
            
            // Iniciar polling para respuestas del agente
            this.startAgentPolling();
            
            this.showMessage('Detección iniciada correctamente', 'success');
            
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        let errorMessage = '';
        let errorType = 'error';
        
        // Determinar el tipo de error y mensaje apropiado
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = 'Acceso a la cámara denegado. Por favor, permita el acceso a la cámara en su navegador y recargue la página.';
            this.showCameraPermissionGuide();
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError' || error.message === 'NO_CAMERA_FOUND') {
            errorMessage = 'No se encontró ninguna cámara conectada. Verifique que su cámara esté conectada y funcionando.';
            this.showCameraConnectionGuide();
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = 'La cámara está siendo utilizada por otra aplicación. Cierre otras aplicaciones que puedan estar usando la cámara.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage = 'La configuración de cámara solicitada no es compatible. Intentando con configuración básica...';
            this.tryBasicCameraConfig();
            return;
        } else if (error.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
            errorMessage = 'Su navegador no soporta acceso a la cámara. Use un navegador moderno como Chrome, Firefox o Edge.';
        } else if (error.message === 'VIDEO_LOAD_TIMEOUT') {
            errorMessage = 'Tiempo de espera agotado al cargar la cámara. Verifique su conexión y intente nuevamente.';
        } else if (error.message === 'INVALID_VIDEO_DIMENSIONS') {
            errorMessage = 'Error en la configuración de video. Intente reiniciar la cámara.';
        } else {
            errorMessage = `Error de cámara: ${error.message || 'Error desconocido'}. Verifique su cámara y permisos.`;
        }
        
        this.showMessage(errorMessage, errorType);
        this.updateCameraStatus(false);
        this.updateDetectionStatus(false);
        this.updateButtons();
        this.showCameraErrorIndicator();
    }

    async tryBasicCameraConfig() {
        try {
            // Intentar con configuración más básica
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            
            this.video.srcObject = this.stream;
            this.updateCameraStatus(true);
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            
            this.resizeCanvas();
            this.isDetecting = true;
            this.updateDetectionStatus(true);
            this.updateButtons();
            this.hideHandIndicator();
            
            // Resetear variables de timeout
            this.lastHandDetectionTime = null;
            this.timeoutWarningShown = false;
            this.positioningGuideShown = false;
            this.consecutiveNoDetections = 0;
            
            this.detectionInterval = setInterval(() => {
                this.captureAndDetect();
            }, 300);
            
            this.showMessage('Detección iniciada con configuración básica', 'success');
            
        } catch (basicError) {
            console.error('Error con configuración básica:', basicError);
            this.handleCameraError(basicError);
        }
    }

    stopDetection() {
        this.isDetecting = false;
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.clearCanvas();
        this.showHandIndicator();
        
        this.updateCameraStatus(false);
        this.updateDetectionStatus(false);
        this.updateButtons();
        this.resetCurrentResult();
        this.clearGestureState(); // Limpiar estado de gestos
        this.stopAgentPolling(); // Detener polling del agente
        
        this.showMessage('Detección detenida', 'info');
    }

    async captureAndDetect() {
        if (!this.isDetecting || !this.video.videoWidth) return;
        
        try {
            // Crear canvas temporal para capturar el frame
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.video.videoWidth;
            tempCanvas.height = this.video.videoHeight;
            
            // Dibujar el frame actual
            tempCtx.drawImage(this.video, 0, 0);
            
            // Convertir a base64 para enviar al servidor
            const imageData = tempCanvas.toDataURL('image/jpeg', 0.8);
            
            try {
                const response = await fetch('/detect_gesture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image: imageData
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.handleDetectionResult(result);
                    this.updateConnectionStatus(true);
                } else {
                    console.error('Error en la detección:', response.statusText);
                    this.updateConnectionStatus(false);
                }
            } catch (error) {
                console.error('Error enviando frame:', error);
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error capturando frame:', error);
        }
    }

    handleDetectionResult(result) {
        const currentTime = Date.now();
        
        // Mostrar información de rendimiento si está disponible
        if (result.from_cache || result.frame_skipped) {
            this.showPerformanceInfo(result);
        }
        
        if (result.hands_detected) {
            // Se detectó mano - resetear contadores de timeout
            this.lastHandDetectionTime = currentTime;
            this.consecutiveNoDetections = 0;
            this.timeoutWarningShown = false;
            this.positioningGuideShown = false;
            
            // Mostrar landmarks y visualización
            if (result.landmarks) {
                // Guardar landmarks de una sola mano para captura
                this.lastDetectedLandmarks = result.single_hand_landmarks || result.landmarks[0];
                // Dibujar todas las manos detectadas
                this.drawLandmarks(result.landmarks);
            }
            
            // Usar el nuevo visualizador de manos si está disponible
            if (this.handVisualizer) {
                this.handVisualizer.visualize(result);
            }
            this.showHandDetectedIndicator(result.num_hands);
            
            if (result.success && result.gesture) {
                // Gesto reconocido
                console.log(`✅ Gesto reconocido: ${result.gesture} (${Math.round(result.confidence * 100)}%)`);
                this.displayCurrentResult(result.gesture, result.confidence, true);
                this.handleGestureRecognition(result.gesture, result.confidence);
            } else {
                // Mano detectada pero gesto no reconocido
                console.log(`❓ Gesto no reconocido. Confianza: ${Math.round((result.confidence || 0) * 100)}%`);
                this.displayCurrentResult(result.message || 'Seña no reconocida', result.confidence || 0, false);
                this.resetGestureState();
            }
        } else {
            // No se detectó mano - manejar timeout
            this.consecutiveNoDetections++;
            this.handleNoHandsDetected(currentTime);
            this.clearCanvas();
            
            // Limpiar visualización cuando no hay manos
            if (this.handVisualizer) {
                this.handVisualizer.visualize(result);
            }
            
            // Resetear estado de gesto cuando no hay mano
            this.resetGestureState();
        }
    }

    handleNoHandsDetected(currentTime) {
        // Si es la primera vez que no se detecta mano, inicializar el tiempo
        if (this.lastHandDetectionTime === null) {
            this.lastHandDetectionTime = currentTime;
        }
        
        const timeSinceLastDetection = currentTime - this.lastHandDetectionTime;
        
        // Mostrar diferentes mensajes según el tiempo transcurrido
        if (timeSinceLastDetection > this.noHandsTimeout) {
            // Timeout alcanzado - mostrar guía de posicionamiento
            if (!this.positioningGuideShown) {
                this.showPositioningGuide();
                this.positioningGuideShown = true;
            }
            this.displayCurrentResult('Timeout: Coloque su mano frente a la cámara', 0, false);
            this.showTimeoutIndicator();
        } else if (timeSinceLastDetection > this.noHandsTimeout * 0.6) {
            // 60% del timeout - mostrar advertencia
            if (!this.timeoutWarningShown) {
                this.showMessage('Coloque su mano frente a la cámara para continuar', 'warning');
                this.timeoutWarningShown = true;
            }
            this.displayCurrentResult('Buscando mano...', 0, false);
            this.showSearchingIndicator();
        } else if (this.consecutiveNoDetections > 5) {
            // Varias detecciones consecutivas sin mano
            this.displayCurrentResult('No se detectó ninguna mano', 0, false);
            this.showNoHandIndicator();
        } else {
            // Primeras detecciones sin mano
            this.displayCurrentResult('Esperando mano...', 0, false);
            this.hideHandDetectedIndicator();
        }
    }

    handleGestureRecognition(gesture, confidence) {
        console.log(`🔍 Gesto detectado: ${gesture}, Último: ${this.lastRecognizedGesture}, Activo: ${this.isGestureActive}`);
        
        // Verificar si es un gesto nuevo o diferente
        if (this.lastRecognizedGesture !== gesture) {
            // Gesto nuevo - agregar al historial inmediatamente
            console.log(`✅ Agregando gesto NUEVO al historial: ${gesture}`);
            this.addToHistory(gesture, confidence, true);
            this.lastRecognizedGesture = gesture;
            this.isGestureActive = true;
            
            // Limpiar timeout anterior si existe
            if (this.gestureStateTimeout) {
                clearTimeout(this.gestureStateTimeout);
            }
            
            // Configurar timeout para resetear estado
            this.gestureStateTimeout = setTimeout(() => {
                console.log(`⏰ Timeout: Reseteando estado para ${gesture}`);
                this.resetGestureState();
            }, this.gestureHoldTime);
            
        } else if (!this.isGestureActive) {
            // Mismo gesto pero después de una pausa - agregar al historial
            console.log(`✅ Agregando gesto REACTIVADO al historial: ${gesture}`);
            this.addToHistory(gesture, confidence, true);
            this.isGestureActive = true;
            
            // Configurar timeout para resetear estado
            this.gestureStateTimeout = setTimeout(() => {
                console.log(`⏰ Timeout: Reseteando estado para ${gesture}`);
                this.resetGestureState();
            }, this.gestureHoldTime);
        } else {
            // Si es el mismo gesto y está activo, no hacer nada (evitar duplicados)
            console.log(`❌ BLOQUEANDO gesto duplicado: ${gesture}`);
        }
    }

    resetGestureState() {
        // Resetear el estado de reconocimiento de gestos
        console.log(`🔄 Reseteando estado de gesto. Último gesto: ${this.lastRecognizedGesture}`);
        this.isGestureActive = false;
        
        // Limpiar timeout si existe
        if (this.gestureStateTimeout) {
            clearTimeout(this.gestureStateTimeout);
            this.gestureStateTimeout = null;
        }
        
        // No resetear lastRecognizedGesture aquí para permitir detección de cambios
    }

    clearGestureState() {
        // Limpiar completamente el estado (usado cuando se para la detección)
        this.lastRecognizedGesture = null;
        this.isGestureActive = false;
        
        if (this.gestureStateTimeout) {
            clearTimeout(this.gestureStateTimeout);
            this.gestureStateTimeout = null;
        }
    }

    showPositioningGuide() {
        const guideMessage = `
            <div class="positioning-guide">
                <h4>📋 Guía de Posicionamiento</h4>
                <p>Para una mejor detección de señas, siga estas recomendaciones:</p>
                <ul>
                    <li><strong>Distancia:</strong> Mantenga su mano a 30-60 cm de la cámara</li>
                    <li><strong>Iluminación:</strong> Asegúrese de tener buena luz en su rostro y manos</li>
                    <li><strong>Fondo:</strong> Use un fondo contrastante (preferiblemente liso)</li>
                    <li><strong>Posición:</strong> Centre su mano en el área de video</li>
                    <li><strong>Movimiento:</strong> Mantenga la mano relativamente estable</li>
                </ul>
                <p><em>El sistema detectará automáticamente cuando coloque su mano correctamente.</em></p>
            </div>
        `;
        this.showDetailedMessage(guideMessage, 'warning');
    }

    resetDetectionTimeout() {
        // Método para resetear el timeout cuando se detecta una mano
        this.lastHandDetectionTime = Date.now();
        this.consecutiveNoDetections = 0;
        this.timeoutWarningShown = false;
        this.positioningGuideShown = false;
    }

    getDetectionTips() {
        return [
            'Mantenga su mano centrada en el área de video',
            'Asegúrese de que todos los dedos sean visibles',
            'Evite movimientos bruscos durante la detección',
            'Use gestos claros y definidos',
            'Mantenga una distancia apropiada de la cámara'
        ];
    }

    showDetectionTips() {
        const tips = this.getDetectionTips();
        const tipsMessage = `
            <div class="detection-tips">
                <h4>💡 Consejos para Mejor Detección</h4>
                <ul>
                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
                <p><em>Estos consejos le ayudarán a obtener mejores resultados en el reconocimiento de señas.</em></p>
            </div>
        `;
        this.showDetailedMessage(tipsMessage, 'info');
    }

    showTimeoutIndicator() {
        this.handIndicator.innerHTML = `
            <div class="timeout-indicator">
                <span class="timeout-icon">⏰</span>
                <span>Timeout de Detección</span>
                <small>Coloque su mano frente a la cámara</small>
            </div>
        `;
        this.handIndicator.style.background = 'rgba(243, 156, 18, 0.9)';
        this.handIndicator.classList.remove('hidden');
    }

    showSearchingIndicator() {
        this.handIndicator.innerHTML = `
            <div class="searching-indicator">
                <span class="searching-icon">🔍</span>
                <span>Buscando Mano...</span>
                <small>Asegúrese de que su mano esté visible</small>
            </div>
        `;
        this.handIndicator.style.background = 'rgba(52, 152, 219, 0.8)';
        this.handIndicator.classList.remove('hidden');
    }

    showNoHandIndicator() {
        this.handIndicator.innerHTML = `
            <div class="no-hand-indicator">
                <span class="no-hand-icon">👋</span>
                <span>No se Detectó Mano</span>
                <small>Coloque su mano frente a la cámara</small>
            </div>
        `;
        this.handIndicator.style.background = 'rgba(149, 165, 166, 0.8)';
        this.handIndicator.classList.remove('hidden');
    }

    displayCurrentResult(gesture, confidence, success) {
        const gestureText = this.currentGesture.querySelector('.gesture-text');
        gestureText.textContent = gesture;
        
        // Actualizar clases CSS
        this.currentGesture.className = 'gesture-result';
        if (success) {
            this.currentGesture.classList.add('success');
        } else {
            this.currentGesture.classList.add('error');
        }
        
        // Mostrar confianza siempre que haya un valor válido
        if (confidence > 0) {
            const confidencePercent = Math.round(confidence * 100);
            this.confidenceLevel.textContent = `${confidencePercent}%`;
            this.confidenceLevel.className = 'confidence-level';
            
            // Aplicar colores según nivel de confianza
            if (confidence >= 0.8) {
                this.confidenceLevel.classList.add('high');
                this.confidenceLevel.title = 'Confianza alta - Reconocimiento excelente';
            } else if (confidence >= 0.7) {
                this.confidenceLevel.classList.add('medium');
                this.confidenceLevel.title = 'Confianza media - Reconocimiento bueno';
            } else if (confidence >= 0.5) {
                this.confidenceLevel.classList.add('low');
                this.confidenceLevel.title = 'Confianza baja - Intente mejorar la posición';
            } else {
                this.confidenceLevel.classList.add('very-low');
                this.confidenceLevel.title = 'Confianza muy baja - Reposicione su mano';
            }
            
            // Mostrar indicador visual adicional en el canvas
            this.drawConfidenceIndicator(confidence);
        } else {
            this.confidenceLevel.textContent = '';
            this.confidenceLevel.className = 'confidence-level';
            this.confidenceLevel.title = '';
        }
    }

    addToHistory(gesture, confidence, success) {
        const timestamp = new Date().toLocaleTimeString();
        const historyItem = {
            gesture,
            confidence,
            success,
            timestamp
        };
        
        // Agregar al inicio del array
        this.gestureHistory.unshift(historyItem);
        
        // Mantener solo los últimos 5 elementos
        if (this.gestureHistory.length > this.maxHistorySize) {
            this.gestureHistory = this.gestureHistory.slice(0, this.maxHistorySize);
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        this.gestureHistoryEl.innerHTML = '';
        
        this.gestureHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.success ? 'success' : 'error'} fade-in`;
            
            // Crear indicador de confianza para el historial
            let confidenceClass = '';
            let confidenceText = '';
            
            if (item.confidence > 0) {
                const confidencePercent = Math.round(item.confidence * 100);
                confidenceText = `${confidencePercent}%`;
                
                if (item.confidence >= 0.8) {
                    confidenceClass = 'confidence-high';
                } else if (item.confidence >= 0.7) {
                    confidenceClass = 'confidence-medium';
                } else if (item.confidence >= 0.5) {
                    confidenceClass = 'confidence-low';
                } else {
                    confidenceClass = 'confidence-very-low';
                }
            }
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <span class="history-gesture">${item.gesture}</span>
                    ${confidenceText ? `<span class="history-confidence ${confidenceClass}">${confidenceText}</span>` : ''}
                </div>
                <span class="history-time">${item.timestamp}</span>
            `;
            
            this.gestureHistoryEl.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.gestureHistory = [];
        this.updateHistoryDisplay();
        this.clearGestureState(); // Resetear estado de gestos también
        this.showMessage('Historial limpiado', 'info');
    }

    drawLandmarks(landmarks) {
        this.clearCanvas();
        
        if (!landmarks || landmarks.length === 0) return;
        
        // Verificar si landmarks es una lista de manos o una sola mano
        let handsData = [];
        if (Array.isArray(landmarks[0]) && landmarks[0].length === 3) {
            // Es una sola mano (21 puntos de [x,y,z])
            handsData = [landmarks];
        } else if (Array.isArray(landmarks) && Array.isArray(landmarks[0])) {
            // Es una lista de manos
            handsData = landmarks;
        } else {
            return;
        }
        
        // Configurar estilos para los puntos
        this.ctx.lineWidth = 2;
        
        // Dibujar cada mano detectada
        handsData.forEach((handLandmarks, handIndex) => {
            // Colores diferentes para cada mano
            const handColors = [
                { main: '#00ff00', wrist: '#ff0000', tips: '#ffff00' }, // Mano 1: Verde
                { main: '#00ffff', wrist: '#ff00ff', tips: '#ff8800' }  // Mano 2: Cian
            ];
            
            const colors = handColors[handIndex] || handColors[0];
            
            // Dibujar conexiones primero
            this.drawHandConnections(handLandmarks, colors.main);
            
            // Dibujar los 21 puntos clave
            handLandmarks.forEach((point, index) => {
                const x = point[0] * this.canvas.width;
                const y = point[1] * this.canvas.height;
                
                // Diferentes colores para diferentes tipos de puntos
                if (index === 0) {
                    // Muñeca - punto central
                    this.ctx.fillStyle = colors.wrist;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
                    this.ctx.fill();
                } else if ([4, 8, 12, 16, 20].includes(index)) {
                    // Puntas de los dedos
                    this.ctx.fillStyle = colors.tips;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    this.ctx.fill();
                } else {
                    // Articulaciones
                    this.ctx.fillStyle = colors.main;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
                
                // Numerar puntos clave para referencia
                if ([0, 4, 8, 12, 16, 20].includes(index)) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.strokeText(index.toString(), x + 8, y - 8);
                    this.ctx.fillText(index.toString(), x + 8, y - 8);
                }
            });
        });
        
        // Mostrar contador de puntos detectados
        const totalPoints = handsData.reduce((sum, hand) => sum + hand.length, 0);
        this.drawLandmarkInfo(totalPoints, handsData.length);
    }

    drawHandConnections(landmarks, color = '#00ff00') {
        // Conexiones de los dedos según MediaPipe Hand model
        const connections = [
            // Pulgar
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Índice  
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Medio
            [0, 9], [9, 10], [10, 11], [11, 12],
            // Anular
            [0, 13], [13, 14], [14, 15], [15, 16],
            // Meñique
            [0, 17], [17, 18], [18, 19], [19, 20],
            // Conexiones entre dedos (palma)
            [5, 9], [9, 13], [13, 17]
        ];
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.7;
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                const startX = landmarks[start][0] * this.canvas.width;
                const startY = landmarks[start][1] * this.canvas.height;
                const endX = landmarks[end][0] * this.canvas.width;
                const endY = landmarks[end][1] * this.canvas.height;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        });
        
        this.ctx.globalAlpha = 1.0; // Restaurar opacidad
    }

    resizeCanvas() {
        if (this.video.videoWidth && this.video.videoHeight) {
            this.canvas.width = this.video.offsetWidth;
            this.canvas.height = this.video.offsetHeight;
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateButtons() {
        this.startBtn.disabled = this.isDetecting;
        this.stopBtn.disabled = !this.isDetecting;
    }

    updateCameraStatus(connected) {
        this.cameraStatus.textContent = connected ? 'Conectada' : 'Desconectada';
        this.cameraStatus.className = `status-value ${connected ? 'connected' : 'disconnected'}`;
    }

    updateDetectionStatus(active) {
        this.detectionStatus.textContent = active ? 'Activa' : 'Inactiva';
        this.detectionStatus.className = `status-value ${active ? 'active' : 'inactive'}`;
    }

    updateConnectionStatus(connected = true) {
        this.connectionStatus.textContent = connected ? 'Conectado' : 'Desconectado';
        this.connectionStatus.className = `status-value ${connected ? 'connected' : 'disconnected'}`;
    }

    showHandIndicator() {
        this.handIndicator.classList.remove('hidden');
    }

    hideHandIndicator() {
        this.handIndicator.classList.add('hidden');
    }

    resetCurrentResult() {
        this.displayCurrentResult('Esperando detección...', 0, false);
        this.currentGesture.className = 'gesture-result';
    }

    showMessage(message, type = 'info') {
        this.messageText.textContent = message;
        this.messagePanel.querySelector('.message-content').className = `message-content ${type}`;
        this.messagePanel.classList.remove('hidden');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hideMessage();
        }, 5000);
    }

    hideMessage() {
        this.messagePanel.classList.add('hidden');
    }

    showHandDetectedIndicator(numHands = 1) {
        // Cambiar el indicador para mostrar cuántas manos se detectaron
        if (numHands === 1) {
            this.handIndicator.textContent = '✓ 1 Mano detectada';
            this.handIndicator.style.background = 'rgba(39, 174, 96, 0.8)';
        } else if (numHands === 2) {
            this.handIndicator.textContent = '🙌 2 Manos detectadas';
            this.handIndicator.style.background = 'rgba(33, 150, 243, 0.8)';
        } else {
            this.handIndicator.textContent = `👋 ${numHands} Manos detectadas`;
            this.handIndicator.style.background = 'rgba(156, 39, 176, 0.8)';
        }
        this.handIndicator.classList.remove('hidden');
    }

    hideHandDetectedIndicator() {
        // Restaurar el indicador original
        this.handIndicator.textContent = 'Coloque su mano frente a la cámara';
        this.handIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
        if (!this.isDetecting) {
            this.handIndicator.classList.remove('hidden');
        }
    }

    drawLandmarkInfo(landmarkCount, numHands = 1) {
        // Mostrar información de landmarks en la esquina superior izquierda
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 220, 90);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`Puntos detectados: ${landmarkCount}/${numHands * 21}`, 20, 30);
        
        // Mostrar estado de manos con colores
        if (numHands === 1) {
            this.ctx.fillText(`🤚 1 Mano detectada`, 20, 50);
            this.ctx.fillText('🟢 Verde: Mano principal', 20, 70);
        } else if (numHands === 2) {
            this.ctx.fillText(`🙌 2 Manos detectadas`, 20, 50);
            this.ctx.fillText('🟢 Verde: Mano 1  🔵 Cian: Mano 2', 20, 70);
        } else {
            this.ctx.fillText(`👋 ${numHands} Manos detectadas`, 20, 50);
        }
        
        this.ctx.fillText('🔴 Muñeca  🟡 Puntas  🟢 Articulaciones', 20, 90);
    }

    drawConfidenceIndicator(confidence) {
        // Dibujar barra de confianza en la esquina superior derecha
        const barWidth = 120;
        const barHeight = 20;
        const x = this.canvas.width - barWidth - 20;
        const y = 20;
        
        // Fondo de la barra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 10, y - 10, barWidth + 20, barHeight + 20);
        
        // Borde de la barra
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Llenar barra según confianza
        const fillWidth = barWidth * confidence;
        let fillColor;
        
        if (confidence >= 0.8) {
            fillColor = '#27ae60'; // Verde alto
        } else if (confidence >= 0.7) {
            fillColor = '#f39c12'; // Amarillo medio
        } else if (confidence >= 0.5) {
            fillColor = '#e67e22'; // Naranja bajo
        } else {
            fillColor = '#e74c3c'; // Rojo muy bajo
        }
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, fillWidth, barHeight);
        
        // Texto de confianza
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.round(confidence * 100)}%`, x + barWidth/2, y + barHeight/2 + 4);
        this.ctx.textAlign = 'left'; // Restaurar alineación
        
        // Etiqueta
        this.ctx.font = '10px Arial';
        this.ctx.fillText('Confianza', x, y - 5);
    }

    showCameraPermissionGuide() {
        // Mostrar guía específica para permisos de cámara
        const guideMessage = `
            <div class="error-guide">
                <h4>🔒 Permisos de Cámara Requeridos</h4>
                <p>Para usar el sistema de detección de señas, necesita permitir el acceso a su cámara:</p>
                <ol>
                    <li>Busque el ícono de cámara en la barra de direcciones</li>
                    <li>Haga clic en "Permitir" o "Allow"</li>
                    <li>Si ya bloqueó el acceso, haga clic en el ícono de candado y cambie los permisos</li>
                    <li>Recargue la página después de cambiar los permisos</li>
                </ol>
            </div>
        `;
        this.showDetailedMessage(guideMessage, 'error');
    }

    showCameraConnectionGuide() {
        // Mostrar guía para problemas de conexión de cámara
        const guideMessage = `
            <div class="error-guide">
                <h4>📹 Cámara No Detectada</h4>
                <p>No se encontró ninguna cámara disponible. Verifique lo siguiente:</p>
                <ol>
                    <li>Asegúrese de que su cámara esté conectada correctamente</li>
                    <li>Verifique que la cámara funcione en otras aplicaciones</li>
                    <li>Reinicie su navegador e intente nuevamente</li>
                    <li>Si usa una cámara externa, desconéctela y vuelva a conectarla</li>
                </ol>
            </div>
        `;
        this.showDetailedMessage(guideMessage, 'error');
    }

    showCameraErrorIndicator() {
        // Mostrar indicador de error en el área de video
        this.handIndicator.innerHTML = `
            <div class="camera-error-indicator">
                <span class="error-icon">⚠️</span>
                <span>Error de Cámara</span>
                <small>Verifique permisos y conexión</small>
            </div>
        `;
        this.handIndicator.style.background = 'rgba(231, 76, 60, 0.9)';
        this.handIndicator.classList.remove('hidden');
    }

    showDetailedMessage(htmlContent, type = 'error') {
        // Crear un panel de mensaje más detallado
        const detailedPanel = document.createElement('div');
        detailedPanel.className = 'detailed-message-panel';
        detailedPanel.innerHTML = `
            <div class="detailed-message-content ${type}">
                ${htmlContent}
                <button class="close-detailed-btn">&times;</button>
            </div>
        `;
        
        document.body.appendChild(detailedPanel);
        
        // Agregar evento para cerrar
        const closeBtn = detailedPanel.querySelector('.close-detailed-btn');
        closeBtn.addEventListener('click', () => {
            detailedPanel.remove();
        });
        
        // Auto-cerrar después de 15 segundos
        setTimeout(() => {
            if (detailedPanel.parentNode) {
                detailedPanel.remove();
            }
        }, 15000);
    }

    showPerformanceInfo(result) {
        // Mostrar información de rendimiento en la esquina inferior izquierda del canvas
        if (!this.canvas || !this.ctx) return;
        
        const perfInfo = [];
        
        if (result.from_cache) {
            perfInfo.push(`📋 Cache (${result.cache_age_ms}ms)`);
        }
        
        if (result.frame_skipped) {
            perfInfo.push(`⏭️ Frame ${result.frame_number || 'N/A'}`);
        }
        
        if (result.frame_processed) {
            perfInfo.push(`🔄 Procesado`);
        }
        
        if (perfInfo.length > 0) {
            // Dibujar fondo semi-transparente
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(10, this.canvas.height - 60, 200, 50);
            
            // Dibujar texto de rendimiento
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            
            perfInfo.forEach((info, index) => {
                this.ctx.fillText(info, 15, this.canvas.height - 45 + (index * 12));
            });
        }
    }

    // === FUNCIONES DE COMUNICACIÓN CON AGENTE ===
    
    startAgentPolling() {
        this.agentPollingInterval = setInterval(async () => {
            await this.checkAgentResponse();
        }, 1000); // Verificar cada segundo
    }
    
    stopAgentPolling() {
        if (this.agentPollingInterval) {
            clearInterval(this.agentPollingInterval);
            this.agentPollingInterval = null;
        }
    }
    
    async checkAgentResponse() {
        try {
            const response = await fetch('/get_agent_response');
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.has_response && data.gesture !== this.lastAgentResponse) {
                    this.displayAgentResponse(data);
                    this.lastAgentResponse = data.gesture;
                }
            }
        } catch (error) {
            console.error('Error verificando respuesta del agente:', error);
        }
    }
    
    displayAgentResponse(responseData) {
        const gestureTextEl = this.agentResponse.querySelector('.agent-gesture-text');
        const timestampEl = this.agentResponse.querySelector('.agent-timestamp');
        
        if (gestureTextEl) {
            gestureTextEl.textContent = `${responseData.gesture.toUpperCase()}`;
        }
        
        if (timestampEl) {
            const time = new Date(responseData.timestamp).toLocaleTimeString();
            timestampEl.textContent = `${time}`;
        }
        
        // Agregar clase de animación
        this.agentResponse.classList.add('new-response');
        setTimeout(() => {
            this.agentResponse.classList.remove('new-response');
        }, 2000);
        
        // Mostrar demostración visual del gesto
        this.showGestureDemo(responseData.gesture);
        
        // Mostrar notificación
        this.showMessage(`Agente responde: ${responseData.gesture} - Haga clic para ver cómo hacerlo`, 'info');
    }
    
    showGestureDemo(gestureName) {
        if (!window.gestureVisuals) return;
        
        // Mostrar panel de demostración
        this.gestureDemo.classList.remove('hidden');
        
        // Actualizar nombre del gesto
        this.demoGestureName.textContent = gestureName.toUpperCase();
        
        // Mostrar SVG del gesto
        const svg = window.gestureVisuals.getGestureSVG(gestureName);
        this.gestureVisual.innerHTML = svg;
        
        // Mostrar instrucciones
        const instructions = window.gestureVisuals.getGestureInstructions(gestureName);
        this.gestureSteps.innerHTML = instructions.map(step => `<li>${step}</li>`).join('');
        
        // Scroll hacia la demostración
        this.gestureDemo.scrollIntoView({ behavior: 'smooth' });
    }
    
    hideGestureDemo() {
        this.gestureDemo.classList.add('hidden');
    }

    setupGestureButtons() {
        // Configurar botones de gestos para el cliente
        const gestureButtons = document.querySelectorAll('.gesture-btn');
        gestureButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const gestureName = btn.dataset.gesture;
                this.showGestureDemo(gestureName);
                this.showMessage(`Mostrando cómo hacer: ${gestureName}`, 'info');
            });
        });
    }

    // === FUNCIONES DE CAPTURA DE GESTOS ===
    
    showCapturePanel() {
        this.capturePanel.classList.remove('hidden');
        this.gestureNameInput.focus();
    }

    hideCapturePanel() {
        this.capturePanel.classList.add('hidden');
        this.resetCaptureForm();
    }

    resetCaptureForm() {
        this.gestureNameInput.value = '';
        this.gestureDescInput.value = '';
        this.gestureCategorySelect.value = 'accion';
        this.saveCaptureBtn.disabled = true;
        this.capturedLandmarks = [];
        this.isCapturing = false;
        this.captureStatus.textContent = '';
    }

    async startGestureCapture() {
        if (!this.isDetecting) {
            this.showMessage('Debe iniciar la detección primero', 'error');
            return;
        }

        const gestureName = this.gestureNameInput.value.trim();
        if (!gestureName) {
            this.showMessage('Ingrese un nombre para el gesto', 'error');
            return;
        }

        this.isCapturing = true;
        this.startCaptureBtn.disabled = true;
        this.capturedLandmarks = [];

        // Countdown de 3 segundos
        for (let i = 3; i > 0; i--) {
            this.captureStatus.textContent = `Prepárese... ${i}`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.captureStatus.textContent = '🔴 CAPTURANDO - Mantenga el gesto estable por 2 segundos';
        
        // Capturar durante 2 segundos
        const captureStartTime = Date.now();
        const captureDuration = 2000; // 2 segundos
        const samples = [];

        const captureInterval = setInterval(() => {
            if (this.lastDetectedLandmarks) {
                samples.push(JSON.parse(JSON.stringify(this.lastDetectedLandmarks)));
            }
        }, 100); // Capturar cada 100ms

        setTimeout(() => {
            clearInterval(captureInterval);
            this.finishCapture(samples);
        }, captureDuration);
    }

    finishCapture(samples) {
        this.isCapturing = false;
        this.startCaptureBtn.disabled = false;

        if (samples.length < 10) {
            this.captureStatus.textContent = '❌ Captura fallida - No se detectó mano estable';
            this.showMessage('No se pudo capturar el gesto. Asegúrese de mantener la mano visible y estable.', 'error');
            return;
        }

        // Promediar las muestras para obtener landmarks estables
        this.capturedLandmarks = this.averageLandmarks(samples);
        
        this.captureStatus.textContent = `✅ Gesto capturado exitosamente (${samples.length} muestras)`;
        this.saveCaptureBtn.disabled = false;
        
        this.showMessage(`Gesto capturado con ${samples.length} muestras. Puede guardarlo ahora.`, 'success');
    }

    averageLandmarks(samples) {
        if (samples.length === 0) return null;

        const avgLandmarks = [];
        
        // Inicializar con ceros
        for (let i = 0; i < 21; i++) {
            avgLandmarks.push([0, 0, 0]);
        }

        // Sumar todas las muestras
        samples.forEach(sample => {
            sample.forEach((landmark, i) => {
                avgLandmarks[i][0] += landmark[0];
                avgLandmarks[i][1] += landmark[1];
                avgLandmarks[i][2] += landmark[2];
            });
        });

        // Promediar
        avgLandmarks.forEach(landmark => {
            landmark[0] /= samples.length;
            landmark[1] /= samples.length;
            landmark[2] /= samples.length;
        });

        return avgLandmarks;
    }

    async saveGesture() {
        if (!this.capturedLandmarks) {
            this.showMessage('No hay gesto capturado para guardar', 'error');
            return;
        }

        const gestureData = {
            name: this.gestureNameInput.value.trim(),
            description: this.gestureDescInput.value.trim() || 'Gesto personalizado',
            category: this.gestureCategorySelect.value,
            landmarks: this.capturedLandmarks
        };

        try {
            const response = await fetch('/save_gesture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gestureData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage(`Gesto "${gestureData.name}" guardado exitosamente`, 'success');
                this.hideCapturePanel();
                await this.loadAvailableGestures(); // Recargar lista
            } else {
                const error = await response.json();
                this.showMessage(`Error guardando gesto: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error guardando gesto:', error);
            this.showMessage('Error de conexión al guardar el gesto', 'error');
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new GestureDetectionApp();
});