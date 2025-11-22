/**
 * MemoryGame - Juego de memoria con pares de letras ASL
 * 
 * El usuario debe encontrar pares de letras volteando cartas.
 * Cuando encuentra un par, debe confirmar haciendo la seña de esa letra.
 * 
 * Características:
 * - Tablero de 12 cartas (6 pares)
 * - Volteo de cartas con animación
 * - Confirmación de pares mediante detección de seña
 * - Calcula puntuación (25 pts/par + bonus)
 * - Muestra pantalla de resultados al completar
 * - Integra con PointsSystem y AchievementSystem
 * 
 * Requirements: 1.4, 1.5
 */

class MemoryGame {
  constructor() {
    // Sistemas de gamificación
    this.storageManager = new StorageManager();
    this.pointsSystem = new PointsSystem(this.storageManager);
    this.achievementSystem = new AchievementSystem(this.storageManager);
    this.gameEngine = new GameEngine('memory-game', {
      detectionInterval: 300,
      confidenceThreshold: 0.7
    });

    // Estado del juego
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 6;
    this.moves = 0;
    this.gameActive = false;
    this.gameScore = 0;
    this.startTime = null;
    this.timerInterval = null;
    this.isProcessing = false;
    this.currentPairLetter = null;
    this.cameraStarted = false;

    // Letras disponibles para el juego (excluyendo J y Z que requieren movimiento)
    this.availableLetters = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K',
      'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
      'V', 'W', 'X', 'Y'
    ];

    // Referencias DOM
    this.elements = {
      memoryBoard: document.getElementById('memoryBoard'),
      movesValue: document.getElementById('movesValue'),
      pairsValue: document.getElementById('pairsValue'),
      timerValue: document.getElementById('timerValue'),
      gameMessage: document.getElementById('gameMessage'),
      startBtn: document.getElementById('startBtn'),
      restartBtn: document.getElementById('restartBtn'),
      scoreValue: document.getElementById('scoreValue'),
      pairsFound: document.getElementById('pairsFound'),
      accuracyValue: document.getElementById('accuracyValue'),
      progressPercent: document.getElementById('progressPercent'),
      progressBar: document.getElementById('progressBar'),
      levelValue: document.getElementById('levelValue'),
      totalPoints: document.getElementById('totalPoints'),
      confirmationModal: document.getElementById('confirmationModal'),
      modalLetter: document.getElementById('modalLetter'),
      modalVideo: document.getElementById('modalVideo'),
      modalMessage: document.getElementById('modalMessage'),
      resultsScreen: document.getElementById('resultsScreen'),
      resultScore: document.getElementById('resultScore'),
      resultMoves: document.getElementById('resultMoves'),
      resultTime: document.getElementById('resultTime'),
      resultAccuracy: document.getElementById('resultAccuracy'),
      badgesEarned: document.getElementById('badgesEarned')
    };

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

    // Configurar callback de error
    this.gameEngine.setErrorHandler((error) => this.handleError(error));

    // Registrar callback de subida de nivel
    this.pointsSystem.onLevelUp((data) => {
      this.pointsSystem.showLevelUpNotification(data);
      this.updateUserStats();
    });

