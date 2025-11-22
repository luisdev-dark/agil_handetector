/* ============================================
   UI EFFECTS MODULE
   Visual feedback and animation utilities
   ============================================ */

/**
 * UI Effects Manager
 * Provides functions for visual feedback, animations, and user interactions
 */
const UIEffects = {
    
    /**
     * Show confetti celebration effect
     * Uses canvas-confetti library (must be loaded separately)
     * @param {Object} options - Confetti configuration options
     * @param {string} type - Type of confetti: 'default', 'achievement', 'levelUp', 'perfect'
     */
    showConfetti(options = {}, type = 'default') {
        // Check if canvas-confetti is loaded
        if (typeof confetti === 'undefined') {
            console.warn('canvas-confetti library not loaded. Include: https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js');
            return;
        }

        // Configuraciones predefinidas por tipo
        const presets = {
            default: {
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#CE82FF', '#FF9600']
            },
            achievement: {
                particleCount: 150,
                spread: 120,
                origin: { y: 0.5 },
                colors: ['#58CC02', '#89E219', '#46A302', '#FFC800'],
                shapes: ['circle', 'square'],
                scalar: 1.3,
                gravity: 0.8
            },
            levelUp: {
                particleCount: 200,
                spread: 180,
                origin: { y: 0.4 },
                colors: ['#FFC800', '#FFD740', '#E0B000', '#FF9600'],
                shapes: ['star', 'circle'],
                scalar: 1.5,
                gravity: 0.6,
                ticks: 100
            },
            perfect: {
                particleCount: 250,
                spread: 360,
                origin: { y: 0.5 },
                colors: ['#FF4B4B', '#FF9600', '#FFC800', '#58CC02', '#1CB0F6', '#CE82FF'],
                shapes: ['circle', 'square'],
                scalar: 1.8,
                gravity: 0.5,
                ticks: 120
            }
        };

        const preset = presets[type] || presets.default;
        const config = { ...preset, ...options };
        
        confetti(config);
    },

    /**
     * Show achievement confetti (more dramatic)
     * Continuous confetti burst from multiple points
     */
    showAchievementConfetti() {
        if (typeof confetti === 'undefined') return;

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Confetti verde desde la izquierda
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#58CC02', '#89E219', '#46A302']
            });
            
            // Confetti azul desde la derecha
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#1CB0F6', '#4FC3F7', '#1899D6']
            });
            
            // Confetti amarillo desde el centro
            confetti({
                ...defaults,
                particleCount: particleCount / 2,
                origin: { x: 0.5, y: 0.3 },
                colors: ['#FFC800', '#FFD740', '#E0B000']
            });
        }, 250);
    },

    /**
     * Show level up confetti (gold theme)
     * Spectacular burst with multiple waves
     */
    showLevelUpConfetti() {
        if (typeof confetti === 'undefined') return;

        // Primera ola - explosión central
        confetti({
            particleCount: 150,
            spread: 180,
            origin: { y: 0.5 },
            colors: ['#FFC800', '#FFD740', '#E0B000', '#FF9600'],
            shapes: ['circle', 'square'],
            scalar: 1.5,
            gravity: 0.6
        });

        // Segunda ola - desde arriba
        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.3 },
                colors: ['#FFC800', '#FFD740'],
                scalar: 1.2
            });
            confetti({
                particleCount: 100,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.3 },
                colors: ['#E0B000', '#FF9600'],
                scalar: 1.2
            });
        }, 200);

        // Tercera ola - lluvia de estrellas
        setTimeout(() => {
            confetti({
                particleCount: 80,
                spread: 360,
                origin: { y: 0.2 },
                colors: ['#FFC800', '#FFD740', '#E0B000', '#FF9600'],
                shapes: ['star'],
                scalar: 2,
                gravity: 0.4,
                ticks: 150
            });
        }, 400);
    },

    /**
     * Show perfect game confetti (rainbow explosion)
     * Most spectacular confetti for perfect scores
     */
    showPerfectConfetti() {
        if (typeof confetti === 'undefined') return;

        const duration = 4000;
        const animationEnd = Date.now() + duration;

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        // Explosión inicial masiva
        confetti({
            particleCount: 300,
            spread: 360,
            origin: { y: 0.5 },
            colors: ['#FF4B4B', '#FF9600', '#FFC800', '#58CC02', '#1CB0F6', '#CE82FF'],
            shapes: ['circle', 'square', 'star'],
            scalar: 2,
            gravity: 0.4,
            ticks: 150
        });

        // Confetti continuo desde múltiples puntos
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 30 * (timeLeft / duration);

            // Confetti desde esquinas
            ['#FF4B4B', '#58CC02', '#1CB0F6', '#FFC800'].forEach((color, index) => {
                const x = index % 2 === 0 ? randomInRange(0, 0.2) : randomInRange(0.8, 1);
                const y = index < 2 ? randomInRange(0, 0.3) : randomInRange(0.7, 1);
                
                confetti({
                    particleCount,
                    spread: 90,
                    origin: { x, y },
                    colors: [color],
                    scalar: 1.5,
                    gravity: 0.5,
                    ticks: 80
                });
            });
        }, 300);
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type} fade-in`;
        toast.textContent = message;

        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFFFFF',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
            maxWidth: '400px',
            wordWrap: 'break-word',
            transition: 'all 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#58CC02',
            error: '#FF4B4B',
            warning: '#FFC800',
            info: '#1CB0F6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;

        // Add to document
        document.body.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    },

    /**
     * Show modal dialog
     * @param {string} title - Modal title
     * @param {string|HTMLElement} content - Modal content (HTML string or element)
     * @param {Object} options - Modal options
     */
    showModal(title, content, options = {}) {
        const defaults = {
            showCloseButton: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            buttons: [],
            onClose: null,
            className: ''
        };

        const config = { ...defaults, ...options };

        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade-in';
        Object.assign(backdrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000',
            padding: '20px'
        });

        // Create modal container
        const modal = document.createElement('div');
        modal.className = `modal-container slide-up ${config.className}`;
        Object.assign(modal.style, {
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative'
        });

        // Create modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        Object.assign(header.style, {
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        Object.assign(titleElement.style, {
            margin: '0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1F1F1F',
            fontFamily: 'Nunito, sans-serif'
        });
        header.appendChild(titleElement);

        // Add close button if enabled
        if (config.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'modal-close-btn';
            Object.assign(closeBtn.style, {
                background: 'none',
                border: 'none',
                fontSize: '32px',
                color: '#777777',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
            });
            closeBtn.onmouseover = () => {
                closeBtn.style.backgroundColor = '#F7F7F7';
                closeBtn.style.color = '#1F1F1F';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.backgroundColor = 'transparent';
                closeBtn.style.color = '#777777';
            };
            closeBtn.onclick = () => closeModal();
            header.appendChild(closeBtn);
        }

        modal.appendChild(header);

        // Create modal body
        const body = document.createElement('div');
        body.className = 'modal-body';
        Object.assign(body.style, {
            marginBottom: '24px',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#3C3C3C',
            fontFamily: 'Nunito, sans-serif'
        });

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        modal.appendChild(body);

        // Create modal footer with buttons
        if (config.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            Object.assign(footer.style, {
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
            });

            config.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn.text;
                button.className = `btn-duo ${btn.className || 'btn-primary'}`;
                button.onclick = () => {
                    if (btn.onClick) btn.onClick();
                    if (btn.closeOnClick !== false) closeModal();
                };
                footer.appendChild(button);
            });

            modal.appendChild(footer);
        }

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Close modal function
        const closeModal = () => {
            backdrop.classList.add('fade-out');
            modal.classList.add('slide-down');
            setTimeout(() => {
                backdrop.remove();
                if (config.onClose) config.onClose();
            }, 300);
        };

        // Close on backdrop click
        if (config.closeOnBackdrop) {
            backdrop.onclick = (e) => {
                if (e.target === backdrop) closeModal();
            };
        }

        // Close on escape key
        if (config.closeOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }

        return { modal, backdrop, close: closeModal };
    },

    /**
     * Animate points gained
     * @param {HTMLElement} element - Element to animate from
     * @param {number} points - Points value to display
     * @param {string} type - Type: 'normal', 'bonus', 'mega'
     */
    animatePoints(element, points, type = 'normal') {
        if (!element) {
            console.warn('Element not provided for animatePoints');
            return;
        }

        const pointsPopup = document.createElement('div');
        pointsPopup.className = `points-popup ${type}`;
        pointsPopup.textContent = `+${points}`;

        // Get element position
        const rect = element.getBoundingClientRect();
        
        // Configuración por tipo
        const config = {
            normal: {
                fontSize: '28px',
                color: '#58CC02',
                duration: 1500
            },
            bonus: {
                fontSize: '36px',
                color: '#FFC800',
                duration: 2000
            },
            mega: {
                fontSize: '48px',
                color: '#FF4B4B',
                duration: 2500
            }
        };
        
        const settings = config[type] || config.normal;
        
        Object.assign(pointsPopup.style, {
            position: 'fixed',
            left: `${rect.left + rect.width / 2}px`,
            top: `${rect.top}px`,
            transform: 'translateX(-50%)',
            fontSize: settings.fontSize,
            fontWeight: '800',
            color: settings.color,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: '9999',
            fontFamily: 'Nunito, sans-serif',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.2)'
        });

        document.body.appendChild(pointsPopup);

        // Animate upward and fade out with easing
        let opacity = 1;
        let translateY = 0;
        let scale = 1;
        let startTime = Date.now();
        const duration = settings.duration;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            translateY = -120 * easeOut;
            opacity = 1 - progress;
            scale = 1 + (0.5 * easeOut);

            pointsPopup.style.transform = `translateX(-50%) translateY(${translateY}px) scale(${scale})`;
            pointsPopup.style.opacity = opacity;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                pointsPopup.remove();
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * Create multiple floating points animations
     * @param {HTMLElement} element - Element to animate from
     * @param {number} points - Total points
     * @param {number} count - Number of floating animations
     */
    animateMultiplePoints(element, points, count = 3) {
        if (!element) return;
        
        const pointsPerAnimation = Math.ceil(points / count);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.animatePoints(element, pointsPerAnimation, 'normal');
            }, i * 150);
        }
    },

    /**
     * Shake element for error feedback
     * @param {HTMLElement} element - Element to shake
     */
    shakeElement(element) {
        if (!element) {
            console.warn('Element not provided for shakeElement');
            return;
        }

        element.classList.add('shake');
        
        // Remove class after animation completes
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    },

    /**
     * Add pulse ring effect to element
     * @param {HTMLElement} element - Element to add pulse ring
     */
    addPulseRing(element) {
        if (!element) return;
        element.classList.add('pulse-ring');
    },

    /**
     * Remove pulse ring effect from element
     * @param {HTMLElement} element - Element to remove pulse ring
     */
    removePulseRing(element) {
        if (!element) return;
        element.classList.remove('pulse-ring');
    },

    /**
     * Show success feedback
     * @param {HTMLElement} element - Element to show success on
     */
    showSuccess(element) {
        if (!element) return;

        element.classList.add('feedback-correct');
        
        // Create checkmark
        const checkmark = document.createElement('div');
        checkmark.className = 'correct-checkmark';
        checkmark.textContent = '✓';
        element.style.position = 'relative';
        element.appendChild(checkmark);

        setTimeout(() => {
            element.classList.remove('feedback-correct');
            checkmark.remove();
        }, 600);
    },

    /**
     * Show error feedback
     * @param {HTMLElement} element - Element to show error on
     */
    showError(element) {
        if (!element) return;

        element.classList.add('feedback-incorrect');
        this.shakeElement(element);

        // Create cross
        const cross = document.createElement('div');
        cross.className = 'incorrect-cross';
        cross.textContent = '✗';
        element.style.position = 'relative';
        element.appendChild(cross);

        setTimeout(() => {
            element.classList.remove('feedback-incorrect');
            cross.remove();
        }, 600);
    },

    /**
     * Create loading spinner
     * @param {HTMLElement} container - Container to add spinner to
     * @returns {HTMLElement} Spinner element
     */
    showLoadingSpinner(container) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        if (container) {
            container.appendChild(spinner);
        }
        
        return spinner;
    },

    /**
     * Remove loading spinner
     * @param {HTMLElement} spinner - Spinner element to remove
     */
    hideLoadingSpinner(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    },

    /**
     * Animate number counter
     * @param {HTMLElement} element - Element containing the number
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateCounter(element, start, end, duration = 1000) {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16); // 60fps
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    },

    /**
     * Show achievement unlock notification
     * @param {Object} achievement - Achievement object with name, description, icon
     */
    showAchievementUnlock(achievement) {
        const content = `
            <div style="text-align: center;">
                <div style="font-size: 80px; margin-bottom: 20px;" class="bounce-in">${achievement.icon || '🏆'}</div>
                <h3 style="font-size: 24px; margin: 0 0 10px 0; color: #1F1F1F;">¡Logro Desbloqueado!</h3>
                <p style="font-size: 20px; font-weight: 700; color: #58CC02; margin: 0 0 10px 0;">${achievement.name}</p>
                <p style="font-size: 16px; color: #777777; margin: 0;">${achievement.description || ''}</p>
            </div>
        `;

        this.showAchievementConfetti();
        
        return this.showModal('', content, {
            showCloseButton: false,
            closeOnBackdrop: true,
            closeOnEscape: true,
            buttons: [
                {
                    text: '¡Genial!',
                    className: 'btn-primary btn-lg'
                }
            ],
            className: 'achievement-modal'
        });
    },

    /**
     * Show level up notification
     * @param {number} level - New level reached
     */
    showLevelUp(level) {
        const content = `
            <div style="text-align: center;">
                <div style="font-size: 80px; margin-bottom: 20px;" class="tada">⭐</div>
                <h3 style="font-size: 28px; margin: 0 0 10px 0; color: #1F1F1F;">¡Subiste de Nivel!</h3>
                <p style="font-size: 48px; font-weight: 800; color: #FFC800; margin: 0;" class="pulse">Nivel ${level}</p>
            </div>
        `;

        this.showLevelUpConfetti();
        
        return this.showModal('', content, {
            showCloseButton: false,
            closeOnBackdrop: true,
            closeOnEscape: true,
            buttons: [
                {
                    text: '¡Continuar!',
                    className: 'btn-warning btn-lg'
                }
            ]
        });
    },

    /**
     * Fade out current screen
     * @param {HTMLElement} element - Element to fade out (default: document.body)
     * @param {number} duration - Duration in ms
     * @returns {Promise} Resolves when fade is complete
     */
    fadeOut(element = document.body, duration = 300) {
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },

    /**
     * Fade in current screen
     * @param {HTMLElement} element - Element to fade in (default: document.body)
     * @param {number} duration - Duration in ms
     * @returns {Promise} Resolves when fade is complete
     */
    fadeIn(element = document.body, duration = 300) {
        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            
            // Force reflow
            element.offsetHeight;
            
            element.style.opacity = '1';
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },

    /**
     * Slide element in from direction
     * @param {HTMLElement} element - Element to slide in
     * @param {string} direction - Direction: 'left', 'right', 'top', 'bottom'
     * @param {number} duration - Duration in ms
     */
    slideIn(element, direction = 'bottom', duration = 400) {
        if (!element) return;
        
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            top: 'translateY(-100%)',
            bottom: 'translateY(100%)'
        };
        
        element.style.transform = transforms[direction] || transforms.bottom;
        element.style.opacity = '0';
        element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
        
        // Force reflow
        element.offsetHeight;
        
        element.style.transform = 'translate(0, 0)';
        element.style.opacity = '1';
    },

    /**
     * Slide element out to direction
     * @param {HTMLElement} element - Element to slide out
     * @param {string} direction - Direction: 'left', 'right', 'top', 'bottom'
     * @param {number} duration - Duration in ms
     * @returns {Promise} Resolves when slide is complete
     */
    slideOut(element, direction = 'bottom', duration = 400) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            const transforms = {
                left: 'translateX(-100%)',
                right: 'translateX(100%)',
                top: 'translateY(-100%)',
                bottom: 'translateY(100%)'
            };
            
            element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
            element.style.transform = transforms[direction] || transforms.bottom;
            element.style.opacity = '0';
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },

    /**
     * Smooth transition between screens
     * @param {Function} callback - Function to execute during transition
     * @param {number} duration - Duration in ms
     */
    async transitionScreen(callback, duration = 300) {
        // Fade out
        await this.fadeOut(document.body, duration);
        
        // Execute callback (e.g., change content)
        if (typeof callback === 'function') {
            await callback();
        }
        
        // Fade in
        await this.fadeIn(document.body, duration);
    },

    /**
     * Show loading overlay with spinner
     * @param {string} message - Loading message
     * @returns {Object} Object with hide() method
     */
    showLoadingOverlay(message = 'Cargando...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay fade-in';
        
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10001',
            gap: '20px'
        });
        
        const spinner = this.showLoadingSpinner();
        const text = document.createElement('p');
        text.textContent = message;
        Object.assign(text.style, {
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Nunito, sans-serif'
        });
        
        overlay.appendChild(spinner);
        overlay.appendChild(text);
        document.body.appendChild(overlay);
        
        return {
            hide: () => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 300);
            },
            updateMessage: (newMessage) => {
                text.textContent = newMessage;
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEffects;
}
