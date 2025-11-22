/**
 * Sistema de Aprendizaje ASL para Niños
 */

class ASLKidsLearning {
    constructor() {
        // Estado del juego
        this.currentLevel = 1;
        this.totalScore = 0;
        this.currentStreak = 0;
        this.maxStreak = 0;
        this.learnedLetters = new Set();
        this.currentTargetLetter = 'A';
        this.gameMode = 'challenge'; // 'challenge' o 'practice'
        this.timeLeft = 30;
        this.timerInterval = null;
        this.isGameActive = false;

        // Alfabeto ASL
        this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.currentLetterIndex = 0;

        // Logros
        this.achievements = {
            'first-letter': { name: 'Primera Letra', icon: '🌟', unlocked: false, requirement: 1 },
            'five-letters': { name: '5 Letras', icon: '🎯', unlocked: false, requirement: 5 },
            'ten-letters': { name: '10 Letras', icon: '🚀', unlocked: false, requirement: 10 },
            'alphabet-master': { name: 'Maestro del Alfabeto', icon: '👑', unlocked: false, requirement: 26 },
            'speed-demon': { name: 'Súper Rápido', icon: '⚡', unlocked: false, requirement: 'streak_5' },
            'perfect-streak': { name: 'Racha Perfecta', icon: '💎', unlocked: false, requirement: 'streak_10' }
        };

        // Elementos DOM
        this.elements = {
            targetLetter: document.getElementById('targetLetter'),
            targetLetterName: document.getElementById('targetLetterName'),
            timeLeft: document.getElementById('timeLeft'),
            totalScore: document.getElementById('totalScore'),
            currentLevel: document.getElementById('currentLevel'),
            currentStreak: document.getElementById('currentStreak'),
            feedbackEmoji: document.getElementById('feedbackEmoji'),
            successAnimation: document.getElementById('successAnimation'),
            alphabetGrid: document.getElementById('alphabetGrid'),
            achievementList: document.getElementById('achievementList')
        };

        // Botones
        this.buttons = {
            start: document.getElementById('startBtn'),
            stop: document.getElementById('stopBtn'),
            next: document.getElementById('nextChallengeBtn'),
            hint: document.getElementById('showHintBtn'),
            practice: document.getElementById('practiceBtn')
        };

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.updateDisplay();
        this.createAlphabetGrid();
        this.loadProgress();
        this.setNewChallenge();
    }

    setupEventListeners() {
        // Botones del juego
        this.buttons.start.addEventListener('click', () => this.startGame());
        this.buttons.stop.addEventListener('click', () => this.stopGame());
        this.buttons.next.addEventListener('click', () => this.nextChallenge());
        this.buttons.hint.addEventListener('click', () => this.showHint());
        this.buttons.practice.addEventListener('click', () => this.togglePracticeMode());

        // Escuchar eventos de detección ASL
        document.addEventListener('aslDetection', (event) => {
            this.handleASLDetection(event.detail);
        });
    }

    startGame() {
        this.isGameActive = true;
        this.gameMode = 'challenge';
        this.startTimer();
        this.buttons.start.disabled = true;
        this.buttons.stop.disabled = false;
        this.buttons.next.disabled = false;

        // Iniciar detección ASL
        if (window.gestureApp) {
            window.gestureApp.startDetection();
        }

        this.showMessage('¡Juego iniciado! 🎮', 'success');
    }

    stopGame() {
        this.isGameActive = false;
        this.stopTimer();
        this.buttons.start.disabled = false;
        this.buttons.stop.disabled = true;
        this.buttons.next.disabled = true;

        // Detener detección ASL
        if (window.gestureApp) {
            window.gestureApp.stopDetection();
        }

        this.showMessage('Juego pausado ⏸️', 'info');
    }

    togglePracticeMode() {
        if (this.gameMode === 'practice') {
            this.gameMode = 'challenge';
            this.buttons.practice.textContent = '🎯 Modo Práctica';
            this.showMessage('Modo Desafío activado! 🏆', 'info');
        } else {
            this.gameMode = 'practice';
            this.buttons.practice.textContent = '🏆 Modo Desafío';
            this.showMessage('Modo Práctica activado! 🎯', 'info');
            this.stopTimer();
        }
    }