    console.log('MemoryGame initialized');
  }

  /**
   * Iniciar el juego
   */
  async startGame() {
    try {
      // Deshabilitar botón de inicio
      this.elements.startBtn.disabled = true;
      this.elements.startBtn.textContent = 'Iniciando...';

      // Resetear estado
      this.cards = [];
      this.flippedCards = [];
      this.matchedPairs = 0;
      this.moves = 0;
      this.gameScore = 0;
      this.startTime = Date.now();
      this.currentPairLetter = null;

      // Generar cartas
      this.generateCards();
      this.renderBoard();

      // Iniciar sesión de juego
      this.gameEngine.startGame();
      this.gameActive = true;

      // Iniciar temporizador
      this.startTimer();

      // Actualizar UI
      this.updateGameUI();
      this.elements.gameMessage.textContent = 'Encuentra los pares de letras';
      this.elements.gameMessage.className = 'game-message info';
      this.elements.startBtn.style.display = 'none';
      this.elements.restartBtn.disabled = false;

      // Actualizar racha
      this.storageManager.updateStreak();

      console.log('Game started with', this.totalPairs, 'pairs');
    } catch (error) {
      console.error('Error starting game:', error);
      this.showMessage('Error al iniciar el juego: ' + error.message, 'error');
      this.elements.startBtn.disabled = false;
      this.elements.startBtn.textContent = 'Iniciar Juego';
    }
  }

  /**
   * Generar pares de letras aleatorias
   */
  generateCards() {
    // Seleccionar 6 letras aleatorias
    const selectedLetters = this.getRandomLetters(this.totalPairs);
    
    // Crear pares (2 cartas por letra)
    const cardPairs = [];
    selectedLetters.forEach((letter, index) => {
      cardPairs.push({ id: index * 2, letter: letter, matched: false });
      cardPairs.push({ id: index * 2 + 1, letter: letter, matched: false });
    });

    // Mezclar las cartas
    this.cards = this.shuffleArray(cardPairs);
  }

  /**
   * Obtener letras aleatorias
   * @param {number} count - Cantidad de letras a obtener
   * @returns {Array} - Array de letras
   */
  getRandomLetters(count) {
    const shuffled = this.shuffleArray([...this.availableLetters]);
    return shuffled.slice(0, count);
  }

  /**
   * Mezclar array (Fisher-Yates shuffle)
   * @param {Array} array - Array a mezclar
   * @returns {Array} - Array mezclado
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Renderizar tablero de cartas
   */
  renderBoard() {
    this.elements.memoryBoard.innerHTML = '';

    this.cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'memory-card';
      cardElement.dataset.index = index;
      cardElement.dataset.letter = card.letter;

      cardElement.innerHTML = `
        <div class="card-face card-back">?</div>
        <div class="card-face card-front">${card.letter}</div>
      `;

      cardElement.addEventListener('click', () => this.handleCardClick(index));
      this.elements.memoryBoard.appendChild(cardElement);
    });
  }

  /**
   * Manejar clic en carta
   * @param {number} index - Índice de la carta
   */
  handleCardClick(index) {
    // Validaciones
    if (!this.gameActive || this.isProcessing) {
      return;
    }

    const card = this.cards[index];
    const cardElement = this.elements.memoryBoard.children[index];

    // No permitir voltear cartas ya volteadas o emparejadas
    if (cardElement.classList.contains('flipped') || card.matched) {
      return;
    }

    // No permitir más de 2 cartas volteadas
    if (this.flippedCards.length >= 2) {
      return;
    }

    // Voltear carta
    this.flipCard(index);
    this.flippedCards.push(index);

    // Si hay 2 cartas volteadas, verificar si son un par
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateGameUI();
      this.checkForMatch();
    }
  }

  /**
   * Voltear carta
   * @param {number} index - Índice de la carta
   */
  flipCard(index) {
    const cardElement = this.elements.memoryBoard.children[index];
    cardElement.classList.add('flipped');
  }

  /**
   * Desvoltear carta
   * @param {number} index - Índice de la carta
   */
  unflipCard(index) {
    const cardElement = this.elements.memoryBoard.children[index];
    cardElement.classList.remove('flipped');
  }

  /**
   * Verificar si las cartas volteadas son un par
   */
  async checkForMatch() {
    this.isProcessing = true;

    const [index1, index2] = this.flippedCards;
    const card1 = this.cards[index1];
    const card2 = this.cards[index2];

    // Esperar un momento para que el usuario vea las cartas
    await this.sleep(500);

    if (card1.letter === card2.letter) {
      // ¡Es un par!
      this.currentPairLetter = card1.letter;
      await this.confirmPairWithSign();
    } else {
      // No es un par, desvoltear
      this.unflipCard(index1);
      this.unflipCard(index2);
      this.flippedCards = [];
      this.isProcessing = false;
      this.showMessage('No es un par. Intenta de nuevo', 'warning');
    }
  }

  /**
   * Confirmar par con seña ASL
   */
  async confirmPairWithSign() {
    try {
      // Mostrar modal de confirmación
      this.elements.modalLetter.textContent = this.currentPairLetter;
      this.elements.modalMessage.textContent = 'Esperando detección...';
      this.elements.confirmationModal.classList.add('active');

      // Iniciar cámara si no está iniciada
      if (!this.cameraStarted) {
        const cameraStarted = await this.gameEngine.startCamera(this.elements.modalVideo);
        if (!cameraStarted) {
          throw new Error('No se pudo iniciar la cámara');
        }
        this.cameraStarted = true;
      }

      // Iniciar detección
      this.gameEngine.startDetection((detection) => this.handleConfirmationDetection(detection));

    } catch (error) {
      console.error('Error in confirmation:', error);
      this.showMessage('Error en confirmación: ' + error.message, 'error');
      this.cancelConfirmation();
    }
  }

  /**
   * Manejar detección durante confirmación
   * @param {Object} detection - Resultado de la detección
   */
  handleConfirmationDetection(detection) {
    if (!this.gameEngine.isValidDetection(detection)) {
      return;
    }

    const detectedLetter = detection.letter.toUpperCase();
    const confidence = detection.confidence;

    // Mostrar letra detectada
    this.elements.modalMessage.textContent = `Detectado: ${detectedLetter} (${Math.round(confidence * 100)}%)`;

    // Verificar si es la letra correcta
    if (detectedLetter === this.currentPairLetter) {
      this.handleCorrectConfirmation(confidence);
    }
  }

  /**
   * Manejar confirmación correcta
   * @param {number} confidence - Nivel de confianza
   */
  handleCorrectConfirmation(confidence) {
    // Detener detección
    this.gameEngine.stopDetection();

    // Ocultar modal
    this.elements.confirmationModal.classList.remove('active');

    // Marcar cartas como emparejadas
    const [index1, index2] = this.flippedCards;
    this.cards[index1].matched = true;
    this.cards[index2].matched = true;

    const cardElement1 = this.elements.memoryBoard.children[index1];
    const cardElement2 = this.elements.memoryBoard.children[index2];
    cardElement1.classList.add('matched');
    cardElement2.classList.add('matched');

    // Calcular puntos por este par (25 pts base + bonus)
    let pairPoints = 25; // Puntos base por par (Requirement 1.4)

    // Bonus por alta confianza
    if (confidence > 0.9) {
      pairPoints += 10;
    } else if (confidence > 0.8) {
      pairPoints += 5;
    }

    // Agregar puntos al score del juego
    this.gameScore += pairPoints;
    this.matchedPairs++;

    // Registrar detección en el motor
    this.gameEngine.recordDetection(this.currentPairLetter, confidence, true);

    // Limpiar estado
    this.flippedCards = [];
    this.currentPairLetter = null;
    this.isProcessing = false;

    // Actualizar UI
    this.updateGameUI();
    this.showMessage(`¡Par encontrado! +${pairPoints} puntos`, 'success');

    // Verificar si completó el juego
    if (this.matchedPairs >= this.totalPairs) {
      this.completeGame();
    }
  }

  /**
   * Cancelar confirmación
   */
  cancelConfirmation() {
    // Detener detección
    this.gameEngine.stopDetection();

    // Ocultar modal
    this.elements.confirmationModal.classList.remove('active');

    // Desvoltear cartas
    const [index1, index2] = this.flippedCards;
    this.unflipCard(index1);
    this.unflipCard(index2);

    // Limpiar estado
    this.flippedCards = [];
    this.currentPairLetter = null;
    this.isProcessing = false;
  }

  /**
   * Completar el juego
   */
  completeGame() {
    this.gameActive = false;
    this.stopTimer();

    // Calcular tiempo total
    const totalTime = Date.now() - this.startTime;
    const totalSeconds = Math.floor(totalTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Calcular bonus adicionales
    let bonusPoints = 0;

    // Bonus por pocos movimientos (Requirement 1.4)
    if (this.moves <= 12) {
      bonusPoints += 50; // Juego perfecto (mínimo posible)
    } else if (this.moves <= 15) {
      bonusPoints += 30;
    } else if (this.moves <= 20) {
      bonusPoints += 10;
    }

    // Bonus por velocidad (Requirement 1.4)
    if (totalSeconds < 180) { // Menos de 3 minutos
      bonusPoints += 30;
    } else if (totalSeconds < 300) { // Menos de 5 minutos
      bonusPoints += 15;
    }

    // Agregar bonus al score
    this.gameScore += bonusPoints;

    // Calcular precisión (pares encontrados vs intentos)
    const maxPossibleMoves = this.totalPairs; // Mínimo teórico
    const efficiency = Math.min(100, Math.round((maxPossibleMoves / this.moves) * 100));

    // Agregar puntos al sistema de puntos global
    const pointsResult = this.pointsSystem.addPoints(this.gameScore, 'memory-game');

    // Actualizar estadísticas
    this.storageManager.updateStatistics({
      totalDetections: this.gameEngine.session.totalAttempts,
      correctDetections: this.gameEngine.session.correctDetections,
      totalPlayTime: totalTime
    });

    // Incrementar contador de juegos jugados
    const gamesPlayed = this.storageManager.incrementGamesPlayed();

    // Actualizar mejor puntuación
    const isNewRecord = this.storageManager.updateGameScore('memoryGame', this.gameScore);

    // Agregar letras completadas
    this.cards.forEach(card => {
      if (card.matched) {
        this.storageManager.addCompletedLetter(card.letter);
      }
    });

    // Verificar logros
    const progress = this.storageManager.loadProgress();
    const isPerfect = this.moves === this.totalPairs; // Juego perfecto
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
      moves: this.moves,
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      accuracy: efficiency,
      isNewRecord: isNewRecord,
      leveledUp: pointsResult.leveledUp,
      newAchievements: newAchievements
    });

    console.log('Game completed:', {
      score: this.gameScore,
      moves: this.moves,
      time: totalSeconds,
      pairs: this.matchedPairs
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
    this.elements.resultMoves.textContent = results.moves;
    this.elements.resultTime.textContent = results.time;
    this.elements.resultAccuracy.textContent = `${results.accuracy}%`;

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
    this.cameraStarted = false;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.gameScore = 0;
    this.currentPairLetter = null;
    this.isProcessing = false;
    this.stopTimer();

    // Resetear UI
    this.elements.memoryBoard.innerHTML = '';
    this.elements.movesValue.textContent = '0';
    this.elements.pairsValue.textContent = '0/6';
    this.elements.timerValue.textContent = '0:00';
    this.elements.scoreValue.textContent = '0';
    this.elements.pairsFound.textContent = '0';
    this.elements.accuracyValue.textContent = '100%';
    this.elements.progressPercent.textContent = '0%';
    this.elements.progressBar.style.width = '0%';
    this.elements.gameMessage.textContent = 'Presiona "Iniciar Juego" para comenzar';
    this.elements.gameMessage.className = 'game-message info';
    this.elements.confirmationModal.classList.remove('active');

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
   * Iniciar temporizador
   */
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.gameActive) {
        return;
      }

      const elapsed = Date.now() - this.startTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;

      this.elements.timerValue.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }

  /**
   * Detener temporizador
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Actualizar UI del juego
   */
  updateGameUI() {
    // Actualizar movimientos
    this.elements.movesValue.textContent = this.moves;

    // Actualizar pares
    this.elements.pairsValue.textContent = `${this.matchedPairs}/${this.totalPairs}`;
    this.elements.pairsFound.textContent = this.matchedPairs;

    // Actualizar puntuación
    this.elements.scoreValue.textContent = this.gameScore;

    // Actualizar progreso
    const progress = (this.matchedPairs / this.totalPairs) * 100;
    this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
    this.elements.progressBar.style.width = `${progress}%`;

    // Actualizar precisión
    if (this.moves > 0) {
      const efficiency = Math.min(100, Math.round((this.totalPairs / this.moves) * 100));
      this.elements.accuracyValue.textContent = `${efficiency}%`;
    }
  }

  /**
   * Actualizar estadísticas del usuario
   */
  updateUserStats() {
    const status = this.pointsSystem.getStatus();
    this.elements.levelValue.textContent = status.level;
    this.elements.totalPoints.textContent = status.points;
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
      this.cancelConfirmation();
    }
  }

  /**
   * Utilidad: Esperar un tiempo
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar el juego cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.memoryGame = new MemoryGame();
  });
} else {
  window.memoryGame = new MemoryGame();
}
