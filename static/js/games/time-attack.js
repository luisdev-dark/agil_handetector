/**
 * TimeAttackGame - Juego Contra Reloj
 * 
 * El jugador debe detectar tantas letras aleatorias como pueda en 60 segundos.
 * Cada letra correcta otorga puntos con bonus por velocidad.
 * 
 * Requirements: 1.3, 1.5
 */

class TimeAttackGame {
  constructor() {
    // Inicializar sistemas
    this.storageManager = new StorageManager();
    this.pointsSystem = new PointsSystem(this.storageManager);
    this.achievementSystem = new AchievementSystem(this.storageManager);
    this.gameEngine = new GameEngine('time-attack', {
      detectionInterval: 300,
      confidenceThreshold: 0.7
    });

    // Estado del juego
    this.gameState = 'idle'; // idle, playing, finished
    this.timeLimit = 60; // 60 segundos
    this.timeRemaining = this.timeLimit;
    this.timerInterval = null;
    this.currentTargetLetter = null;
    this.correctLetters = 0;
    this.totalAttempts = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.lastDetectionTime = null;
    
    // Letras disponibles (24 letras del alfabeto ASL)
    this.availableLetters = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K',
      'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
      'V', 'W', 'X', 'Y'
    ];

    // Referencias a elementos DOM
    this.elements = {
      videoElement: document.getElementById('videoElement'),
      timerValue: document.getElementById('timerValue'),
      targetLetter: document.getElementById('targetLetter'),
      feedbackIndicator: document.getElementById('feedbackIndicator'),
      gameMessage: document.getElementById('gameMessage'),
      startBtn: document.getElementById('startBtn'),
      restartBtn: document.getElementById('restartBtn'),
      menuBtn: document.getElementById('menuBtn'),
      scoreValue: document.getElementById('scoreValue'),
      correctLetters: document.getElementById('correctLetters'),
      bestStreak: document.getElementById('bestStreak'),
      speedValue: document.getElementById('speedValue'),
      speedBar: document.getElementById('speedBar'),
      levelValue: document.getElementById('levelValue'),
      totalPoints: document.getElementById('totalPoints'),
      resultsScreen: document.getElementById('resultsScreen'),
      resultScore: document.getElementById('resultScore'),
      resultLetters: document.getElementById('resultLetters'),
      resultAccuracy: document.getElementById('resultAccuracy'),
      resultStreak: document.getElementById('resultStreak'),
      badgesEarned: document.getElementById('badgesEarned')
    };

