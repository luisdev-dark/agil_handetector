/* ============================================
   THEME MANAGER MODULE
   Manages UI theme, statistics display, and notifications
   Requirements: 8.3, 8.4
   ============================================ */

/**
 * Theme Manager
 * Handles header statistics, real-time updates, and notification modals
 */
class ThemeManager {
    constructor() {
        // Referencias a sistemas de gamificación
        this.storageManager = null;
        this.pointsSystem = null;
        this.achievementSystem = null;
        
        // Referencias a elementos DOM del header
        this.headerElements = {
            streak: null,
            points: null,
            level: null
        };
        
        // Estado actual
        this.currentStats = {
            streak: 0,
            points: 0,
            level: 1
        };
        
        // Configuración
        this.config = {
            autoUpdate: true,
            updateInterval: 1000, // ms
            animateChanges: true
        };
        
        // Timer para actualizaciones automáticas
        this.updateTimer = null;
        
        // UIEffects integration
        this.uiEffects = typeof UIEffects !== 'undefined' ? UIEffects : null;
    }

    /**
     * Inicializar el Theme Manager
     * @param {Object} systems - Sistemas de gamificación (storage, points, achievements)
     */
    initialize(systems = {}) {
        console.log('Initializing ThemeManager...');
        
        // Guardar referencias a sistemas
        if (systems.storage) this.storageManager = systems.storage;
        if (systems.points) this.pointsSystem = systems.points;
        if (systems.achievements) this.achievementSystem = systems.achievements;
        
        // Buscar elementos del header
        this.findHeaderElements();
        
        // Cargar estadísticas iniciales
        this.loadStats();
        
        // Iniciar actualizaciones automáticas si está habilitado
        if (this.config.autoUpdate) {
            this.startAutoUpdate();
        }
        
        console.log('ThemeManager initialized');
    }

    /**
     * Buscar y guardar referencias a elementos del header
     */
    findHeaderElements() {
        this.headerElements.streak = document.getElementById('streak-value');
        this.headerElements.points = document.getElementById('points-value');
        this.headerElements.level = document.getElementById('level-value');
        
        // Log de elementos encontrados
        const found = Object.entries(this.headerElements)
            .filter(([key, el]) => el !== null)
            .map(([key]) => key);
        
        if (found.length > 0) {
            console.log('Header elements found:', found.join(', '));
        } else {
            console.warn('No header elements found. Make sure elements with IDs exist: streak-value, points-value, level-value');
        }
    }

    /**
     * Cargar estadísticas desde StorageManager
     */
    loadStats() {
        if (!this.storageManager) {
            console.warn('StorageManager not available');
            return;
        }
        
        const progress = this.storageManager.loadProgress();
        
        this.currentStats = {
            streak: progress.streak || 0,
            points: progress.points || 0,
            level: progress.level || 1
        };
        
        // Actualizar display
        this.updateDisplay();
    }

    /**
     * Actualizar display del header con estadísticas actuales
     */
    updateDisplay() {
        // Actualizar racha
        if (this.headerElements.streak) {
            this.updateElement(this.headerElements.streak, this.currentStats.streak);
        }
        
        // Actualizar puntos
        if (this.headerElements.points) {
            this.updateElement(this.headerElements.points, this.currentStats.points);
        }
        
        // Actualizar nivel
        if (this.headerElements.level) {
            this.updateElement(this.headerElements.level, this.currentStats.level);
        }
    }

    /**
     * Actualizar un elemento con animación opcional
     * @param {HTMLElement} element - Elemento a actualizar
     * @param {number} value - Nuevo valor
     */
    updateElement(element, value) {
        if (!element) return;
        
        const oldValue = parseInt(element.textContent) || 0;
        
        if (this.config.animateChanges && oldValue !== value && this.uiEffects) {
            // Animar contador
            this.uiEffects.animateCounter(element, oldValue, value, 500);
            
            // Agregar efecto visual si aumentó
            if (value > oldValue) {
                element.classList.add('stat-increase');
                setTimeout(() => {
                    element.classList.remove('stat-increase');
                }, 500);
            }
        } else {
            element.textContent = value;
        }
    }