    setNewChallenge() {
        // Seleccionar letra objetivo
        if (this.gameMode === 'challenge') {
            this.currentTargetLetter = this.alphabet[this.currentLetterIndex];
        } else {
            // En modo práctica, letra aleatoria
            this.currentTargetLetter = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
        }

        this.updateTargetDisplay();
        this.resetTimer();

        if (this.gameMode === 'challenge' && this.isGameActive) {
            this.startTimer();
        }
    }

    nextChallenge() {
        if (this.gameMode === 'challenge') {
            this.currentLetterIndex = (this.currentLetterIndex + 1) % this.alphabet.length;
            if (this.currentLetterIndex === 0) {
                this.levelUp();
            }
        }
        this.setNewChallenge();
    }

    handleASLDetection(detectionData) {
        if (!this.isGameActive && this.gameMode !== 'practice') return;

        const detectedLetter = detectionData.letter;
        const confidence = detectionData.confidence;

        if (detectedLetter) {
            this.updateFeedback(detectedLetter, confidence);

            // Verificar si es la letra correcta
            if (detectedLetter === this.currentTargetLetter && confidence > 0.6) {
                this.handleCorrectAnswer(detectedLetter, confidence);
            } else if (detectedLetter !== this.currentTargetLetter) {
                this.handleIncorrectAnswer(detectedLetter);
            }
        } else {
            this.updateFeedback(null, 0);
        }
    }

    handleCorrectAnswer(letter, confidence) {
        // Calcular puntos basado en confianza y tiempo
        const timeBonus = this.gameMode === 'challenge' ? Math.max(0, this.timeLeft - 10) : 0;
        const confidenceBonus = Math.floor(confidence * 50);
        const points = 100 + timeBonus + confidenceBonus;

        this.totalScore += points;
        this.currentStreak++;
        this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
        this.learnedLetters.add(letter);

        // Mostrar animación de éxito
        this.showSuccessAnimation(letter, points);

        // Actualizar progreso
        this.updateAlphabetProgress();
        this.checkAchievements();
        this.updateDisplay();
        this.saveProgress();

        // Avanzar automáticamente después de un breve delay
        setTimeout(() => {
            this.nextChallenge();
        }, 2000);
    }

    handleIncorrectAnswer(detectedLetter) {
        this.currentStreak = 0;
        this.elements.feedbackEmoji.textContent = '🤔';

        // Mostrar pista visual
        this.showMessage(`Detecté "${detectedLetter}", pero necesitas hacer "${this.currentTargetLetter}" 🎯`, 'warning');
    }

    updateFeedback(letter, confidence) {
        if (!letter) {
            this.elements.feedbackEmoji.textContent = '🤚';
            return;
        }

        if (letter === this.currentTargetLetter) {
            if (confidence > 0.8) {
                this.elements.feedbackEmoji.textContent = '🎉';
            } else if (confidence > 0.6) {
                this.elements.feedbackEmoji.textContent = '👍';
            } else {
                this.elements.feedbackEmoji.textContent = '🤏';
            }
        } else {
            this.elements.feedbackEmoji.textContent = '🤔';
        }
    }

    showSuccessAnimation(letter, points) {
        const animation = this.elements.successAnimation;
        const emoji = animation.querySelector('.success-emoji');
        const text = animation.querySelector('.success-text');

        emoji.textContent = '🎉';
        text.textContent = `¡Excelente! +${points} puntos`;

        animation.classList.add('show');

        setTimeout(() => {
            animation.classList.remove('show');
        }, 2000);
    }

    updateTargetDisplay() {
        this.elements.targetLetter.textContent = this.currentTargetLetter;
        this.elements.targetLetterName.textContent = this.currentTargetLetter;

        // Actualizar imagen de ejemplo si existe
        const letterExample = document.querySelector('.letter-example img');
        if (letterExample) {
            letterExample.src = `/static/images/asl-letters/${this.currentTargetLetter}.png`;
            letterExample.alt = `Letra ${this.currentTargetLetter} en ASL`;
        }
    }

