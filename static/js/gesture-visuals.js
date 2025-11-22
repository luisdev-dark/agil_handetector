// Biblioteca de gestos visuales en SVG
class GestureVisuals {
    constructor() {
        this.gestures = {
            'hola': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="hand-animation">
                            <!-- Palma -->
                            <ellipse cx="100" cy="120" rx="25" ry="35" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Dedos -->
                            <rect x="85" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333" stroke-width="1"/>
                            <rect x="95" y="75" width="8" height="45" rx="4" fill="#fdbcb4" stroke="#333" stroke-width="1"/>
                            <rect x="105" y="80" width="8" height="40" rx="4" fill="#fdbcb4" stroke="#333" stroke-width="1"/>
                            <rect x="115" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333" stroke-width="1"/>
                            
                            <!-- Pulgar -->
                            <ellipse cx="75" cy="110" rx="6" ry="15" fill="#fdbcb4" stroke="#333" stroke-width="1" transform="rotate(-30 75 110)"/>
                            
                            <!-- Movimiento de saludo -->
                            <animateTransform attributeName="transform" type="rotate" 
                                values="0 100 100;15 100 100;-15 100 100;0 100 100" 
                                dur="2s" repeatCount="indefinite"/>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">HOLA</text>
                    </svg>
                `,
                instructions: [
                    'Levante la mano derecha',
                    'Mantenga todos los dedos extendidos',
                    'Mueva la mano de lado a lado suavemente'
                ]
            },
            
            'ayuda': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="hands-animation">
                            <!-- Mano izquierda -->
                            <g transform="translate(60, 100)">
                                <ellipse cx="0" cy="0" rx="20" ry="25" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-15" y="-25" width="6" height="25" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-7" y="-30" width="6" height="30" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="1" y="-28" width="6" height="28" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="9" y="-25" width="6" height="25" rx="3" fill="#fdbcb4" stroke="#333"/>
                            </g>
                            
                            <!-- Mano derecha -->
                            <g transform="translate(140, 100)">
                                <ellipse cx="0" cy="0" rx="20" ry="25" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-15" y="-25" width="6" height="25" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-7" y="-30" width="6" height="30" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="1" y="-28" width="6" height="28" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="9" y="-25" width="6" height="25" rx="3" fill="#fdbcb4" stroke="#333"/>
                            </g>
                            
                            <!-- Animación hacia adelante -->
                            <animateTransform attributeName="transform" type="translate" 
                                values="0 0;0 -10;0 0" 
                                dur="1.5s" repeatCount="indefinite"/>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">AYUDA</text>
                    </svg>
                `,
                instructions: [
                    'Extienda ambas manos hacia adelante',
                    'Palmas hacia arriba',
                    'Mueva suavemente hacia la persona'
                ]
            },
            
            'cancelar': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="hand-stop">
                            <!-- Palma -->
                            <ellipse cx="100" cy="120" rx="30" ry="40" fill="#fdbcb4" stroke="#333" stroke-width="3"/>
                            
                            <!-- Dedos extendidos -->
                            <rect x="80" y="80" width="10" height="40" rx="5" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            <rect x="92" y="70" width="10" height="50" rx="5" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            <rect x="104" y="75" width="10" height="45" rx="5" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            <rect x="116" y="80" width="10" height="40" rx="5" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Pulgar -->
                            <ellipse cx="70" cy="110" rx="8" ry="18" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Señal de STOP -->
                            <circle cx="100" cy="50" r="15" fill="#ff4444" opacity="0.8">
                                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/>
                            </circle>
                            <text x="100" y="55" text-anchor="middle" fill="white" font-weight="bold" font-size="12">STOP</text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">CANCELAR</text>
                    </svg>
                `,
                instructions: [
                    'Levante la mano derecha',
                    'Palma hacia adelante',
                    'Dedos extendidos y juntos',
                    'Como señal de "ALTO"'
                ]
            },
            
            'gracias': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="thanks-gesture">
                            <!-- Rostro de referencia -->
                            <circle cx="100" cy="60" r="25" fill="#fdbcb4" stroke="#333" stroke-width="2" opacity="0.3"/>
                            
                            <!-- Mano derecha tocando labios -->
                            <g transform="translate(100, 80)">
                                <ellipse cx="0" cy="0" rx="12" ry="18" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <!-- Dedos extendidos -->
                                <rect x="-8" y="-15" width="4" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-3" y="-18" width="4" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="4" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="7" y="-13" width="4" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                                
                                <!-- Animación: de labios hacia adelante -->
                                <animateTransform attributeName="transform" type="translate" 
                                    values="0 0;20 10;0 0" 
                                    dur="2.5s" repeatCount="indefinite"/>
                            </g>
                            
                            <!-- Flecha de movimiento -->
                            <path d="M 115 85 L 135 95 L 130 90 M 135 95 L 130 100" 
                                  stroke="#4CAF50" stroke-width="3" fill="none" opacity="0.7">
                                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite"/>
                            </path>
                            
                            <!-- Texto explicativo -->
                            <text x="100" y="140" text-anchor="middle" font-size="10" fill="#666">
                                Toque labios → Mueva hacia adelante
                            </text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">GRACIAS</text>
                    </svg>
                `,
                instructions: [
                    'Toque sus labios con la mano derecha',
                    'Dedos extendidos, palma hacia usted',
                    'Mueva la mano hacia adelante y ligeramente hacia abajo',
                    'Como si enviara un beso de agradecimiento'
                ]
            },
            
