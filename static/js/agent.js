class AgentInterface {
    constructor() {
        this.isSessionActive = false;
        this.conversationHistory = [];
        this.currentClientGesture = null;
        this.selectedResponse = null;
        this.pollInterval = null;

        // Referencias DOM
        this.clientGesture = document.getElementById('clientGesture');
        this.clientMessage = document.getElementById('clientMessage');
        this.selectedGestureName = document.getElementById('selectedGestureName');
        this.gestureAnimation = document.getElementById('gestureAnimation');
        this.gestureInstructions = document.getElementById('gestureInstructions');
        this.gestureDetails = document.getElementById('gestureDetails');
        this.conversationLog = document.getElementById('conversationLog');
        this.clientConnectionStatus = document.getElementById('clientConnectionStatus');
        this.systemStatus = document.getElementById('systemStatus');

        // Botones
        this.startSessionBtn = document.getElementById('startSessionBtn');
        this.endSessionBtn = document.getElementById('endSessionBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.clearConversationBtn = document.getElementById('clearConversationBtn');
        this.responseButtons = document.querySelectorAll('.response-btn');

        // Datos de gestos
        this.gestureDatabase = {};
        this.gestureInstructionsData = {
            'por_favor': {
                instructions: [
                    'Coloque la mano derecha en el pecho',
                    'Palma hacia el cuerpo',
                    'Haga movimientos circulares suaves',
                    'Mantenga expresión amable',
                    'Gesto de petición cortés'
                ],
                context: 'Use cuando necesite pedir algo al cliente de manera cortés',
                tips: 'El movimiento circular en el pecho es clave para este gesto'
            },
            'disculpe': {
                instructions: [
                    'Toque su frente con la mano derecha',
                    'Dedos extendidos hacia arriba',
                    'Mueva la mano hacia adelante',
                    'Mantenga expresión de disculpa',
                    'Gesto de perdón o disculpa'
                ],
                context: 'Use cuando necesite disculparse por algún inconveniente',
                tips: 'Combine con expresión facial de disculpa para mayor efectividad'
            },
            'confirmar': {
                instructions: [
                    'Levante su mano derecha a la altura del pecho',
                    'Forme un puño cerrado',
                    'Extienda solo el dedo pulgar hacia arriba',
                    'Mantenga la posición por 2 segundos',
                    'El cliente verá que usted confirma su solicitud'
                ],
                context: 'Use cuando quiera confirmar que entendió o acepta la solicitud del cliente',
                tips: 'Mantenga contacto visual y sonría para transmitir confianza'
            },
            'ayuda': {
                instructions: [
                    'Extienda ambas manos hacia adelante',
                    'Palmas hacia arriba, dedos ligeramente curvados',
                    'Mueva las manos suavemente hacia el cliente',
                    'Mantenga expresión amigable y receptiva',
                    'Esto indica que está dispuesto a ayudar'
                ],
                context: 'Use cuando el cliente parezca confundido o necesite asistencia',
                tips: 'Combine con gestos de calma para tranquilizar al cliente'
            },
            'esperar': {
                instructions: [
                    'Levante la mano derecha con la palma hacia el cliente',
                    'Dedos extendidos y juntos',
                    'Mueva la mano suavemente de lado a lado',
                    'Mantenga expresión paciente',
                    'Puede señalar hacia usted para indicar que está trabajando'
                ],
                context: 'Use cuando necesite tiempo para procesar la solicitud o buscar información',
                tips: 'Asegúrese de volver con el cliente en un tiempo razonable'
            },
            'no_entiendo': {
                instructions: [
                    'Coloque la mano derecha sobre su frente',
                    'Mueva la cabeza ligeramente de lado a lado',
                    'Mantenga expresión de confusión amigable',
                    'Puede señalar al cliente y luego a usted',
                    'Esto indica que necesita que repita o aclare'
                ],
                context: 'Use cuando no comprenda la seña del cliente',
                tips: 'Sea paciente y anime al cliente a intentar de nuevo'
            },
            'gracias': {
                instructions: [
                    'Toque sus labios con la mano derecha',
                    'Dedos extendidos, palma hacia usted',
                    'Mueva la mano hacia adelante y ligeramente hacia abajo',
                    'Como si enviara un beso de agradecimiento',
                    'Mantenga contacto visual y sonría'
                ],
                context: 'Use para agradecer al cliente por su paciencia o información',
                tips: 'Este es el gesto correcto de "gracias" en lenguaje de señas'
            },
            'repetir': {
                instructions: [
                    'Forme círculos con ambas manos',
                    'Índice y pulgar tocándose, otros dedos extendidos',
                    'Mueva las manos en círculos pequeños',
                    'Mantenga contacto visual',
                    'Esto indica que quiere que repita la información'
                ],
                context: 'Use cuando necesite que el cliente repita su seña',
                tips: 'Combine con expresión de interés para mostrar que está prestando atención'
            }
        };

        this.initializeInterface();
    }

    async initializeInterface() {
        this.setupEventListeners();
        await this.loadGestureDatabase();
        this.updateSystemStatus();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Botones principales
        this.startSessionBtn.addEventListener('click', () => this.startSession());
        this.endSessionBtn.addEventListener('click', () => this.endSession());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        this.clearConversationBtn.addEventListener('click', () => this.clearConversation());

        // Botones de respuesta
        this.responseButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectResponse(btn.dataset.gesture));
        });
        
        // Botones de estado
        this.statusButtons = document.querySelectorAll('.status-btn');
        this.statusButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectResponse(btn.dataset.gesture));
        });
    }

    async loadGestureDatabase() {
        try {
            const response = await fetch('/get_gestures');
            if (response.ok) {
                const data = await response.json();
                this.gestureDatabase = {};

                data.gestures.forEach(gesture => {
                    this.gestureDatabase[gesture.name] = gesture;
                });

                console.log('Base de gestos cargada:', Object.keys(this.gestureDatabase).length, 'gestos');
            }
        } catch (error) {
            console.error('Error cargando base de gestos:', error);
        }
    }

    startSession() {
        this.isSessionActive = true;
        this.startSessionBtn.disabled = true;
        this.endSessionBtn.disabled = false;

        this.updateClientConnectionStatus('connected');
        this.addToConversation('system', 'Sesión iniciada', 'El agente está listo para atender');

        // Iniciar polling para detectar gestos del cliente
        this.startClientPolling();

        this.showMessage('Sesión iniciada. Esperando señas del cliente...', 'success');
    }

    endSession() {
        this.isSessionActive = false;
        this.startSessionBtn.disabled = false;
        this.endSessionBtn.disabled = true;

        this.updateClientConnectionStatus('disconnected');
        this.stopClientPolling();

        this.addToConversation('system', 'Sesión finalizada', 'El agente terminó la atención');
        this.resetInterface();

        this.showMessage('Sesión finalizada', 'info');
    }

    startClientPolling() {
        // Simular polling del sistema de detección del cliente
        this.pollInterval = setInterval(async () => {
            if (this.isSessionActive) {
                await this.checkClientGestures();
            }
        }, 500); // Verificar cada 0.5 segundos para mayor responsividad
    }

    stopClientPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async checkClientGestures() {
        try {
            const response = await fetch('/get_latest_gesture');
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.has_gesture) {
                    // Actualizar interfaz con el gesto del cliente
                    this.updateClientGesture(data);
                    this.updateSystemStatus('active');
                } else {
                    // No hay gestos nuevos
                    this.updateSystemStatus('active');
                }
            } else {
                this.updateSystemStatus('error');
            }
        } catch (error) {
            console.error('Error verificando gestos del cliente:', error);
            this.updateSystemStatus('error');
        }
    }
    
    updateClientGesture(gestureData) {
        // Actualizar el panel del cliente con el gesto detectado
        const gestureNameEl = this.clientGesture.querySelector('.gesture-name');
        const gestureConfidenceEl = this.clientGesture.querySelector('.gesture-confidence');
        
        if (gestureNameEl) {
            if (gestureData.gesture === 'gesto_no_reconocido') {
                gestureNameEl.textContent = 'MANO DETECTADA';
                gestureNameEl.style.color = '#FF9800';
            } else {
                gestureNameEl.textContent = gestureData.gesture.toUpperCase();
                gestureNameEl.style.color = '#28a745';
            }
        }
        
        if (gestureConfidenceEl) {
            const confidencePercent = Math.round(gestureData.confidence * 100);
            gestureConfidenceEl.textContent = `${confidencePercent}%`;
        }
        
        // Actualizar mensaje del cliente
        if (gestureData.gesture === 'gesto_no_reconocido') {
            this.clientMessage.innerHTML = `
                <strong>🤚 Mano detectada pero gesto no reconocido</strong><br>
                <em>${gestureData.description}</em><br>
                <small>Confianza: ${Math.round(gestureData.confidence * 100)}% | ${new Date(gestureData.timestamp).toLocaleTimeString()}</small><br>
                <small style="color: #666;">💡 El cliente está haciendo un gesto que no está en la base de datos</small>
            `;
        } else {
            this.clientMessage.innerHTML = `
                <strong>✅ Gesto reconocido:</strong> ${gestureData.gesture}<br>
                <em>${gestureData.description}</em><br>
                <small>Confianza: ${Math.round(gestureData.confidence * 100)}% | ${new Date(gestureData.timestamp).toLocaleTimeString()}</small>
            `;
        }
        
        // Agregar al historial si es un gesto nuevo
        if (this.currentClientGesture !== gestureData.gesture) {
            this.addToConversation('client', gestureData.gesture, gestureData.description);
            this.currentClientGesture = gestureData.gesture;
        }
    }

    selectResponse(gestureType) {
        // Remover selección anterior
        this.responseButtons.forEach(btn => btn.classList.remove('active'));
        this.statusButtons.forEach(btn => btn.classList.remove('active'));

        // Seleccionar nuevo botón
        const selectedBtns = document.querySelectorAll(`[data-gesture="${gestureType}"]`);
        selectedBtns.forEach(btn => btn.classList.add('active'));

        this.selectedResponse = gestureType;
        this.showGestureDemo(gestureType);

        // Enviar respuesta al cliente
        this.sendResponseToClient(gestureType);

        // Agregar al historial
        const gestureInfo = this.gestureDatabase[gestureType] || { description: 'Gesto de respuesta' };
        this.addToConversation('agent', gestureType, gestureInfo.description);
    }
    
    async sendResponseToClient(gestureType) {
        try {
            const response = await fetch('/send_agent_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gesture: gestureType
                })
            });
            
            if (response.ok) {
                console.log(`Respuesta "${gestureType}" enviada al cliente`);
            } else {
                console.error('Error enviando respuesta al cliente');
            }
        } catch (error) {
            console.error('Error enviando respuesta:', error);
        }
    }

    showGestureDemo(gestureType) {
        const gestureName = gestureType.replace('_', ' ').toUpperCase();
        this.selectedGestureName.textContent = gestureName;

        // Mostrar animación visual
        this.displayGestureAnimation(gestureType);

        // Mostrar instrucciones
        this.displayGestureInstructions(gestureType);

        // Mostrar detalles
        this.displayGestureDetails(gestureType);
    }

    displayGestureAnimation(gestureType) {
        // Usar SVG animado si está disponible
        if (window.gestureVisuals) {
            const svg = window.gestureVisuals.getGestureSVG(gestureType);
            this.gestureAnimation.innerHTML = svg;
        } else {
            // Fallback a landmarks si no hay SVG
            const gestureData = this.gestureDatabase[gestureType];
            
            if (gestureData && gestureData.landmarks) {
                this.gestureAnimation.innerHTML = `
                    <div class="landmarks-display" id="landmarksDisplay">
                        <canvas id="gestureCanvas" width="300" height="300"></canvas>
                    </div>
                    <p>Posición de la mano para: <strong>${gestureType}</strong></p>
                `;
                this.drawGestureLandmarks(gestureData.landmarks);
            } else {
                this.gestureAnimation.innerHTML = `
                    <div class="hand-placeholder">
                        <span>🤲</span>
                        <p>Demostración del gesto: <strong>${gestureType}</strong></p>
                        <small>Siga las instrucciones del panel derecho</small>
                    </div>
                `;
            }
        }

        this.gestureAnimation.classList.add('active');
    }

    drawGestureLandmarks(landmarks) {
        const canvas = document.getElementById('gestureCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Configurar estilos
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        // Dibujar conexiones primero
        this.drawHandConnections(ctx, landmarks, canvas.width, canvas.height);

        // Dibujar puntos
        landmarks.forEach((point, index) => {
            const x = point[0] * canvas.width;
            const y = point[1] * canvas.height;

            // Diferentes colores para diferentes tipos de puntos
            if (index === 0) {
                ctx.fillStyle = '#ff0000'; // Muñeca
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fill();
            } else if ([4, 8, 12, 16, 20].includes(index)) {
                ctx.fillStyle = '#ffff00'; // Puntas de dedos
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                ctx.fillStyle = '#00ff00'; // Articulaciones
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    drawHandConnections(ctx, landmarks, width, height) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],  // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8],  // Índice
            [0, 9], [9, 10], [10, 11], [11, 12],  // Medio
            [0, 13], [13, 14], [14, 15], [15, 16],  // Anular
            [0, 17], [17, 18], [18, 19], [19, 20],  // Meñique
            [5, 9], [9, 13], [13, 17]  // Conexiones de palma
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;

        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                const startX = landmarks[start][0] * width;
                const startY = landmarks[start][1] * height;
                const endX = landmarks[end][0] * width;
                const endY = landmarks[end][1] * height;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        });

        ctx.globalAlpha = 1.0;
    }

    displayGestureInstructions(gestureType) {
        const instructions = this.gestureInstructionsData[gestureType];

        if (instructions) {
            const instructionsList = instructions.instructions.map((step, index) =>
                `<li><strong>Paso ${index + 1}:</strong> ${step}</li>`
            ).join('');

            this.gestureInstructions.innerHTML = `
                <h4>Cómo hacer el gesto:</h4>
                <ol>${instructionsList}</ol>
                <div class="instruction-tips">
                    <strong>💡 Consejo:</strong> ${instructions.tips}
                </div>
            `;
        } else {
            this.gestureInstructions.innerHTML = `
                <h4>Instrucciones:</h4>
                <p>Siga la demostración visual para realizar el gesto <strong>${gestureType}</strong></p>
            `;
        }
    }

    displayGestureDetails(gestureType) {
        const gestureInfo = this.gestureDatabase[gestureType];
        const instructions = this.gestureInstructionsData[gestureType];

        document.getElementById('gestureCategory').textContent =
            gestureInfo?.category || 'Respuesta';
        document.getElementById('gestureDescription').textContent =
            gestureInfo?.description || 'Gesto de comunicación';
        document.getElementById('gestureContext').textContent =
            instructions?.context || 'Use según el contexto de la conversación';
    }

    addToConversation(type, gesture, description) {
        const timestamp = new Date().toLocaleTimeString();
        const item = {
            type,
            gesture,
            description,
            timestamp
        };

        this.conversationHistory.push(item);
        this.updateConversationDisplay();
    }

    updateConversationDisplay() {
        this.conversationLog.innerHTML = '';

        this.conversationHistory.slice(-10).forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `conversation-item ${item.type}`;

            let icon = '';
            switch (item.type) {
                case 'client': icon = '🤟'; break;
                case 'agent': icon = '👨‍💼'; break;
                case 'system': icon = '⚙️'; break;
            }

            itemEl.innerHTML = `
                <div class="conversation-time">${item.timestamp}</div>
                <div class="conversation-content">
                    <div class="conversation-gesture">${icon} ${item.gesture}</div>
                    <div class="conversation-description">${item.description}</div>
                </div>
            `;

            this.conversationLog.appendChild(itemEl);
        });

        // Scroll al final
        this.conversationLog.scrollTop = this.conversationLog.scrollHeight;
    }

    clearConversation() {
        this.conversationHistory = [];
        this.updateConversationDisplay();
        this.showMessage('Historial de conversación limpiado', 'info');
    }

    updateClientConnectionStatus(status) {
        this.clientConnectionStatus.textContent = status === 'connected' ? 'Conectado' : 'Desconectado';
        this.clientConnectionStatus.className = `status-value ${status}`;
    }

    updateSystemStatus(status = 'active') {
        const statusText = {
            'active': 'Activo',
            'error': 'Error',
            'inactive': 'Inactivo'
        };

        this.systemStatus.textContent = statusText[status] || 'Desconocido';
        this.systemStatus.className = `status-value ${status}`;
    }

    resetInterface() {
        this.selectedResponse = null;
        this.responseButtons.forEach(btn => btn.classList.remove('active'));

        this.selectedGestureName.textContent = 'Seleccione una respuesta';
        this.gestureAnimation.innerHTML = `
            <div class="hand-placeholder">
                <span>👋</span>
                <p>Seleccione una respuesta para ver cómo hacer el gesto</p>
            </div>
        `;
        this.gestureAnimation.classList.remove('active');

        this.gestureInstructions.innerHTML = `
            <h4>Instrucciones:</h4>
            <ol>
                <li>Seleccione una respuesta del panel izquierdo</li>
                <li>Siga las instrucciones visuales</li>
                <li>Practique el gesto frente al cliente</li>
            </ol>
        `;

        document.getElementById('gestureCategory').textContent = '-';
        document.getElementById('gestureDescription').textContent = '-';
        document.getElementById('gestureContext').textContent = '-';
    }

    showWelcomeMessage() {
        this.clientMessage.innerHTML = `
            <strong>Bienvenido al Panel del Agente</strong><br>
            Haga clic en "Iniciar Sesión" para comenzar a atender a un cliente sordo.
        `;
    }

    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h3>🆘 Guía de Uso del Panel del Agente</h3>
                <div class="help-section">
                    <h4>Cómo usar esta interfaz:</h4>
                    <ol>
                        <li><strong>Iniciar Sesión:</strong> Haga clic en "Iniciar Sesión" cuando un cliente sordo se acerque</li>
                        <li><strong>Observar Gestos:</strong> El panel mostrará los gestos que hace el cliente</li>
                        <li><strong>Seleccionar Respuesta:</strong> Elija una respuesta apropiada del panel izquierdo</li>
                        <li><strong>Seguir Instrucciones:</strong> Use la demostración visual para hacer el gesto correcto</li>
                        <li><strong>Finalizar:</strong> Termine la sesión cuando complete la atención</li>
                    </ol>
                </div>
                <div class="help-section">
                    <h4>Consejos importantes:</h4>
                    <ul>
                        <li>Mantenga contacto visual con el cliente</li>
                        <li>Sea paciente y permita tiempo para la comunicación</li>
                        <li>Use expresiones faciales claras y amigables</li>
                        <li>Si no entiende, use el gesto "No entiendo" y pida que repita</li>
                        <li>Practique los gestos básicos regularmente</li>
                    </ul>
                </div>
            </div>
        `;

        this.showDetailedMessage(helpContent, 'info');
    }

    showMessage(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        switch (type) {
            case 'success': notification.style.background = '#28a745'; break;
            case 'error': notification.style.background = '#dc3545'; break;
            case 'warning': notification.style.background = '#ffc107'; notification.style.color = '#000'; break;
            default: notification.style.background = '#17a2b8'; break;
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showDetailedMessage(htmlContent, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content ${type}">
                ${htmlContent}
                <button class="modal-close">Cerrar</button>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        `;

        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AgentInterface();
});