    // Verificar que todos los elementos existen
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`Element ${key} not found in DOM`);
      }
    }

    // Inicializar
    this.init();
  }

  /**
   * Inicializar el juego
   */
  async init() {
    console.log('Initializing Time Attack Game...');

    // Configurar event listeners
    this.setupEventListeners();

    // Cargar progreso del usuario
    this.loadUserProgress();

    // Configurar handler de errores
    this.gameEngine.setErrorHandler((error) => {
      this.showMessage(error.message, 'error');
    });

    // Registrar callback de subida de nivel
    this.pointsSystem.onLevelUp((levelUpData) => {
      this.pointsSystem.showLevelUpNotification(levelUpData);
      this.updateUI();
    });

    console.log('Time Attack Game initialized');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.startGame());
    this.elements.restartBtn.addEventListener('click', () => this.restartGame());
  }

  /**
   * Cargar progreso del usuario
   */
  loadUserProgress() {
    const status = this.pointsSystem.getStatus();
    this.elements.levelValue.textContent = status.level;
    this.elements.totalPoints.textContent = status.points;
  }

  /**
   * Iniciar el juego
   */
  async startGame() {
    if (this.gameState === 'playing') {
      return;
    }

    console.log('Starting Time Attack Game...');
    this.gameState = 'playing';

    // Resetear estado
    this.timeRemaining = this.timeLimit;
    this.correctLetters = 0;
    this.totalAttempts = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.lastDetectionTime = null;

    // Actualizar UI
    if (this.elements.startBtn) this.elements.startBtn.disabled = true;
    if (this.elements.restartBtn) this.elements.restartBtn.disabled = false;
    if (this.elements.scoreValue) this.elements.scoreValue.textContent = '0';
    if (this.elements.correctLetters) this.elements.correctLetters.textContent = '0';
    if (this.elements.bestStreak) this.elements.bestStreak.textContent = '0';
    if (this.elements.speedValue) this.elements.speedValue.textContent = '0';
    if (this.elements.speedBar) this.elements.speedBar.style.width = '0%';
    this.showMessage('¡Juego iniciado! Detecta las letras lo más rápido posible', 'success');

    // Iniciar cámara
    const cameraStarted = await this.gameEngine.startCamera(this.elements.videoElement);
    if (!cameraStarted) {
      this.showMessage('Error al iniciar la cámara', 'error');
      this.gameState = 'idle';
      this.elements.startBtn.disabled = false;
      return;
    }

    // Iniciar sesión de juego
    this.gameEngine.startGame();

    // Generar primera letra objetivo
    this.generateNewTarget();

    // Iniciar detección
    this.gameEngine.startDetection((detection) => {
      this.handleDetection(detection);
    });

    // Iniciar temporizador
    this.startTimer();
  }

  /**
   * Iniciar temporizador de 60 segundos
   */
  startTimer() {
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      // Actualizar velocidad
      this.updateSpeedDisplay();

      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  /**
   * Actualizar display del temporizador
   */
  updateTimerDisplay() {
    this.elements.timerValue.textContent = this.timeRemaining;

    // Cambiar color según tiempo restante
    this.elements.timerValue.classList.remove('warning', 'danger');
    if (this.timeRemaining <= 10) {
      this.elements.timerValue.classList.add('danger');
    } else if (this.timeRemaining <= 20) {
      this.elements.timerValue.classList.add('warning');
    }
  }

  /**
   * Actualizar display de velocidad
   */
  updateSpeedDisplay() {
    const elapsedTime = this.timeLimit - this.timeRemaining;
    if (elapsedTime > 0) {
      const lettersPerMinute = Math.round((this.correctLetters / elapsedTime) * 60);

      // Actualizar elementos si existen
      if (this.elements.speedValue) {
        this.elements.speedValue.textContent = lettersPerMinute;
      }

      if (this.elements.speedBar) {
        // Actualizar barra de velocidad (máximo 30 letras/min = 100%)
        const speedPercentage = Math.min(100, (lettersPerMinute / 30) * 100);
        this.elements.speedBar.style.width = speedPercentage + '%';
      }
    }
  }

  /**
   * Generar nueva letra objetivo aleatoria
   */
  generateNewTarget() {
    // Seleccionar letra aleatoria diferente a la actual
    let newLetter;
    do {
      newLetter = this.availableLetters[Math.floor(Math.random() * this.availableLetters.length)];
    } while (newLetter === this.currentTargetLetter && this.availableLetters.length > 1);

    this.currentTargetLetter = newLetter;
    this.elements.targetLetter.textContent = newLetter;
    this.lastDetectionTime = Date.now();

    console.log('New target letter:', newLetter);
  }

  /**
   * Manejar detección de letra
   */
  handleDetection(detection) {
    if (this.gameState !== 'playing') {
      return;
    }

    // Verificar si la detección es válida
    if (!this.gameEngine.isValidDetection(detection)) {
      return;
    }

    const detectedLetter = detection.letter.toUpperCase();
    const confidence = detection.confidence;

    console.log(`Detected: ${detectedLetter} (confidence: ${confidence})`);

    // Verificar si es la letra correcta
    if (detectedLetter === this.currentTargetLetter) {
      this.handleCorrectDetection(confidence);
    } else {
      this.handleIncorrectDetection(detectedLetter);
    }
  }

  /**
   * Manejar detección correcta
   */
  handleCorrectDetection(confidence) {
    this.correctLetters++;
    this.totalAttempts++;
    this.currentStreak++;
    
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
      this.elements.bestStreak.textContent = this.bestStreak;
    }

    // Calcular tiempo de detección
    const detectionTime = Date.now() - this.lastDetectionTime;

    // Calcular puntos (15 pts base + bonus por velocidad)
    let points = 15; // Puntos base por letra correcta

    // Bonus por velocidad (Requirement 1.3)
    if (detectionTime < 2000) {
      points += 10; // +10 puntos por detección en menos de 2 segundos
    } else if (detectionTime < 3000) {
      points += 5; // +5 puntos por detección en menos de 3 segundos
    }

    // Bonus por alta confianza
    if (confidence > 0.9) {
      points += 5; // +5 puntos por confianza >90%
    } else if (confidence > 0.8) {
      points += 3; // +3 puntos por confianza >80%
    }

    // Bonus por racha
    if (this.currentStreak >= 5) {
      points += 10; // +10 puntos por racha de 5+
    } else if (this.currentStreak >= 3) {
      points += 5; // +5 puntos por racha de 3+
    }

    // Agregar puntos al juego
    this.gameEngine.addScore(points);

    // Registrar detección
    this.gameEngine.recordDetection(this.currentTargetLetter, confidence, true);

    // Actualizar UI
    this.elements.scoreValue.textContent = this.gameEngine.getScore();
    this.elements.correctLetters.textContent = this.correctLetters;

    // Mostrar feedback positivo
    this.showFeedback('correct', `+${points} pts`);
    this.showMessage(`¡Correcto! +${points} puntos`, 'success');

    // Generar nueva letra objetivo
    this.generateNewTarget();

    console.log(`Correct! Points: ${points}, Total: ${this.gameEngine.getScore()}`);
  }

  /**
   * Manejar detección incorrecta
   */
  handleIncorrectDetection(detectedLetter) {
    this.totalAttempts++;
    this.currentStreak = 0; // Resetear racha

    // Registrar detección incorrecta
    this.gameEngine.recordDetection(detectedLetter, 0, false);

    // Mostrar feedback negativo
    this.showFeedback('incorrect', detectedLetter);
    this.showMessage(`Letra incorrecta: ${detectedLetter}. Intenta con ${this.currentTargetLetter}`, 'error');

    console.log(`Incorrect: ${detectedLetter}, expected: ${this.currentTargetLetter}`);
  }

  /**
   * Mostrar feedback visual
   */
  showFeedback(type, text = '') {
    const indicator = this.elements.feedbackIndicator;
    if (!indicator) {
      console.warn('Feedback indicator not found');
      return;
    }

    indicator.className = 'feedback-indicator';
    indicator.classList.add(type);
    indicator.textContent = text;

    // Remover después de 1 segundo
    setTimeout(() => {
      if (indicator) {
        indicator.className = 'feedback-indicator';
        indicator.textContent = '';
      }
    }, 1000);
  }

  /**
   * Mostrar mensaje
   */
  showMessage(message, type = 'info') {
    this.elements.gameMessage.textContent = message;
    this.elements.gameMessage.className = `game-message ${type}`;
  }

  /**
   * Finalizar el juego
   */
  endGame() {
    console.log('Ending Time Attack Game...');
    this.gameState = 'finished';

    // Detener temporizador
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Detener detección y cámara
    this.gameEngine.stopDetection();
    this.gameEngine.stopCamera();

    // Finalizar sesión de juego
    const summary = this.gameEngine.endGame();

    // Calcular estadísticas finales
    const accuracy = this.totalAttempts > 0 
      ? Math.round((this.correctLetters / this.totalAttempts) * 100) 
      : 0;

    // Calcular bonus adicionales
    let bonusPoints = 0;
    
    // Bonus por 10+ letras
    if (this.correctLetters >= 10) {
      bonusPoints += 20;
    }
    
    // Bonus por 15+ letras
    if (this.correctLetters >= 15) {
      bonusPoints += 30;
    }
    
    // Bonus por 20+ letras
    if (this.correctLetters >= 20) {
      bonusPoints += 50;
    }

    // Bonus por alta precisión
    if (accuracy >= 90) {
      bonusPoints += 30;
    } else if (accuracy >= 80) {
      bonusPoints += 20;
    } else if (accuracy >= 70) {
      bonusPoints += 10;
    }

    // Agregar bonus al score
    if (bonusPoints > 0) {
      this.gameEngine.addScore(bonusPoints);
    }

    const finalScore = this.gameEngine.getScore();

    // Agregar puntos al sistema de puntos (Requirement 1.5)
    const pointsResult = this.pointsSystem.addPoints(finalScore, 'time-attack-game');

    // Actualizar progreso
    this.storageManager.incrementGamesPlayed();
    this.storageManager.updateStreak();

    // Verificar logros (Requirement 1.5)
    const progress = this.storageManager.loadProgress();
    const newAchievements = this.achievementSystem.checkMultipleConditions({
      lettersCompleted: progress.lettersCompleted.length,
      gamesPlayed: progress.gamesPlayed,
      streak: progress.streak,
      points: progress.points,
      perfectGame: accuracy === 100,
      speedRecord: this.correctLetters >= 10 && summary.durationSeconds <= 30
    });

    // Mostrar pantalla de resultados
    this.showResults({
      score: finalScore,
      letters: this.correctLetters,
      accuracy: accuracy,
      streak: this.bestStreak,
      bonus: bonusPoints,
      achievements: newAchievements
    });

    // Actualizar UI
    this.updateUI();

    console.log('Game ended:', {
      score: finalScore,
      letters: this.correctLetters,
      accuracy: accuracy,
      streak: this.bestStreak
    });
  }

  /**
   * Mostrar pantalla de resultados
   */
  showResults(results) {
    // Actualizar valores
    this.elements.resultScore.textContent = results.score;
    this.elements.resultLetters.textContent = results.letters;
    this.elements.resultAccuracy.textContent = results.accuracy + '%';
    this.elements.resultStreak.textContent = results.streak;

    // Mostrar badges si hay logros nuevos
    if (results.achievements && results.achievements.length > 0) {
      this.elements.badgesEarned.innerHTML = '<h3>🏆 Logros Desbloqueados</h3>';
      results.achievements.forEach(achievement => {
        const badge = document.createElement('div');
        badge.className = 'badge-item';
        badge.innerHTML = `
          <div class="badge-icon">${achievement.icon}</div>
          <div class="badge-name">${achievement.name}</div>
        `;
        this.elements.badgesEarned.appendChild(badge);
      });
    } else {
      this.elements.badgesEarned.innerHTML = '';
    }

    // Mostrar pantalla de resultados
    this.elements.resultsScreen.classList.remove('hidden');
  }

  /**
   * Actualizar UI con progreso actual
   */
  updateUI() {
    const status = this.pointsSystem.getStatus();
    this.elements.levelValue.textContent = status.level;
    this.elements.totalPoints.textContent = status.points;
  }

  /**
   * Reiniciar el juego
   */
  restartGame() {
    console.log('Restarting game...');

    // Limpiar motor de juego
    this.gameEngine.cleanup();

    // Resetear estado
    this.gameState = 'idle';
    this.timeRemaining = this.timeLimit;
    this.correctLetters = 0;
    this.totalAttempts = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.currentTargetLetter = null;

    // Ocultar pantalla de resultados
    this.elements.resultsScreen.classList.add('hidden');

    // Resetear UI
    this.elements.startBtn.disabled = false;
    this.elements.restartBtn.disabled = true;
    this.elements.timerValue.textContent = this.timeLimit;
    this.elements.timerValue.classList.remove('warning', 'danger');
    this.elements.targetLetter.textContent = '?';
    this.elements.scoreValue.textContent = '0';
    this.elements.correctLetters.textContent = '0';
    this.elements.bestStreak.textContent = '0';
    this.elements.speedValue.textContent = '0';
    this.elements.speedBar.style.width = '0%';
    this.elements.feedbackIndicator.className = 'feedback-indicator';
    this.elements.feedbackIndicator.textContent = '';
    this.showMessage('Presiona "Iniciar Juego" para comenzar', 'info');

    // Recrear motor de juego
    this.gameEngine = new GameEngine('time-attack', {
      detectionInterval: 300,
      confidenceThreshold: 0.7
    });

    this.gameEngine.setErrorHandler((error) => {
      this.showMessage(error.message, 'error');
    });

    console.log('Game restarted');
  }
}

// Inicializar el juego cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.timeAttackGame = new TimeAttackGame();
  });
} else {
  window.timeAttackGame = new TimeAttackGame();
}
