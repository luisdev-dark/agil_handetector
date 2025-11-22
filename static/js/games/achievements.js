/**
 * AchievementSystem - Sistema de logros y badges para gamificación ASL
 * 
 * Maneja:
 * - Definición de logros disponibles
 * - Verificación de requisitos para desbloquear logros
 * - Animaciones de celebración al desbloquear
 * - Integración con StorageManager para persistencia
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

class AchievementSystem {
  constructor(storageManager) {
    this.storageManager = storageManager || new StorageManager();
    
    // Definición de todos los logros disponibles
    this.achievements = [
      // Logros por letras completadas
      {
        id: 'beginner',
        name: 'Principiante ASL',
        description: 'Completa 5 letras diferentes',
        icon: '🌱',
        requirement: 5,
        type: 'letters',
        category: 'progress'
      },
      {
        id: 'advanced',
        name: 'Estudiante Avanzado',
        description: 'Completa 15 letras diferentes',
        icon: '📚',
        requirement: 15,
        type: 'letters',
        category: 'progress'
      },
      {
        id: 'master',
        name: 'Maestro del Alfabeto',
        description: 'Completa las 24 letras del alfabeto',
        icon: '🏆',
        requirement: 24,
        type: 'letters',
        category: 'progress'
      },
      
      // Logros por racha de días
      {
        id: 'streak3',
        name: 'Racha de 3 días',
        description: 'Practica 3 días consecutivos',
        icon: '🔥',
        requirement: 3,
        type: 'streak',
        category: 'consistency'
      },
      {
        id: 'streak7',
        name: 'Racha de 7 días',
        description: 'Practica 7 días consecutivos',
        icon: '⚡',
        requirement: 7,
        type: 'streak',
        category: 'consistency'
      },
      
      // Logros por desempeño
      {
        id: 'speed',
        name: 'Velocista',
        description: 'Completa 10 letras en menos de 30 segundos',
        icon: '⏱️',
        requirement: 1,
        type: 'speed',
        category: 'performance'
      },
      {
        id: 'perfect',
        name: 'Perfeccionista',
        description: 'Completa un juego sin errores',
        icon: '💯',
        requirement: 1,
        type: 'perfect',
        category: 'performance'
      },
      
      // Logros por juegos jugados
      {
        id: 'gamer',
        name: 'Jugador Dedicado',
        description: 'Juega 10 partidas',
        icon: '🎮',
        requirement: 10,
        type: 'games',
        category: 'engagement'
      },
      {
        id: 'champion',
        name: 'Campeón ASL',
        description: 'Alcanza 1000 puntos totales',
        icon: '👑',
        requirement: 1000,
        type: 'points',
        category: 'achievement'
      }
    ];
    
    // Cargar logros desbloqueados desde storage
    this.unlockedAchievements = this.loadUnlockedAchievements();
  }

  /**
   * Cargar logros desbloqueados desde StorageManager
   * @returns {Array} - Array de IDs de logros desbloqueados
   */
  loadUnlockedAchievements() {
    const progress = this.storageManager.loadProgress();
    return progress.achievements || [];
  }

  /**
   * Verificar si un logro está desbloqueado
   * @param {string} achievementId - ID del logro
   * @returns {boolean} - true si está desbloqueado
   */
  isUnlocked(achievementId) {
    return this.unlockedAchievements.includes(achievementId);
  }

  /**
   * Obtener información de un logro por ID
   * @param {string} achievementId - ID del logro
   * @returns {Object|null} - Objeto del logro o null si no existe
   */
  getAchievement(achievementId) {
    return this.achievements.find(a => a.id === achievementId) || null;
  }

  /**
   * Obtener todos los logros de una categoría
   * @param {string} category - Categoría del logro
   * @returns {Array} - Array de logros de esa categoría
   */
  getAchievementsByCategory(category) {
    return this.achievements.filter(a => a.category === category);
  }

  /**
   * Obtener progreso hacia un logro específico
   * @param {string} achievementId - ID del logro
   * @returns {Object} - Objeto con progreso actual y requerido
   */
  getAchievementProgress(achievementId) {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) {
      return { current: 0, required: 0, percentage: 0 };
    }

    const progress = this.storageManager.loadProgress();
    let current = 0;

    switch (achievement.type) {
      case 'letters':
        current = progress.lettersCompleted.length;
        break;
      case 'streak':
        current = progress.streak || 0;
        break;
      case 'games':
        current = progress.gamesPlayed || 0;
        break;
      case 'points':
        current = progress.points || 0;
        break;
      case 'speed':
      case 'perfect':
        current = this.isUnlocked(achievementId) ? 1 : 0;
        break;
      default:
        current = 0;
    }

    const percentage = Math.min(100, Math.floor((current / achievement.requirement) * 100));

    return {
      current: current,
      required: achievement.requirement,
      percentage: percentage,
      unlocked: this.isUnlocked(achievementId)
    };
  }

  /**
   * Verificar y desbloquear logros basados en el progreso actual
   * @param {string} type - Tipo de logro a verificar (opcional, verifica todos si no se especifica)
   * @param {number} value - Valor actual para verificar
   * @returns {Array} - Array de logros recién desbloqueados
   */
  checkAchievements(type = null, value = null) {
    const newlyUnlocked = [];
    const progress = this.storageManager.loadProgress();

    // Filtrar logros a verificar
    const achievementsToCheck = type 
      ? this.achievements.filter(a => a.type === type)
      : this.achievements;

    for (const achievement of achievementsToCheck) {
      // Saltar si ya está desbloqueado
      if (this.isUnlocked(achievement.id)) {
        continue;
      }

      let currentValue = value;
      
      // Si no se proporcionó valor, obtenerlo del progreso
      if (currentValue === null) {
        switch (achievement.type) {
          case 'letters':
            currentValue = progress.lettersCompleted.length;
            break;
          case 'streak':
            currentValue = progress.streak || 0;
            break;
          case 'games':
            currentValue = progress.gamesPlayed || 0;
            break;
          case 'points':
            currentValue = progress.points || 0;
            break;
          default:
            continue;
        }
      }

      // Verificar si cumple el requisito
      if (currentValue >= achievement.requirement) {
        this.unlockAchievement(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Desbloquear un logro específico
   * @param {string} achievementId - ID del logro a desbloquear
   * @returns {boolean} - true si se desbloqueó (false si ya estaba desbloqueado)
   */
  unlockAchievement(achievementId) {
    if (this.isUnlocked(achievementId)) {
      return false;
    }

    // Agregar a la lista de desbloqueados
    this.unlockedAchievements.push(achievementId);
    
    // Guardar en storage
    const saved = this.storageManager.addAchievement(achievementId);
    
    if (saved) {
      console.log(`Achievement unlocked: ${achievementId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Desbloquear logro especial (speed, perfect, etc.)
   * @param {string} achievementId - ID del logro especial
   * @returns {Object|null} - Logro desbloqueado o null
   */
  unlockSpecialAchievement(achievementId) {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) {
      return null;
    }

    if (this.unlockAchievement(achievementId)) {
      return achievement;
    }
    
    return null;
  }

  /**
   * Mostrar animación de celebración para logro desbloqueado
   * @param {Object} achievement - Objeto del logro desbloqueado
   * @param {HTMLElement} container - Contenedor donde mostrar la animación (opcional)
   */
  showAchievementUnlocked(achievement, container = null) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
          <div class="achievement-title">¡Logro Desbloqueado!</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      </div>
    `;

    // Agregar estilos inline si no hay CSS externo
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: achievementPopIn 0.5s ease-out forwards;
      max-width: 400px;
      text-align: center;
    `;

    // Agregar animación CSS si no existe
    if (!document.getElementById('achievement-animations')) {
      const style = document.createElement('style');
      style.id = 'achievement-animations';
      style.textContent = `
        @keyframes achievementPopIn {
          0% {
            transform: translate(-50%, -50%) scale(0);
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
        
        @keyframes achievementPopOut {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }
        
        .achievement-notification .achievement-icon {
          font-size: 64px;
          margin-bottom: 15px;
          animation: iconBounce 0.6s ease-in-out;
        }
        
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .achievement-notification .achievement-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .achievement-notification .achievement-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .achievement-notification .achievement-description {
          font-size: 14px;
          opacity: 0.9;
        }
      `;
      document.head.appendChild(style);
    }

    // Agregar al contenedor o al body
    const targetContainer = container || document.body;
    targetContainer.appendChild(notification);

    // Reproducir sonido de celebración (opcional)
    this.playAchievementSound();

    // Remover después de 4 segundos
    setTimeout(() => {
      notification.style.animation = 'achievementPopOut 0.3s ease-in forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }

  /**
   * Reproducir sonido de celebración (opcional)
   */
  playAchievementSound() {
    // Crear un sonido simple usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Silenciar errores de audio
      console.log('Audio not available');
    }
  }

  /**
   * Obtener estadísticas de logros
   * @returns {Object} - Estadísticas de logros desbloqueados
   */
  getStatistics() {
    const total = this.achievements.length;
    const unlocked = this.unlockedAchievements.length;
    const percentage = Math.floor((unlocked / total) * 100);

    const byCategory = {};
    for (const achievement of this.achievements) {
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { total: 0, unlocked: 0 };
      }
      byCategory[achievement.category].total++;
      if (this.isUnlocked(achievement.id)) {
        byCategory[achievement.category].unlocked++;
      }
    }

    return {
      total: total,
      unlocked: unlocked,
      locked: total - unlocked,
      percentage: percentage,
      byCategory: byCategory
    };
  }

  /**
   * Obtener todos los logros con su estado
   * @returns {Array} - Array de logros con información de progreso
   */
  getAllAchievementsWithProgress() {
    return this.achievements.map(achievement => ({
      ...achievement,
      progress: this.getAchievementProgress(achievement.id)
    }));
  }

  /**
   * Verificar múltiples condiciones y desbloquear logros correspondientes
   * @param {Object} conditions - Objeto con condiciones a verificar
   * @returns {Array} - Array de logros recién desbloqueados
   */
  checkMultipleConditions(conditions) {
    const newlyUnlocked = [];

    // Verificar letras completadas
    if (conditions.lettersCompleted !== undefined) {
      const letterAchievements = this.checkAchievements('letters', conditions.lettersCompleted);
      newlyUnlocked.push(...letterAchievements);
    }

    // Verificar racha
    if (conditions.streak !== undefined) {
      const streakAchievements = this.checkAchievements('streak', conditions.streak);
      newlyUnlocked.push(...streakAchievements);
    }

    // Verificar juegos jugados
    if (conditions.gamesPlayed !== undefined) {
      const gameAchievements = this.checkAchievements('games', conditions.gamesPlayed);
      newlyUnlocked.push(...gameAchievements);
    }

    // Verificar puntos
    if (conditions.points !== undefined) {
      const pointAchievements = this.checkAchievements('points', conditions.points);
      newlyUnlocked.push(...pointAchievements);
    }

    // Verificar logros especiales
    if (conditions.perfectGame && !this.isUnlocked('perfect')) {
      const perfectAchievement = this.unlockSpecialAchievement('perfect');
      if (perfectAchievement) {
        newlyUnlocked.push(perfectAchievement);
      }
    }

    if (conditions.speedRecord && !this.isUnlocked('speed')) {
      const speedAchievement = this.unlockSpecialAchievement('speed');
      if (speedAchievement) {
        newlyUnlocked.push(speedAchievement);
      }
    }

    // Mostrar notificaciones para logros desbloqueados
    for (const achievement of newlyUnlocked) {
      this.showAchievementUnlocked(achievement);
    }

    return newlyUnlocked;
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AchievementSystem;
}