    updateDisplay() {
        this.elements.totalScore.textContent = this.totalScore;
        this.elements.currentLevel.textContent = this.currentLevel;
        this.elements.currentStreak.textContent = this.currentStreak;
    }

    createAlphabetGrid() {
        const grid = this.elements.alphabetGrid;
        grid.innerHTML = '';

        this.alphabet.forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'alphabet-letter';
            letterElement.textContent = letter;
            letterElement.dataset.letter = letter;

            if (this.learnedLetters.has(letter)) {
                letterElement.classList.add('learned');
            } else if (letter === this.currentTargetLetter) {
                letterElement.classList.add('current');
            } else {
                letterElement.classList.add('locked');
            }

            letterElement.addEventListener('click', () => {
                if (this.gameMode === 'practice') {
                    this.currentTargetLetter = letter;
                    this.updateTargetDisplay();
                    this.updateAlphabetGrid();
                }
            });

            grid.appendChild(letterElement);
        });
    }

    updateAlphabetProgress() {
        this.createAlphabetGrid();
    }

    updateAlphabetGrid() {
        const letters = document.querySelectorAll('.alphabet-letter');
        letters.forEach(letterEl => {
            const letter = letterEl.dataset.letter;
            letterEl.className = 'alphabet-letter';

            if (this.learnedLetters.has(letter)) {
                letterEl.classList.add('learned');
            } else if (letter === this.currentTargetLetter) {
                letterEl.classList.add('current');
            } else {
                letterEl.classList.add('locked');
            }
        });
    }

    checkAchievements() {
        const learnedCount = this.learnedLetters.size;

        // Verificar logros basados en letras aprendidas
        if (learnedCount >= 1 && !this.achievements['first-letter'].unlocked) {
            this.unlockAchievement('first-letter');
        }
        if (learnedCount >= 5 && !this.achievements['five-letters'].unlocked) {
            this.unlockAchievement('five-letters');
        }
        if (learnedCount >= 10 && !this.achievements['ten-letters'].unlocked) {
            this.unlockAchievement('ten-letters');
        }
        if (learnedCount >= 26 && !this.achievements['alphabet-master'].unlocked) {
            this.unlockAchievement('alphabet-master');
        }

        // Verificar logros basados en rachas
        if (this.currentStreak >= 5 && !this.achievements['speed-demon'].unlocked) {
            this.unlockAchievement('speed-demon');
        }
        if (this.currentStreak >= 10 && !this.achievements['perfect-streak'].unlocked) {
            this.unlockAchievement('perfect-streak');
        }
    }

    unlockAchievement(achievementId) {
        this.achievements[achievementId].unlocked = true;

        const achievementEl = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (achievementEl) {
            achievementEl.classList.remove('locked');
            achievementEl.classList.add('unlocked');
        }

        const achievement = this.achievements[achievementId];
        this.showMessage(`🏆 ¡Logro desbloqueado: ${achievement.name}! ${achievement.icon}`, 'achievement');

        // Bonus de puntos por logro
        this.totalScore += 500;
        this.updateDisplay();
    }

    levelUp() {
        this.currentLevel++;
        this.showMessage(`🎊 ¡Subiste al nivel ${this.currentLevel}! 🎊`, 'levelup');

        // Bonus por subir de nivel
        this.totalScore += this.currentLevel * 100;
        this.updateDisplay();
    }

    startTimer() {
        if (this.gameMode !== 'challenge') return;

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.elements.timeLeft.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.handleTimeOut();
            } else if (this.timeLeft <= 10) {
                this.elements.timeLeft.style.color = '#ff4444';
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.timeLeft = 30;
        this.elements.timeLeft.textContent = this.timeLeft;
        this.elements.timeLeft.style.color = 'white';
    }

    handleTimeOut() {
        this.stopTimer();
        this.currentStreak = 0;
        this.showMessage(`⏰ ¡Se acabó el tiempo! La letra era "${this.currentTargetLetter}"`, 'timeout');

        setTimeout(() => {
            this.nextChallenge();
        }, 3000);
    }

    showHint() {
        const hints = {
            'A': 'Cierra tu puño con el pulgar al lado 👊',
            'B': 'Mano abierta con dedos juntos hacia arriba ✋',
            'C': 'Haz una "C" con tu mano 🌙',
            'D': 'Dedo índice arriba, otros doblados 👆',
            'E': 'Dobla todos los dedos hacia la palma ✊',
            'F': 'Junta el pulgar e índice, otros arriba 👌',
            'G': 'Apunta con el índice hacia un lado 👉',
            'H': 'Dos dedos juntos hacia un lado ✌️',
            'I': 'Solo el meñique arriba 🤙',
            'J': 'Como la "I" pero muévela 🤙↩️',
            'K': 'Índice y medio arriba, pulgar entre ellos ✌️👍',
            'L': 'Forma una "L" con pulgar e índice 👍',
            'M': 'Tres dedos sobre el pulgar ✊',
            'N': 'Dos dedos sobre el pulgar ✊',
            'O': 'Forma un círculo con todos los dedos ⭕',
            'P': 'Como "K" pero apuntando hacia abajo ✌️👇',
            'Q': 'Como "G" pero apuntando hacia abajo 👇',
            'R': 'Cruza el índice y el medio ✌️❌',
            'S': 'Puño cerrado con pulgar sobre los dedos ✊',
            'T': 'Pulgar entre índice y medio 👍',
            'U': 'Índice y medio juntos hacia arriba ✌️',
            'V': 'Índice y medio separados hacia arriba ✌️',
            'W': 'Tres dedos separados hacia arriba 🤟',
            'X': 'Índice doblado como un gancho 🪝',
            'Y': 'Pulgar y meñique extendidos 🤙',
            'Z': 'Dibuja una "Z" en el aire con el índice ⚡'
        };

        const hint = hints[this.currentTargetLetter] || 'Mira la imagen de ejemplo 📸';
        this.showMessage(`💡 Pista: ${hint}`, 'hint');
    }

    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `game-message ${type}`;
        messageEl.textContent = message;

        // Estilos según el tipo
        const styles = {
            success: 'background: #4CAF50; color: white;',
            warning: 'background: #FF9800; color: white;',
            error: 'background: #f44336; color: white;',
            info: 'background: #2196F3; color: white;',
            achievement: 'background: linear-gradient(45deg, #FFD700, #FFA500); color: white;',
            levelup: 'background: linear-gradient(45deg, #9C27B0, #7b1fa2); color: white;',
            timeout: 'background: #ff4444; color: white;',
            hint: 'background: #4ecdc4; color: white;'
        };

        messageEl.style.cssText = `
            ${styles[type] || styles.info}
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(messageEl);

        // Remover después de 4 segundos
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 4000);
    }

    saveProgress() {
        const progress = {
            totalScore: this.totalScore,
            currentLevel: this.currentLevel,
            maxStreak: this.maxStreak,
            learnedLetters: Array.from(this.learnedLetters),
            achievements: this.achievements
        };

        localStorage.setItem('asl-kids-progress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('asl-kids-progress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                this.totalScore = progress.totalScore || 0;
                this.currentLevel = progress.currentLevel || 1;
                this.maxStreak = progress.maxStreak || 0;
                this.learnedLetters = new Set(progress.learnedLetters || []);
                this.achievements = { ...this.achievements, ...progress.achievements };

                this.updateDisplay();
                this.updateAlphabetProgress();
            } catch (e) {
                console.log('Error cargando progreso:', e);
            }
        }
    }
}

// CSS para animaciones de mensajes
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(messageStyles);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.aslKidsLearning = new ASLKidsLearning();
});

// Exportar para uso global
window.ASLKidsLearning = ASLKidsLearning;