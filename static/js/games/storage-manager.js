/**
 * StorageManager - Gestión centralizada de LocalStorage para el sistema de gamificación ASL
 * 
 * Maneja la persistencia de progreso del usuario, incluyendo:
 * - Puntos y niveles
 * - Logros desbloqueados
 * - Letras completadas
 * - Estadísticas de juegos
 * - Exportación/importación de datos
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

class StorageManager {
  constructor() {
    this.storageKey = 'asl_gamification_data';
    this.cache = null; // Cache para reducir lecturas de LocalStorage
    this.cacheTimestamp = 0;
    this.cacheTimeout = 5000; // 5 segundos de cache
  }

  /**
   * Guardar progreso completo o parcial
   * @param {Object} data - Datos a guardar (se mezclan con datos existentes)
   * @returns {boolean} - true si se guardó exitosamente
   */
  saveProgress(data) {
    try {
      const currentData = this.loadProgress();
      const mergedData = {
        ...currentData,
        ...data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(mergedData));

      // Invalidar cache para forzar recarga en próxima lectura
      this.cache = null;
      this.cacheTimestamp = 0;

      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  /**
   * Cargar progreso completo desde LocalStorage (con cache)
   * @returns {Object} - Datos del usuario o datos por defecto si no existen
   */
  loadProgress() {
    try {
      const now = Date.now();

      // Usar cache si está disponible y no ha expirado
      if (this.cache && (now - this.cacheTimestamp) < this.cacheTimeout) {
        return JSON.parse(JSON.stringify(this.cache)); // Retornar copia profunda
      }

      const data = localStorage.getItem(this.storageKey);
      let parsedData;
      if (data) {
        parsedData = JSON.parse(data);
      } else {
        parsedData = this.getDefaultData();
      }

      // Actualizar cache
      this.cache = JSON.parse(JSON.stringify(parsedData)); // Copia profunda
      this.cacheTimestamp = now;

      return parsedData;
    } catch (error) {
      console.error('Error loading progress:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Exportar progreso como archivo JSON descargable
   * @returns {Object} - Objeto con URL del blob y nombre de archivo
   */
  exportProgress() {
    try {
      const data = this.loadProgress();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `asl_progress_${new Date().toISOString().split('T')[0]}.json`;
      
      return {
        success: true,
        url: url,
        filename: filename
      };
    } catch (error) {
      console.error('Error exporting progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Importar progreso desde un string JSON
   * @param {string} jsonString - String JSON con los datos a importar
   * @returns {Object} - Resultado de la importación
   */
  importProgress(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Validar que tenga la estructura básica esperada
      if (!this.validateProgressData(data)) {
        return {
          success: false,
          error: 'Formato de datos inválido'
        };
      }

      // Guardar datos importados
      localStorage.setItem(this.storageKey, JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }));

      // Limpiar cache para forzar recarga
      this.cache = null;
      this.cacheTimestamp = 0;

      return {
        success: true,
        message: 'Progreso importado exitosamente'
      };
    } catch (error) {
      console.error('Error importing progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validar estructura de datos de progreso
   * @param {Object} data - Datos a validar
   * @returns {boolean} - true si los datos son válidos
   */
  validateProgressData(data) {
    // Verificar que sea un objeto
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    // Verificar propiedades requeridas
    const requiredProps = ['points', 'level', 'achievements', 'lettersCompleted'];
    for (const prop of requiredProps) {
      if (!(prop in data)) {
        return false;
      }
    }
    
    // Verificar tipos básicos
    if (typeof data.points !== 'number' || typeof data.level !== 'number') {
      return false;
    }
    
    if (!Array.isArray(data.achievements) || !Array.isArray(data.lettersCompleted)) {
      return false;
    }
    
    return true;
  }

  /**
   * Obtener estructura de datos por defecto
   * @returns {Object} - Datos iniciales del usuario
   */
  getDefaultData() {
    return {
      points: 0,
      level: 1,
      achievements: [],
      lettersCompleted: [],
      gamesPlayed: 0,
      lastPlayDate: null,
      streak: 0,
      gameScores: {
        spellWord: 0,
        timeAttack: 0,
        memoryGame: 0
      },
      statistics: {
        totalDetections: 0,
        correctDetections: 0,
        averageConfidence: 0,
        totalPlayTime: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Actualizar una propiedad específica del progreso
   * @param {string} key - Clave de la propiedad
   * @param {*} value - Valor a establecer
   * @returns {boolean} - true si se actualizó exitosamente
   */
  updateProperty(key, value) {
    try {
      const data = this.loadProgress();
      data[key] = value;
      return this.saveProgress(data);
    } catch (error) {
      console.error('Error updating property:', error);
      return false;
    }
  }

  /**
   * Obtener una propiedad específica del progreso
   * @param {string} key - Clave de la propiedad
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {*} - Valor de la propiedad
   */
  getProperty(key, defaultValue = null) {
    try {
      const data = this.loadProgress();
      return data[key] !== undefined ? data[key] : defaultValue;
    } catch (error) {
      console.error('Error getting property:', error);
      return defaultValue;
    }
  }

  /**
   * Limpiar todo el progreso (resetear a valores por defecto)
   * @returns {boolean} - true si se limpió exitosamente
   */
  clearProgress() {
    try {
      localStorage.removeItem(this.storageKey);

      // Limpiar cache
      this.cache = null;
      this.cacheTimestamp = 0;

      return true;
    } catch (error) {
      console.error('Error clearing progress:', error);
      return false;
    }
  }

  /**
   * Actualizar racha de días consecutivos
   * @returns {Object} - Información de la racha actualizada
   */
  updateStreak() {
    try {
      const data = this.loadProgress();
      const today = new Date().toISOString().split('T')[0];
      const lastPlayDate = data.lastPlayDate;
      
      if (!lastPlayDate) {
        // Primera vez jugando
        data.streak = 1;
        data.lastPlayDate = today;
      } else if (lastPlayDate === today) {
        // Ya jugó hoy, no cambiar racha
        return {
          streak: data.streak,
          isNewDay: false
        };
      } else {
        // Verificar si es día consecutivo
        const lastDate = new Date(lastPlayDate);
        const currentDate = new Date(today);
        const diffTime = currentDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Día consecutivo
          data.streak += 1;
        } else {
          // Se rompió la racha
          data.streak = 1;
        }
        
        data.lastPlayDate = today;
      }
      
      this.saveProgress(data);
      
      return {
        streak: data.streak,
        isNewDay: true,
        lastPlayDate: data.lastPlayDate
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return {
        streak: 0,
        isNewDay: false,
        error: error.message
      };
    }
  }

  /**
   * Agregar una letra completada (sin duplicados)
   * @param {string} letter - Letra completada
   * @returns {boolean} - true si se agregó (false si ya existía)
   */
  addCompletedLetter(letter) {
    try {
      const data = this.loadProgress();
      if (!data.lettersCompleted.includes(letter)) {
        data.lettersCompleted.push(letter);
        this.saveProgress(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding completed letter:', error);
      return false;
    }
  }

  /**
   * Agregar un logro desbloqueado (sin duplicados)
   * @param {string} achievementId - ID del logro
   * @returns {boolean} - true si se agregó (false si ya existía)
   */
  addAchievement(achievementId) {
    try {
      const data = this.loadProgress();
      if (!data.achievements.includes(achievementId)) {
        data.achievements.push(achievementId);
        this.saveProgress(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding achievement:', error);
      return false;
    }
  }

  /**
   * Actualizar mejor puntuación de un juego
   * @param {string} gameType - Tipo de juego (spellWord, timeAttack, memoryGame)
   * @param {number} score - Nueva puntuación
   * @returns {boolean} - true si es un nuevo récord
   */
  updateGameScore(gameType, score) {
    try {
      const data = this.loadProgress();
      if (!data.gameScores) {
        data.gameScores = {};
      }
      
      const currentBest = data.gameScores[gameType] || 0;
      if (score > currentBest) {
        data.gameScores[gameType] = score;
        this.saveProgress(data);
        return true; // Nuevo récord
      }
      return false; // No es récord
    } catch (error) {
      console.error('Error updating game score:', error);
      return false;
    }
  }

  /**
   * Incrementar contador de juegos jugados
   * @returns {number} - Nuevo total de juegos jugados
   */
  incrementGamesPlayed() {
    try {
      const data = this.loadProgress();
      data.gamesPlayed = (data.gamesPlayed || 0) + 1;
      this.saveProgress(data);
      return data.gamesPlayed;
    } catch (error) {
      console.error('Error incrementing games played:', error);
      return 0;
    }
  }

  /**
   * Actualizar estadísticas de detección
   * @param {Object} stats - Estadísticas a actualizar
   * @returns {boolean} - true si se actualizó exitosamente
   */
  updateStatistics(stats) {
    try {
      const data = this.loadProgress();
      if (!data.statistics) {
        data.statistics = {
          totalDetections: 0,
          correctDetections: 0,
          averageConfidence: 0,
          totalPlayTime: 0
        };
      }
      
      // Actualizar estadísticas
      if (stats.totalDetections !== undefined) {
        data.statistics.totalDetections += stats.totalDetections;
      }
      if (stats.correctDetections !== undefined) {
        data.statistics.correctDetections += stats.correctDetections;
      }
      if (stats.totalPlayTime !== undefined) {
        data.statistics.totalPlayTime += stats.totalPlayTime;
      }
      if (stats.averageConfidence !== undefined) {
        // Calcular promedio ponderado
        const total = data.statistics.totalDetections;
        if (total > 0) {
          data.statistics.averageConfidence = 
            ((data.statistics.averageConfidence * (total - 1)) + stats.averageConfidence) / total;
        } else {
          data.statistics.averageConfidence = stats.averageConfidence;
        }
      }
      
      this.saveProgress(data);
      return true;
    } catch (error) {
      console.error('Error updating statistics:', error);
      return false;
    }
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