            'confirmar': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="thumbs-up">
                            <!-- Puño cerrado -->
                            <ellipse cx="100" cy="120" rx="25" ry="35" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Dedos cerrados -->
                            <rect x="85" y="110" width="8" height="20" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="95" y="105" width="8" height="25" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="105" y="108" width="8" height="22" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="115" y="112" width="8" height="18" rx="4" fill="#fdbcb4" stroke="#333"/>
                            
                            <!-- Pulgar hacia arriba -->
                            <ellipse cx="75" cy="95" rx="8" ry="20" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Efecto de aprobación -->
                            <circle cx="75" cy="75" r="20" fill="none" stroke="#4CAF50" stroke-width="3" opacity="0.7">
                                <animate attributeName="r" values="15;25;15" dur="1.5s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"/>
                            </circle>
                            
                            <text x="75" y="50" text-anchor="middle" fill="#4CAF50" font-weight="bold">✓</text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">CONFIRMAR</text>
                    </svg>
                `,
                instructions: [
                    'Cierre la mano en puño',
                    'Extienda solo el pulgar',
                    'Pulgar hacia arriba',
                    'Señal de aprobación'
                ]
            },
            
            'esperar': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="wait-gesture">
                            <!-- Mano levantada -->
                            <ellipse cx="100" cy="120" rx="25" ry="35" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                            
                            <!-- Dedos extendidos -->
                            <rect x="85" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="95" y="75" width="8" height="45" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="105" y="80" width="8" height="40" rx="4" fill="#fdbcb4" stroke="#333"/>
                            <rect x="115" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                            
                            <!-- Pulgar -->
                            <ellipse cx="75" cy="110" rx="6" ry="15" fill="#fdbcb4" stroke="#333"/>
                            
                            <!-- Reloj/tiempo -->
                            <circle cx="130" cy="80" r="15" fill="white" stroke="#333" stroke-width="2"/>
                            <line x1="130" y1="80" x2="130" y2="70" stroke="#333" stroke-width="2"/>
                            <line x1="130" y1="80" x2="135" y2="85" stroke="#333" stroke-width="1">
                                <animateTransform attributeName="transform" type="rotate" 
                                    values="0 130 80;360 130 80" dur="3s" repeatCount="indefinite"/>
                            </line>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">ESPERAR</text>
                    </svg>
                `,
                instructions: [
                    'Levante la mano',
                    'Palma hacia la persona',
                    'Dedos extendidos',
                    'Señal de "un momento"'
                ]
            },
            
            'por_favor': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="please-gesture">
                            <!-- Pecho de referencia -->
                            <ellipse cx="100" cy="130" rx="30" ry="15" fill="#e0e0e0" opacity="0.3"/>
                            
                            <!-- Mano derecha en el pecho -->
                            <g transform="translate(100, 110)">
                                <ellipse cx="0" cy="0" rx="15" ry="20" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <!-- Dedos extendidos -->
                                <rect x="-10" y="-15" width="5" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-4" y="-18" width="5" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="5" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="8" y="-13" width="5" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                                
                                <!-- Movimiento circular en el pecho -->
                                <animateTransform attributeName="transform" type="translate" 
                                    values="0 0;-3 -2;0 -4;3 -2;0 0" 
                                    dur="2s" repeatCount="indefinite"/>
                            </g>
                            
                            <!-- Círculo indicando movimiento -->
                            <circle cx="100" cy="110" r="20" fill="none" stroke="#2196F3" stroke-width="2" stroke-dasharray="5,5" opacity="0.6">
                                <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite"/>
                            </circle>
                            
                            <!-- Texto explicativo -->
                            <text x="100" y="150" text-anchor="middle" font-size="10" fill="#666">
                                Movimiento circular en el pecho
                            </text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">POR FAVOR</text>
                    </svg>
                `,
                instructions: [
                    'Coloque la mano derecha en el pecho',
                    'Palma hacia el cuerpo',
                    'Haga movimientos circulares suaves',
                    'Gesto de petición cortés'
                ]
            },
            
            'disculpe': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="excuse-gesture">
                            <!-- Rostro de referencia -->
                            <circle cx="100" cy="60" r="25" fill="#fdbcb4" stroke="#333" stroke-width="2" opacity="0.3"/>
                            
                            <!-- Mano derecha tocando frente -->
                            <g transform="translate(100, 70)">
                                <ellipse cx="0" cy="0" rx="12" ry="18" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <!-- Dedos extendidos -->
                                <rect x="-8" y="-15" width="4" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-3" y="-18" width="4" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="4" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="7" y="-13" width="4" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                                
                                <!-- Movimiento hacia adelante -->
                                <animateTransform attributeName="transform" type="translate" 
                                    values="0 0;15 5;0 0" 
                                    dur="2s" repeatCount="indefinite"/>
                            </g>
                            
                            <!-- Flecha de movimiento -->
                            <path d="M 115 75 L 135 85 L 130 80 M 135 85 L 130 90" 
                                  stroke="#FF9800" stroke-width="3" fill="none" opacity="0.7">
                                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
                            </path>
                            
                            <!-- Texto explicativo -->
                            <text x="100" y="140" text-anchor="middle" font-size="10" fill="#666">
                                Toque frente → Mueva hacia adelante
                            </text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">DISCULPE</text>
                    </svg>
                `,
                instructions: [
                    'Toque su frente con la mano derecha',
                    'Dedos extendidos hacia arriba',
                    'Mueva la mano hacia adelante',
                    'Gesto de disculpa o perdón'
                ]
            },
            
            'procesando': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="processing-gesture">
                            <!-- Mano derecha con movimiento circular -->
                            <g transform="translate(100, 100)">
                                <ellipse cx="0" cy="0" rx="15" ry="20" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-10" y="-15" width="5" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-4" y="-18" width="5" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="5" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="8" y="-13" width="5" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                                
                                <!-- Rotación continua -->
                                <animateTransform attributeName="transform" type="rotate" 
                                    values="0 0 0;360 0 0" 
                                    dur="2s" repeatCount="indefinite"/>
                            </g>
                            
                            <!-- Círculos de procesamiento -->
                            <circle cx="100" cy="100" r="30" fill="none" stroke="#2196F3" stroke-width="3" stroke-dasharray="10,5">
                                <animate attributeName="stroke-dashoffset" values="0;-15" dur="1s" repeatCount="indefinite"/>
                            </circle>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">PROCESANDO</text>
                    </svg>
                `,
                instructions: [
                    'Haga movimientos circulares con la mano',
                    'Como si estuviera mezclando algo',
                    'Indica que está trabajando en la solicitud'
                ]
            },
            
            'listo': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="ready-gesture">
                            <!-- Ambas manos hacia arriba -->
                            <g transform="translate(80, 110)">
                                <ellipse cx="0" cy="0" rx="12" ry="18" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-8" y="-15" width="4" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-3" y="-18" width="4" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="4" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="7" y="-13" width="4" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                            </g>
                            
                            <g transform="translate(120, 110)">
                                <ellipse cx="0" cy="0" rx="12" ry="18" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-8" y="-15" width="4" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-3" y="-18" width="4" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="4" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="7" y="-13" width="4" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                            </g>
                            
                            <!-- Marca de verificación -->
                            <path d="M 85 80 L 95 90 L 115 70" stroke="#4CAF50" stroke-width="4" fill="none">
                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
                            </path>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">LISTO</text>
                    </svg>
                `,
                instructions: [
                    'Levante ambas manos con palmas hacia arriba',
                    'Gesto de "todo está listo"',
                    'Indica que el proceso se completó exitosamente'
                ]
            },
            
            'problema': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="problem-gesture">
                            <!-- Mano con gesto de "alto" -->
                            <g transform="translate(100, 100)">
                                <ellipse cx="0" cy="0" rx="18" ry="25" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-12" y="-20" width="6" height="20" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-4" y="-25" width="6" height="25" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="4" y="-23" width="6" height="23" rx="3" fill="#fdbcb4" stroke="#333"/>
                                <rect x="12" y="-20" width="6" height="20" rx="3" fill="#fdbcb4" stroke="#333"/>
                            </g>
                            
                            <!-- Símbolo de advertencia -->
                            <circle cx="100" cy="60" r="15" fill="#FF5722" opacity="0.8">
                                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/>
                            </circle>
                            <text x="100" y="65" text-anchor="middle" fill="white" font-weight="bold" font-size="14">!</text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">PROBLEMA</text>
                    </svg>
                `,
                instructions: [
                    'Levante la mano en señal de "alto"',
                    'Palma hacia adelante',
                    'Indica que hay un problema o error'
                ]
            },
            
            'terminado': {
                svg: `
                    <svg viewBox="0 0 200 200" class="gesture-svg">
                        <g class="finished-gesture">
                            <!-- Gesto de "adiós" -->
                            <g transform="translate(100, 100)">
                                <ellipse cx="0" cy="0" rx="15" ry="20" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                                <rect x="-10" y="-15" width="5" height="15" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="-4" y="-18" width="5" height="18" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="2" y="-16" width="5" height="16" rx="2" fill="#fdbcb4" stroke="#333"/>
                                <rect x="8" y="-13" width="5" height="13" rx="2" fill="#fdbcb4" stroke="#333"/>
                                
                                <!-- Movimiento de despedida -->
                                <animateTransform attributeName="transform" type="rotate" 
                                    values="0 0 0;20 0 0;-20 0 0;0 0 0" 
                                    dur="2s" repeatCount="indefinite"/>
                            </g>
                            
                            <!-- Texto de despedida -->
                            <text x="100" y="140" text-anchor="middle" font-size="12" fill="#666">
                                Proceso Completado
                            </text>
                        </g>
                        <text x="100" y="180" text-anchor="middle" class="gesture-label">TERMINADO</text>
                    </svg>
                `,
                instructions: [
                    'Mueva la mano de lado a lado',
                    'Como gesto de despedida',
                    'Indica que todo está terminado'
                ]
            }
        };
    }
    
    getGestureSVG(gestureName, landmarks = null) {
        const gesture = this.gestures[gestureName.toLowerCase()];
        
        // Si hay landmarks reales, usarlos para generar SVG
        if (landmarks && landmarks.length === 21) {
            return this.generateSVGFromLandmarks(landmarks, gestureName);
        }
        
        // Si hay SVG predefinido, usarlo
        if (gesture) {
            return gesture.svg;
        }
        
        // Fallback a SVG por defecto
        return this.getDefaultSVG(gestureName);
    }
    
    getGestureInstructions(gestureName) {
        const gesture = this.gestures[gestureName.toLowerCase()];
        return gesture ? gesture.instructions : ['Gesto no disponible'];
    }
    

    
    getDefaultSVG(gestureName) {
        if (gestureName === 'gesto_no_reconocido') {
            return `
                <svg viewBox="0 0 200 200" class="gesture-svg">
                    <g class="unknown-gesture">
                        <ellipse cx="100" cy="120" rx="25" ry="35" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                        <rect x="85" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                        <rect x="95" y="75" width="8" height="45" rx="4" fill="#fdbcb4" stroke="#333"/>
                        <rect x="105" y="80" width="8" height="40" rx="4" fill="#fdbcb4" stroke="#333"/>
                        <rect x="115" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                        <ellipse cx="75" cy="110" rx="6" ry="15" fill="#fdbcb4" stroke="#333"/>
                        
                        <!-- Signo de interrogación -->
                        <circle cx="100" cy="60" r="20" fill="#FF9800" opacity="0.8">
                            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <text x="100" y="68" text-anchor="middle" fill="white" font-weight="bold" font-size="18">?</text>
                    </g>
                    <text x="100" y="180" text-anchor="middle" class="gesture-label">GESTO DETECTADO</text>
                </svg>
            `;
        }
        
        return `
            <svg viewBox="0 0 200 200" class="gesture-svg">
                <g class="default-hand">
                    <ellipse cx="100" cy="120" rx="25" ry="35" fill="#fdbcb4" stroke="#333" stroke-width="2"/>
                    <rect x="85" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                    <rect x="95" y="75" width="8" height="45" rx="4" fill="#fdbcb4" stroke="#333"/>
                    <rect x="105" y="80" width="8" height="40" rx="4" fill="#fdbcb4" stroke="#333"/>
                    <rect x="115" y="85" width="8" height="35" rx="4" fill="#fdbcb4" stroke="#333"/>
                    <ellipse cx="75" cy="110" rx="6" ry="15" fill="#fdbcb4" stroke="#333"/>
                </g>
                <text x="100" y="180" text-anchor="middle" class="gesture-label">${gestureName.toUpperCase()}</text>
            </svg>
        `;
    }
}

// Instancia global
window.gestureVisuals = new GestureVisuals();