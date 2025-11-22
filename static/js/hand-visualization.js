/**
 * Funciones para visualizar landmarks de manos y bounding boxes
 */

class HandVisualizer {
    constructor(canvas, video) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = video;
        
        // Colores para diferentes elementos
        this.colors = {
            landmarks: '#00FF00',      // Verde para landmarks
            connections: '#FF0000',    // Rojo para conexiones
            boundingBox: '#0080FF',    // Azul para bounding box
            text: '#FFFFFF',           // Blanco para texto
            background: 'rgba(0, 0, 0, 0.7)' // Fondo semi-transparente para texto
        };
        
        // Conexiones entre landmarks de la mano (MediaPipe hand model)
        this.handConnections = [
            [0, 1], [1, 2], [2, 3], [3, 4],        // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8],        // Índice
            [0, 9], [9, 10], [10, 11], [11, 12],   // Medio
            [0, 13], [13, 14], [14, 15], [15, 16], // Anular
            [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
            [5, 9], [9, 13], [13, 17]              // Conexiones de la palma
        ];
    }
    
    /**
     * Limpiar el canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Dibujar landmarks de la mano
     */
    drawLandmarks(landmarks) {
        if (!landmarks || landmarks.length === 0) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Dibujar conexiones primero (líneas)
        this.ctx.strokeStyle = this.colors.connections;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        for (const connection of this.handConnections) {
            const [startIdx, endIdx] = connection;
            if (startIdx < landmarks.length && endIdx < landmarks.length) {
                const startPoint = landmarks[startIdx];
                const endPoint = landmarks[endIdx];
                
                const startX = startPoint[0] * canvasWidth;
                const startY = startPoint[1] * canvasHeight;
                const endX = endPoint[0] * canvasWidth;
                const endY = endPoint[1] * canvasHeight;
                
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
            }
        }
        this.ctx.stroke();
        
        // Dibujar landmarks (puntos)
        this.ctx.fillStyle = this.colors.landmarks;
        for (let i = 0; i < landmarks.length; i++) {
            const landmark = landmarks[i];
            const x = landmark[0] * canvasWidth;
            const y = landmark[1] * canvasHeight;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Dibujar número del landmark (opcional, solo para puntos clave)
            if (i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = '12px Arial';
                this.ctx.fillText(i.toString(), x + 6, y - 6);
                this.ctx.fillStyle = this.colors.landmarks;
            }
        }
    }
    
    /**
     * Dibujar bounding box alrededor de la mano
     */
    drawBoundingBox(boundingBox) {
        if (!boundingBox) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Convertir coordenadas del bounding box a coordenadas del canvas
        const x = (boundingBox.min_x / this.video.videoWidth) * canvasWidth;
        const y = (boundingBox.min_y / this.video.videoHeight) * canvasHeight;
        const width = (boundingBox.width / this.video.videoWidth) * canvasWidth;
        const height = (boundingBox.height / this.video.videoHeight) * canvasHeight;
        
        // Dibujar rectángulo del bounding box
        this.ctx.strokeStyle = this.colors.boundingBox;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
        
        // Dibujar esquinas del bounding box
        const cornerSize = 15;
        this.ctx.lineWidth = 4;
        
        // Esquina superior izquierda
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + cornerSize);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x + cornerSize, y);
        this.ctx.stroke();
        
        // Esquina superior derecha
        this.ctx.beginPath();
        this.ctx.moveTo(x + width - cornerSize, y);
        this.ctx.lineTo(x + width, y);
        this.ctx.lineTo(x + width, y + cornerSize);
        this.ctx.stroke();
        
        // Esquina inferior izquierda
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height - cornerSize);
        this.ctx.lineTo(x, y + height);
        this.ctx.lineTo(x + cornerSize, y + height);
        this.ctx.stroke();
        
        // Esquina inferior derecha
        this.ctx.beginPath();
        this.ctx.moveTo(x + width - cornerSize, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x + width, y + height - cornerSize);
        this.ctx.stroke();
    }
    
    /**
     * Dibujar información de la detección
     */
    drawDetectionInfo(detectionData) {
        if (!detectionData) return;
        
        const padding = 10;
        const lineHeight = 25;
        let y = padding + lineHeight;
        
        // Configurar estilo del texto
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // Información principal
        if (detectionData.success && detectionData.letter) {
            // Letra detectada
            this.drawTextWithBackground(
                `🎯 LETRA: ${detectionData.letter}`,
                padding, y, this.colors.landmarks
            );
            y += lineHeight;
            
            // Confianza
            const confidencePercent = (detectionData.confidence * 100).toFixed(1);
            const confidenceColor = detectionData.confidence > 0.7 ? this.colors.landmarks : 
                                  detectionData.confidence > 0.4 ? '#FFAA00' : '#FF4444';
            this.drawTextWithBackground(
                `📊 CONFIANZA: ${confidencePercent}%`,
                padding, y, confidenceColor
            );
            y += lineHeight;
            
        } else if (detectionData.hands_detected) {
            // Mano detectada pero sin letra
            this.drawTextWithBackground(
                '✋ MANO DETECTADA',
                padding, y, '#FFAA00'
            );
            y += lineHeight;
            
            if (detectionData.letter) {
                this.drawTextWithBackground(
                    `🤔 POSIBLE: ${detectionData.letter}`,
                    padding, y, '#FFAA00'
                );
                y += lineHeight;
            }
        } else {
            // No hay manos
            this.drawTextWithBackground(
                '❌ NO HAY MANOS',
                padding, y, '#FF4444'
            );
            y += lineHeight;
        }
        
        // Top predictions (si están disponibles)
        if (detectionData.top_predictions && detectionData.top_predictions.length > 0) {
            y += 10; // Espacio extra
            this.ctx.font = '14px Arial';
            this.drawTextWithBackground(
                '📋 TOP PREDICCIONES:',
                padding, y, this.colors.text
            );
            y += lineHeight - 5;
            
            for (let i = 0; i < Math.min(3, detectionData.top_predictions.length); i++) {
                const pred = detectionData.top_predictions[i];
                const predText = `${i + 1}. ${pred.letter}: ${(pred.confidence * 100).toFixed(1)}%`;
                this.drawTextWithBackground(
                    predText,
                    padding + 20, y, this.colors.text
                );
                y += lineHeight - 5;
            }
        }
    }
    
    /**
     * Dibujar texto con fondo semi-transparente
     */
    drawTextWithBackground(text, x, y, textColor) {
        const metrics = this.ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 20;
        
        // Dibujar fondo
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(x - 5, y - textHeight + 5, textWidth + 10, textHeight);
        
        // Dibujar texto
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Visualizar toda la información de detección
     */
    visualize(detectionData) {
        this.clear();
        
        if (!detectionData) return;
        
        // Dibujar landmarks si están disponibles
        if (detectionData.landmarks && detectionData.landmarks.length > 0) {
            // Si hay múltiples manos, dibujar la primera
            const landmarks = detectionData.landmarks[0];
            this.drawLandmarks(landmarks);
        }
        
        // Dibujar bounding box si está disponible
        if (detectionData.bounding_box) {
            this.drawBoundingBox(detectionData.bounding_box);
        }
        
        // Dibujar información de detección
        this.drawDetectionInfo(detectionData);
    }
}

// Exportar para uso global
window.HandVisualizer = HandVisualizer;