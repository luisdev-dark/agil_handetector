/**
 * PointsSystem - Sistema de puntos y niveles para gamificación ASL
 * 
 * Maneja:
 * - Cálculo de puntos por detección (basado en confianza y velocidad)
 * - Sistema de niveles (100 puntos por nivel)
 * - Notificaciones de subida de nivel
 * - Persistencia mediante StorageManager
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

class PointsSystem {
  /**
   * Constructor del sistema de puntos
   * @param {StorageManager} storageManager - Instancia de StorageManager para persistencia
   */
  constructor(storageManager) {
    if (!storageManager) {
      throw new Error('StorageManager is required for PointsSystem');
    }
    
    this.storageManager = storageManager;
    this.pointsPerLevel = 100; // Puntos necesarios por nivel (Requirement 3.3)
    this.levelUpCallbacks = []; // Callbacks para notificaciones de nivel
    
    // Cargar estado actual desde storage
    this.loadFromStorage();
  }

  /**
   * Cargar puntos y nivel desde StorageManager
   */
  loadFromStorage() {
    const progress = this.storageManager.loadProgress();
    this.points = progress.points || 0;
    this.level = progress.level || 1;
  }

  /**
   * Guardar puntos y nivel en StorageManager
   */
  saveToStorage() {
    return this.storageManager.saveProgress({
      points: this.points,
      level: this.level
    });
  }

  /**
   * Agregar puntos al usuario
   * @param {number} amount - Cantidad de puntos a agregar
   * @param {string} reason - Razón por la que se otorgan los puntos
   * @returns {Object} - Resultado con puntos actuales y si subió de nivel
   */
  addPoints(amount, reason = 'unknown') {
    if (typeof amount !== 'number' || amount < 0) {
      console.error('Invalid points amount:', amount);
      return {
        points: this.points,
        level: this.level,
        leveledUp: false,
        error: 'Invalid points amount'
      };
    }

    const previousLevel = this.level;
    this.points += amount;
    
    // Verificar si subió de nivel
    const levelUpResult = this.checkLevelUp();
    
    // Guardar en storage
    this.saveToStorage();
    
    // Log para debugging
    console.log(`Points added: +${amount} (${reason}). Total: ${this.points}, Level: ${this.level}`);
    
    return {
      points: this.points,
      level: this.level,
      pointsAdded: amount,
      reason: reason,
      leveledUp: levelUpResult.leveledUp,
      levelsGained: this.level - previousLevel,
      previousLevel: previousLevel
    };
  }

  /**
   * Verificar y procesar subidas de nivel
   * @returns {Object} - Información sobre subidas de nivel
   */
  checkLevelUp() {
    let leveledUp = false;
    let levelsGained = 0;
    const previousLevel = this.level;
    
    // Calcular nuevo nivel basado en puntos totales
    // Cada nivel requiere 100 puntos (Requirement 3.3)
    const newLevel = Math.floor(this.points / this.pointsPerLevel) + 1;
    
    if (newLevel > this.level) {
      levelsGained = newLevel - this.level;
      this.level = newLevel;
      leveledUp = true;
      
      // Ejecutar callbacks de notificación (Requirement 3.4)
      this.notifyLevelUp(previousLevel, this.level, levelsGained);
      
      console.log(`Level up! ${previousLevel} → ${this.level} (+${levelsGained} levels)`);
    }
    
    return {
      leveledUp: leveledUp,
      levelsGained: levelsGained,
      previousLevel: previousLevel,
      currentLevel: this.level
    };
  }

  /**
   * Calcular puntos por detección de letra
   * Basado en confianza y velocidad de detección (Requirements 3.1, 3.2)
   * 
   * @param {number} confidence - Nivel de confianza de la detección (0-1)
   * @param {number} timeToDetect - Tiempo en milisegundos para detectar
   * @returns {number} - Puntos calculados
   */
  calculateDetectionPoints(confidence, timeToDetect = null) {
    // Validar entrada
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      console.error('Invalid confidence value:', confidence);
      return 0;
    }

    let basePoints = 10; // Puntos base por detección correcta
    
    // Bonus por alta confianza (Requirement 3.1)
    if (confidence > 0.9) {
      basePoints += 5; // +5 puntos por confianza >90%
    } else if (confidence > 0.8) {
      basePoints += 3; // +3 puntos por confianza >80%
    } else if (confidence > 0.7) {
      basePoints += 1; // +1 punto por confianza >70%
    }
    
    // Bonus por velocidad (Requirement 3.2)
    if (timeToDetect !== null && typeof timeToDetect === 'number') {
      if (timeToDetect < 1000) {
        basePoints += 5; // +5 puntos por detección en menos de 1 segundo
      } else if (timeToDetect < 2000) {
        basePoints += 3; // +3 puntos por detección en menos de 2 segundos
      } else if (timeToDetect < 3000) {
        basePoints += 1; // +1 punto por detección en menos de 3 segundos
      }
    }
    
    return basePoints;
  }

  /**
   * Registrar callback para notificaciones de subida de nivel
   * @param {Function} callback - Función a ejecutar cuando sube de nivel
   */
  onLevelUp(callback) {
    if (typeof callback === 'function') {
      this.levelUpCallbacks.push(callback);
    }
  }

  /**
   * Notificar a todos los callbacks registrados sobre subida de nivel
   * @param {number} previousLevel - Nivel anterior
   * @param {number} newLevel - Nuevo nivel
   * @param {number} levelsGained - Niveles ganados
   */
  notifyLevelUp(previousLevel, newLevel, levelsGained) {
    const levelUpData = {
      previousLevel: previousLevel,
      newLevel: newLevel,
      levelsGained: levelsGained,
      totalPoints: this.points,
      timestamp: new Date().toISOString()
    };
    
    // Ejecutar todos los callbacks registrados
    this.levelUpCallbacks.forEach(callback => {
      try {
        callback(levelUpData);
      } catch (error) {
        console.error('Error in level up callback:', error);
      }
    });
  }

  /**
   * Mostrar notificación visual de subida de nivel
   * @param {Object} levelUpData - Datos de la subida de nivel
   */
  showLevelUpNotification(levelUpData) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
      <div class="level-up-content">
        <h2>¡Subiste de Nivel!</h2>
        <div class="level-display">
          <span class="old-level">${levelUpData.previousLevel}</span>
          <span class="arrow">→</span>
          <span class="new-level">${levelUpData.newLevel}</span>
        </div>
        <p>¡Sigue así! 🎉</p>
      </div>
    `;
    
    // Agregar estilos inline si no existen estilos externos
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: levelUpAnimation 0.5s ease-out;
      text-align: center;
      min-width: 300px;
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'levelUpFadeOut 0.5s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }

  /**
   * Obtener puntos actuales
   * @returns {number} - Puntos totales
   */
  getPoints() {
    return this.points;
  }

  /**
   * Obtener nivel actual
   * @returns {number} - Nivel actual
   */
  getLevel() {
    return this.level;
  }

  /**
   * Obtener puntos necesarios para el siguiente nivel
   * @returns {number} - Puntos necesarios
   */
  getPointsToNextLevel() {
    const pointsInCurrentLevel = this.points % this.pointsPerLevel;
    return this.pointsPerLevel - pointsInCurrentLevel;
  }

  /**
   * Obtener progreso hacia el siguiente nivel (0-1)
   * @returns {number} - Progreso como decimal (0-1)
   */
  getLevelProgress() {
    const pointsInCurrentLevel = this.points % this.pointsPerLevel;
    return pointsInCurrentLevel / this.pointsPerLevel;
  }

  /**
   * Obtener información completa del estado actual
   * @returns {Object} - Estado completo del sistema de puntos
   */
  getStatus() {
    return {
      points: this.points,
      level: this.level,
      pointsToNextLevel: this.getPointsToNextLevel(),
      levelProgress: this.getLevelProgress(),
      pointsPerLevel: this.pointsPerLevel
    };
  }

  /**
   * Resetear puntos y nivel (útil para testing)
   * @param {boolean} saveToStorage - Si debe guardar en storage
   */
  reset(saveToStorage = true) {
    this.points = 0;
    this.level = 1;
    
    if (saveToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Establecer puntos directamente (útil para testing o importación)
   * @param {number} points - Puntos a establecer
   * @param {boolean} recalculateLevel - Si debe recalcular el nivel
   */
  setPoints(points, recalculateLevel = true) {
    if (typeof points !== 'number' || points < 0) {
      console.error('Invalid points value:', points);
      return false;
    }
    
    this.points = points;
    
    if (recalculateLevel) {
      this.checkLevelUp();
    }
    
    this.saveToStorage();
    return true;
  }

  /**
   * Establecer nivel directamente (útil para testing o importación)
   * @param {number} level - Nivel a establecer
   */
  setLevel(level) {
    if (typeof level !== 'number' || level < 1) {
      console.error('Invalid level value:', level);
      return false;
    }
    
    this.level = level;
    this.saveToStorage();
    return true;
  }
}

// Agregar estilos de animación al documento si no existen
if (typeof document !== 'undefined') {
  const styleId = 'points-system-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes levelUpAnimation {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
      
      @keyframes levelUpFadeOut {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
      }
      
      .level-up-notification h2 {
        margin: 0 0 1rem 0;
        font-size: 1.8rem;
        font-weight: bold;
      }
      
      .level-up-notification .level-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 1rem 0;
        font-size: 2.5rem;
        font-weight: bold;
      }
      
      .level-up-notification .old-level {
        opacity: 0.7;
      }
      
      .level-up-notification .new-level {
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }
      
      .level-up-notification .arrow {
        font-size: 2rem;
      }
      
      .level-up-notification p {
        margin: 1rem 0 0 0;
        font-size: 1.2rem;
      }
    `;
    document.head.appendChild(style);
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PointsSystem;
}
