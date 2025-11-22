/**
 * Modo Demo - Simula detección ASL sin cámara
 */

class ASLDemoMode {
    constructor() {
        this.isActive = false;
        this.demoInterval = null;
        this.demoLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        this.currentDemoIndex = 0;
        
        this.setupDemoButton();
    }
    
    setupDemoButton() {
        // Crear botón de modo demo
        const demoButton = document.createElement('button');
        demoButton.id = 'demoModeBtn';
        demoButton.className = 'btn btn-demo';
        demoButton.textContent = '🎭 Modo Demo (Sin Cámara)';
        demoButton.style.cssText = `
            background: linear-gradient(45deg, #e91e63, #9c27b0);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        // Agregar al contenedor de controles
        const controls = document.querySelector('.kids-controls');
        if (controls) {
            controls.appendChild(demoButton);
        }
        
        demoButton.addEventListener('click', () => this.toggleDemo());
    }
    
    toggleDemo() {
        if (this.isActive) {
            this.stopDemo();
        } else {
            this.startDemo();
        }
    }
    
    startDemo() {
        this.isActive = true;
        const demoBtn = document.getElementById('demoModeBtn');
        if (demoBtn) {
            demoBtn.textContent = '⏹️ Detener Demo';
            demoBtn.style.background = 'linear-gradient(45deg, #f44336, #e91e63)';
        }
        
        // Desactivar botones de cámara
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.disabled = true;
        
        this.showMessage('🎭 Modo Demo Activado - Simulando detección ASL', 'demo');
        
        // Iniciar simulación
        this.demoInterval = setInterval(() => {
            this.simulateDetection();
        }, 3000); // Cada 3 segundos
        
        // Simular primera detección inmediatamente
        setTimeout(() => this.simulateDetection(), 500);
    }
    
    stopDemo() {
        this.isActive = false;
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
        
        const demoBtn = document.getElementById('demoModeBtn');
        if (demoBtn) {
            demoBtn.textContent = '🎭 Modo Demo (Sin Cámara)';
            demoBtn.style.background = 'linear-gradient(45deg, #e91e63, #9c27b0)';
        }
        
        // Reactivar botones de cámara
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.disabled = false;
        
        this.showMessage('Demo detenido', 'info');
    }
    
    simulateDetection() {
        if (!this.isActive) return;
        
        // Obtener letra objetivo actual
        const targetLetter = document.getElementById('targetLetter');
        const currentTarget = targetLetter ? targetLetter.textContent : 'A';
        
        // Simular diferentes escenarios
        const scenarios = [
            // Escenario 1: Detección correcta (70% probabilidad)
            {
                probability: 0.7,
                letter: currentTarget,
                confidence: 0.85 + Math.random() * 0.15, // 85-100%
                success: true
            },
            // Escenario 2: Letra incorrecta (20% probabilidad)
            {
                probability: 0.2,
                letter: this.getRandomLetter(currentTarget),
                confidence: 0.6 + Math.random() * 0.3, // 60-90%
                success: false
            },
            // Escenario 3: No detección (10% probabilidad)
            {
                probability: 0.1,
                letter: null,
                confidence: 0,
                success: false
            }
        ];
        
        // Seleccionar escenario basado en probabilidades
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedScenario = scenarios[0];
        
        for (const scenario of scenarios) {
            cumulativeProbability += scenario.probability;
            if (random <= cumulativeProbability) {
                selectedScenario = scenario;
                break;
            }
        }
        
        // Simular detección
        const detectionData = {
            success: selectedScenario.success && selectedScenario.letter === currentTarget,
            letter: selectedScenario.letter,
            confidence: selectedScenario.confidence,
            hands_detected: selectedScenario.letter !== null,
            message: selectedScenario.letter ? 
                `Letra detectada: ${selectedScenario.letter}` : 
                'No se detectaron manos',
            stability_info: {
                stable: selectedScenario.success,
                message: selectedScenario.success ? 
                    `Letra estable: ${selectedScenario.letter}` : 
                    'Estabilizando...'
            },
            top_predictions: this.generateTopPredictions(selectedScenario.letter, selectedScenario.confidence)
        };
        
        // Enviar evento de detección simulada
        this.dispatchDetectionEvent(detectionData);
        
        // Actualizar interfaz visual
        this.updateVisualFeedback(detectionData);
    }
    
    getRandomLetter(exclude) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        const filtered = letters.filter(letter => letter !== exclude);
        return filtered[Math.floor(Math.random() * filtered.length)];
    }
    
    generateTopPredictions(mainLetter, mainConfidence) {
        if (!mainLetter) return [];
        
        const predictions = [
            { letter: mainLetter, confidence: mainConfidence }
        ];
        
        // Agregar 4 predicciones adicionales con confianzas menores
        const otherLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
            .filter(l => l !== mainLetter)
            .slice(0, 4);
        
        let remainingConfidence = 1 - mainConfidence;
        
        otherLetters.forEach((letter, index) => {
            const confidence = remainingConfidence * (0.8 - index * 0.15);
            predictions.push({ letter, confidence });
            remainingConfidence -= confidence;
        });
        
        return predictions.slice(0, 5);
    }
    
    dispatchDetectionEvent(detectionData) {
        // Enviar evento para el sistema de aprendizaje
        const event = new CustomEvent('aslDetection', {
            detail: detectionData
        });
        document.dispatchEvent(event);
    }
    
    updateVisualFeedback(detectionData) {
        // Actualizar emoji de feedback
        const feedbackEmoji = document.getElementById('feedbackEmoji');
        if (feedbackEmoji) {
            if (detectionData.success) {
                feedbackEmoji.textContent = '🎉';
            } else if (detectionData.letter) {
                feedbackEmoji.textContent = '🤔';
            } else {
                feedbackEmoji.textContent = '🤚';
            }
        }
        
        // Actualizar texto de gesto actual
        const gestureText = document.querySelector('.gesture-text');
        if (gestureText) {
            if (detectionData.letter) {
                gestureText.textContent = `Detecté: ${detectionData.letter}`;
            } else {
                gestureText.textContent = '¡Muestra tu mano!';
            }
        }
        
        // Actualizar nivel de confianza
        const confidenceLevel = document.getElementById('confidenceLevel');
        if (confidenceLevel && detectionData.letter) {
            confidenceLevel.textContent = `${(detectionData.confidence * 100).toFixed(1)}%`;
        }
    }
    
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `demo-message ${type}`;
        messageEl.textContent = message;
        
        // Estilos
        const styles = {
            demo: 'background: linear-gradient(45deg, #e91e63, #9c27b0); color: white;',
            info: 'background: #2196F3; color: white;'
        };
        
        messageEl.style.cssText = `
            ${styles[type] || styles.info}
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInLeft 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            messageEl.style.animation = 'slideOutLeft 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}

// CSS para animaciones
const demoStyles = document.createElement('style');
demoStyles.textContent = `
    @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutLeft {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }
`;
document.head.appendChild(demoStyles);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.aslDemoMode = new ASLDemoMode();
});

// Exportar para uso global
window.ASLDemoMode = ASLDemoMode;