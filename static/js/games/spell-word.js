/**
 * SpellWordGame - Juego de deletrear palabras con señas ASL
 * 
 * El usuario debe deletrear una palabra letra por letra usando señas ASL.
 * El juego detecta cada letra secuencialmente y avanza automáticamente.
 * 
 * Características:
 * - Obtiene palabra aleatoria de la API
 * - Detecta letras secuencialmente
 * - Valida letra correcta y avanza automáticamente
 * - Calcula puntuación (20 pts/letra + bonus)
 * - Muestra pantalla de resultados al finalizar
 * - Integra con PointsSystem y AchievementSystem
 * 
 * Requirements: 1.2, 1.5
 */

class SpellWordGame {
  constructor() {
    // Sistemas de gamificación
    this.storageManager = new StorageManager();
    this.pointsSystem = new PointsSystem(this.storageManager);
    this.achievementSystem = new AchievementSystem(this.storageManager);
    this.gameEngine = new GameEngine('spell-word', {
      detectionInterval: 300,
      confidenceThreshold: 0.7
    });

    // Estado del juego
    this.currentWord = '';
    this.currentLetterIndex = 0;
    this.gameActive = false;
    this.gameScore = 0;
    this.correctLetters = 0;
    this.startTime = null;
    this.letterStartTime = null;
    this.difficulty = 'easy';

    // Referencias DOM
    this.elements = {
      targetWord: document.getElementById('targetWord'),
      wordDisplay: document.getElementById('wordDisplay'),
      videoElement: document.getElementById('videoElement'),
      feedbackIndicator: document.getElementById('feedbackIndicator'),
      gameMessage: document.getElementById('gameMessage'),
      startBtn: document.getElementById('startBtn'),
      restartBtn: document.getElementById('restartBtn'),
      scoreValue: document.getElementById('scoreValue'),
      correctLetters: document.getElementById('correctLetters'),
      progressValue: document.getElementById('progressValue'),
      progressPercent: document.getElementById('progressPercent'),
      progressBar: document.getElementById('progressBar'),
      levelValue: document.getElementById('levelValue'),
      totalPoints: document.getElementById('totalPoints'),
      resultsScreen: document.getElementById('resultsScreen'),
      resultScore: document.getElementById('resultScore'),
      resultTime: document.getElementById('resultTime'),
      resultAccuracy: document.getElementById('resultAccuracy'),
      resultBonus: document.getElementById('resultBonus'),
      badgesEarned: document.getElementById('badgesEarned')
    };

    // Verificar que todos los elementos existen
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`Element ${key} not found in DOM`);
      }
    }

    this.init();
  }

  /**
   * Inicializar el juego
   */
  init() {
    // Cargar estado del usuario
    this.updateUserStats();

    // Configurar event listeners
    this.elements.startBtn.addEventListener('click', () => this.startGame());
    this.elements.restartBtn.addEventListener('click', () => this.restartGame());

    // Configurar callback de detección
    this.gameEngine.setErrorHandler((error) => this.handleError(error));

    // Registrar callback de subida de nivel
    this.pointsSystem.onLevelUp((data) => {
      this.pointsSystem.showLevelUpNotification(data);
      this.updateUserStats();
    });

    console.log('SpellWordGame initialized');
  }

  /**
   * Iniciar el juego
   */
  async startGame() {
    try {
      // Deshabilitar botón de inicio
      this.elements.startBtn.disabled = true;
      this.elements.startBtn.textContent = 'Iniciando...';

      // Obtener palabra aleatoria de la API
      const word = await this.getRandomWord(this.difficulty);
      if (!word) {
        throw new Error('No se pudo obtener una palabra');
      }

      this.currentWord = word.toUpperCase();
      this.currentLetterIndex = 0;
      this.gameScore = 0;
      this.correctLetters = 0;
      this.startTime = Date.now();

      // Mostrar palabra objetivo
      if (this.elements.targetWord) this.elements.targetWord.textContent = this.currentWord;
      this.renderWordDisplay();

      // Iniciar cámara
      const cameraStarted = await this.gameEngine.startCamera(this.elements.videoElement);
      if (!cameraStarted) {
        throw new Error('No se pudo iniciar la cámara');
      }

      // Iniciar sesión de juego
      this.gameEngine.startGame();
      this.gameActive = true;
      this.letterStartTime = Date.now();

      // Iniciar detección
      this.gameEngine.startDetection((detection) => this.handleDetection(detection));

      // Actualizar UI
      this.elements.gameMessage.textContent = `Haz la seña de la letra: ${this.currentWord[0]}`;
      this.elements.gameMessage.className = 'game-message info';
      this.elements.startBtn.style.display = 'none';
      this.elements.restartBtn.disabled = false;

      // Actualizar racha
      this.storageManager.updateStreak();

      console.log(`Game started with word: ${this.currentWord}`);
    } catch (error) {
      console.error('Error starting game:', error);
      this.showMessage('Error al iniciar el juego: ' + error.message, 'error');
      this.elements.startBtn.disabled = false;
      this.elements.startBtn.textContent = 'Iniciar Juego';
    }
  }

  /**
   * Obtener palabra aleatoria de la API
   * @param {string} difficulty - Dificultad (easy, medium, hard)
   * @returns {Promise<string>} - Palabra aleatoria
   */
  async getRandomWord(difficulty = 'easy') {
    try {
      const response = await fetch(`/api/random-word?difficulty=${difficulty}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta de la API');
      }

      const data = await response.json();
      if (data.success && data.word) {
        return data.word;
      }

      throw new Error('Respuesta inválida de la API');
    } catch (error) {
      console.error('Error fetching random word:', error);
      // Fallback a palabras locales si falla la API
      return this.getFallbackWord(difficulty);
    }
  }

  /**
   * Obtener palabra de respaldo si falla la API
   * @param {string} difficulty - Dificultad
   * @returns {string} - Palabra aleatoria
   */
  getFallbackWord(difficulty) {
    const words = {
      easy: ['HOLA', 'CASA', 'GATO', 'PERRO', 'SOL', 'LUNA', 'AMOR', 'VIDA'],
      medium: ['AMIGO', 'LIBRO', 'FELIZ', 'MUNDO', 'VERDE', 'CIELO'],
      hard: ['ALFABETO', 'LENGUAJE', 'COMUNICAR', 'APRENDER']
    };

    const wordList = words[difficulty] || words.easy;
    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  /**
   * Manejar detección de letra
   * @param {Object} detection - Resultado de la detección
   */
  handleDetection(detection) {
    if (!this.gameActive || !this.gameEngine.isValidDetection(detection)) {
      return;
    }

    const detectedLetter = detection.letter.toUpperCase();
    const expectedLetter = this.currentWord[this.currentLetterIndex];
    const confidence = detection.confidence;

    // Validar si la letra es correcta
    if (detectedLetter === expectedLetter) {
      this.handleCorrectLetter(detectedLetter, confidence);
    } else {
      this.showFeedback('incorrect', detectedLetter);
    }
  }

  /**
   * Manejar letra correcta detectada
   * @param {string} letter - Letra detectada
   * @param {number} confidence - Nivel de confianza
   */
  handleCorrectLetter(letter, confidence) {
    // Calcular tiempo de detección
    const timeToDetect = Date.now() - this.letterStartTime;

    // Calcular puntos por esta letra (20 pts base + bonus)
    let letterPoints = 20; // Puntos base por letra (Requirement 1.2)

    // Bonus por alta confianza
    if (confidence > 0.9) {
      letterPoints += 10;
    } else if (confidence > 0.8) {
      letterPoints += 5;
    }

    // Bonus por velocidad
    if (timeToDetect < 2000) {
      letterPoints += 5;
    } else if (timeToDetect < 3000) {
      letterPoints += 3;
    }

    // Agregar puntos al score del juego
    this.gameScore += letterPoints;
    this.correctLetters++;

    // Registrar detección en el motor
    this.gameEngine.recordDetection(letter, confidence, true);

    // Mostrar feedback positivo
    this.showFeedback('correct', letter, letterPoints);

    // Actualizar UI
    this.updateGameUI();

    // Avanzar a la siguiente letra
    this.currentLetterIndex++;
    this.letterStartTime = Date.now();

    // Verificar si completó la palabra
    if (this.currentLetterIndex >= this.currentWord.length) {
      this.completeGame();
    } else {
      // Mostrar siguiente letra
      const nextLetter = this.currentWord[this.currentLetterIndex];
      this.showMessage(`¡Correcto! Ahora haz la seña de: ${nextLetter}`, 'success');
      this.renderWordDisplay();
    }
  }

  /**
   * Completar el juego
   */
  completeGame() {
    this.gameActive = false;
    this.gameEngine.stopDetection();

    // Calcular tiempo total
    const totalTime = Date.now() - this.startTime;
    const totalSeconds = Math.floor(totalTime / 1000);

    // Calcular bonus adicionales
    let bonusPoints = 0;

    // Bonus por completar sin errores (juego perfecto)
    const isPerfect = this.gameEngine.session.correctDetections === this.gameEngine.session.totalAttempts;
    if (isPerfect) {
      bonusPoints += 50;
    }

    // Bonus por velocidad (completar rápido)
    if (totalSeconds < 30) {
      bonusPoints += 30;
    } else if (totalSeconds < 60) {
      bonusPoints += 15;
    }

    // Bonus por palabra larga
    if (this.currentWord.length >= 6) {
      bonusPoints += 20;
    }

    // Agregar bonus al score
    this.gameScore += bonusPoints;

    // Calcular precisión
    const accuracy = this.gameEngine.session.totalAttempts > 0
      ? Math.round((this.gameEngine.session.correctDetections / this.gameEngine.session.totalAttempts) * 100)
      : 100;

    // Agregar puntos al sistema de puntos global
    const pointsResult = this.pointsSystem.addPoints(this.gameScore, 'spell-word-game');

    // Actualizar estadísticas
    this.storageManager.updateStatistics({
      totalDetections: this.gameEngine.session.totalAttempts,
      correctDetections: this.gameEngine.session.correctDetections,
      totalPlayTime: totalTime
    });

    // Incrementar contador de juegos jugados
    const gamesPlayed = this.storageManager.incrementGamesPlayed();

    // Actualizar mejor puntuación
    const isNewRecord = this.storageManager.updateGameScore('spellWord', this.gameScore);

    // Agregar letras completadas
    for (const letter of this.currentWord) {
      this.storageManager.addCompletedLetter(letter);
    }

    // Verificar logros
    const progress = this.storageManager.loadProgress();
    const newAchievements = this.achievementSystem.checkMultipleConditions({
      lettersCompleted: progress.lettersCompleted.length,
      gamesPlayed: gamesPlayed,
      points: progress.points,
      perfectGame: isPerfect,
      streak: progress.streak
    });

    // Mostrar pantalla de resultados
    this.showResults({
      score: this.gameScore,
      time: totalSeconds,
      accuracy: accuracy,
      bonus: bonusPoints,
      isNewRecord: isNewRecord,
      leveledUp: pointsResult.leveledUp,
      newAchievements: newAchievements
    });

    console.log('Game completed:', {
      word: this.currentWord,
      score: this.gameScore,
      time: totalSeconds,
      accuracy: accuracy
    });
  }

  /**
   * Mostrar pantalla de resultados
   * @param {Object} results - Resultados del juego
   */
  showResults(results) {
    // Ocultar área de juego
    document.querySelector('.game-layout').style.display = 'none';

    // Mostrar pantalla de resultados
    this.elements.resultsScreen.classList.remove('hidden');

    // Actualizar valores
    this.elements.resultScore.textContent = results.score;
    this.elements.resultTime.textContent = `${results.time}s`;
    this.elements.resultAccuracy.textContent = `${results.accuracy}%`;
    this.elements.resultBonus.textContent = `+${results.bonus}`;

    // Mostrar mensaje de nuevo récord
    if (results.isNewRecord) {
      const recordBadge = document.createElement('div');
      recordBadge.className = 'record-badge';
      recordBadge.innerHTML = '🏆 ¡Nuevo Récord!';
      this.elements.resultsScreen.insertBefore(recordBadge, this.elements.resultsScreen.firstChild.nextSibling);
    }

    // Mostrar badges ganados
    if (results.newAchievements && results.newAchievements.length > 0) {
      this.elements.badgesEarned.innerHTML = '<h3>🎖️ Logros Desbloqueados</h3>';
      results.newAchievements.forEach(achievement => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.innerHTML = `
          <span class="badge-icon">${achievement.icon}</span>
          <span class="badge-name">${achievement.name}</span>
        `;
        this.elements.badgesEarned.appendChild(badge);
      });
    }
  }

  /**
   * Reiniciar el juego
   */
  restartGame() {
    // Limpiar estado
    this.gameEngine.cleanup();
    this.gameActive = false;
    this.currentWord = '';
    this.currentLetterIndex = 0;
    this.gameScore = 0;
    this.correctLetters = 0;

    // Resetear UI
    this.elements.targetWord.textContent = '---';
    this.elements.wordDisplay.innerHTML = '';
    this.elements.scoreValue.textContent = '0';
    this.elements.correctLetters.textContent = '0';
    this.elements.progressValue.textContent = '0/0';
    this.elements.progressPercent.textContent = '0%';
    this.elements.progressBar.style.width = '0%';
    this.elements.feedbackIndicator.className = 'feedback-indicator';
    this.elements.gameMessage.textContent = 'Presiona "Iniciar Juego" para comenzar';
    this.elements.gameMessage.className = 'game-message info';

    // Resetear botones
    this.elements.startBtn.style.display = 'inline-block';
    this.elements.startBtn.disabled = false;
    this.elements.startBtn.textContent = 'Iniciar Juego';
    this.elements.restartBtn.disabled = true;

    // Ocultar pantalla de resultados
    this.elements.resultsScreen.classList.add('hidden');
    document.querySelector('.game-layout').style.display = 'flex';

    console.log('Game restarted');
  }

  /**
   * Renderizar display de la palabra con letras
   */
  renderWordDisplay() {
    if (!this.elements.wordDisplay) {
      console.error('wordDisplay element not found');
      return;
    }

    this.elements.wordDisplay.innerHTML = '';

    for (let i = 0; i < this.currentWord.length; i++) {
      const letterBox = document.createElement('div');
      letterBox.className = 'letter-box';

      if (i < this.currentLetterIndex) {
        // Letra completada
        letterBox.classList.add('completed');
        letterBox.textContent = this.currentWord[i];
      } else if (i === this.currentLetterIndex) {
        // Letra actual
        letterBox.classList.add('current');
        letterBox.textContent = this.currentWord[i];
      } else {
        // Letra pendiente
        letterBox.textContent = this.currentWord[i];
      }

      this.elements.wordDisplay.appendChild(letterBox);
    }
  }

  /**
   * Actualizar UI del juego
   */
  updateGameUI() {
    // Actualizar puntuación
    this.elements.scoreValue.textContent = this.gameScore;
    this.elements.correctLetters.textContent = this.correctLetters;

    // Actualizar progreso
    const progress = (this.currentLetterIndex / this.currentWord.length) * 100;
    this.elements.progressValue.textContent = `${this.currentLetterIndex}/${this.currentWord.length}`;
    this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
    this.elements.progressBar.style.width = `${progress}%`;
  }

  /**
   * Actualizar estadísticas del usuario
   */
  updateUserStats() {
    const status = this.pointsSystem.getStatus();
    if (this.elements.levelValue) this.elements.levelValue.textContent = status.level;
    if (this.elements.totalPoints) this.elements.totalPoints.textContent = status.points;
  }

  /**
   * Mostrar feedback visual
   * @param {string} type - Tipo de feedback (correct, incorrect)
   * @param {string} letter - Letra detectada
   * @param {number} points - Puntos ganados (opcional)
   */
  showFeedback(type, letter, points = null) {
    const indicator = this.elements.feedbackIndicator;
    if (!indicator) {
      console.warn('Feedback indicator not found');
      return;
    }

    indicator.className = 'feedback-indicator';

    if (type === 'correct') {
      indicator.classList.add('correct');
      indicator.innerHTML = `
        <div class="feedback-letter">${letter}</div>
        ${points ? `<div class="feedback-points">+${points}</div>` : ''}
      `;
    } else {
      indicator.classList.add('incorrect');
      indicator.innerHTML = `
        <div class="feedback-letter">${letter}</div>
        <div class="feedback-text">Intenta de nuevo</div>
      `;
    }

    // Limpiar después de 1 segundo
    setTimeout(() => {
      if (indicator) {
        indicator.className = 'feedback-indicator';
        indicator.innerHTML = '';
      }
    }, 1000);
  }

  /**
   * Mostrar mensaje en el área de mensajes
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje (info, success, error, warning)
   */
  showMessage(message, type = 'info') {
    this.elements.gameMessage.textContent = message;
    this.elements.gameMessage.className = `game-message ${type}`;
  }

  /**
   * Manejar errores del juego
   * @param {Object} error - Objeto de error
   */
  handleError(error) {
    console.error('Game error:', error);
    this.showMessage(error.message || 'Error en el juego', 'error');

    if (error.type === 'camera') {
      this.elements.startBtn.disabled = false;
      this.elements.startBtn.textContent = 'Iniciar Juego';
      this.elements.startBtn.style.display = 'inline-block';
    }
  }
}

// Inicializar el juego cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.spellWordGame = new SpellWordGame();
  });
} else {
  window.spellWordGame = new SpellWordGame();
}