    /**
     * Actualizar estadísticas en tiempo real
     * @param {Object} updates - Objeto con actualizaciones { points, level, streak }
     */
    updateStats(updates = {}) {
        let hasChanges = false;
        
        // Actualizar puntos
        if (updates.points !== undefined && updates.points !== this.currentStats.points) {
            const oldPoints = this.currentStats.points;
            this.currentStats.points = updates.points;
            hasChanges = true;
            
            // Mostrar animación de puntos ganados
            if (updates.points > oldPoints && this.headerElements.points && this.uiEffects) {
                const pointsGained = updates.points - oldPoints;
                this.uiEffects.animatePoints(this.headerElements.points, pointsGained, 'normal');
            }
        }
        
        // Actualizar nivel
        if (updates.level !== undefined && updates.level !== this.currentStats.level) {
            const oldLevel = this.currentStats.level;
            this.currentStats.level = updates.level;
            hasChanges = true;
            
            // Mostrar modal de subida de nivel si aumentó
            if (updates.level > oldLevel) {
                this.showLevelUpModal(updates.level);
            }
        }
        
        // Actualizar racha
        if (updates.streak !== undefined && updates.streak !== this.currentStats.streak) {
            this.currentStats.streak = updates.streak;
            hasChanges = true;
        }
        
        // Actualizar display si hubo cambios
        if (hasChanges) {
            this.updateDisplay();
        }
    }

    /**
     * Sincronizar con PointsSystem
     */
    syncWithPointsSystem() {
        if (!this.pointsSystem) return;
        
        this.updateStats({
            points: this.pointsSystem.points,
            level: this.pointsSystem.level
        });
    }

    /**
     * Sincronizar con StorageManager
     */
    syncWithStorage() {
        if (!this.storageManager) return;
        
        const progress = this.storageManager.loadProgress();
        
        this.updateStats({
            points: progress.points || 0,
            level: progress.level || 1,
            streak: progress.streak || 0
        });
    }

    /**
     * Iniciar actualizaciones automáticas
     */
    startAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.syncWithStorage();
        }, this.config.updateInterval);
        
        console.log('Auto-update started');
    }

    /**
     * Detener actualizaciones automáticas
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        console.log('Auto-update stopped');
    }

    /**
     * Mostrar modal de logro desbloqueado
     * @param {Object} achievement - Objeto de logro
     */
    showAchievementModal(achievement) {
        if (!this.uiEffects) {
            console.warn('UIEffects not available');
            return;
        }
        
        return this.uiEffects.showAchievementUnlock(achievement);
    }

    /**
     * Mostrar modal de subida de nivel
     * @param {number} level - Nuevo nivel alcanzado
     */
    showLevelUpModal(level) {
        if (!this.uiEffects) {
            console.warn('UIEffects not available');
            return;
        }
        
        return this.uiEffects.showLevelUp(level);
    }

    /**
     * Mostrar toast de notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.uiEffects) {
            console.warn('UIEffects not available');
            return;
        }
        
        return this.uiEffects.showToast(message, type, duration);
    }

    /**
     * Notificar puntos ganados
     * @param {number} points - Puntos ganados
     * @param {string} reason - Razón de los puntos
     */
    notifyPointsGained(points, reason = '') {
        // Actualizar estadísticas
        if (this.pointsSystem) {
            const result = this.pointsSystem.addPoints(points, reason);
            
            this.updateStats({
                points: this.pointsSystem.points,
                level: this.pointsSystem.level
            });
            
            // Mostrar modal de nivel si subió
            if (result.leveledUp) {
                this.showLevelUpModal(this.pointsSystem.level);
            }
        }
        
        // Mostrar toast
        const message = reason 
            ? `+${points} puntos - ${reason}` 
            : `+${points} puntos`;
        
        this.showToast(message, 'success', 2000);
    }

    /**
     * Notificar logro desbloqueado
     * @param {Object} achievement - Logro desbloqueado
     */
    notifyAchievementUnlocked(achievement) {
        // Mostrar modal de logro
        this.showAchievementModal(achievement);
        
        // Actualizar estadísticas si es necesario
        this.syncWithStorage();
    }

    /**
     * Notificar racha actualizada
     * @param {number} streak - Nueva racha
     */
    notifyStreakUpdated(streak) {
        this.updateStats({ streak });
        
        // Mostrar toast si la racha es significativa
        if (streak > 0 && streak % 3 === 0) {
            this.showToast(`🔥 ¡${streak} días de racha!`, 'warning', 3000);
        }
    }

    /**
     * Refrescar todas las estadísticas
     */
    refresh() {
        this.loadStats();
        this.updateDisplay();
    }

    /**
     * Configurar opciones del Theme Manager
     * @param {Object} options - Opciones de configuración
     */
    configure(options = {}) {
        this.config = { ...this.config, ...options };
        
        // Reiniciar auto-update si cambió la configuración
        if (options.autoUpdate !== undefined) {
            if (options.autoUpdate) {
                this.startAutoUpdate();
            } else {
                this.stopAutoUpdate();
            }
        }
    }

    /**
     * Limpiar y destruir el Theme Manager
     */
    destroy() {
        this.stopAutoUpdate();
        
        // Limpiar referencias
        this.storageManager = null;
        this.pointsSystem = null;
        this.achievementSystem = null;
        this.headerElements = {
            streak: null,
            points: null,
            level: null
        };
        
        console.log('ThemeManager destroyed');
    }
}

// Crear instancia global
const themeManager = new ThemeManager();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
