"""
Reconocedor del alfabeto ASL usando modelo preentrenado.
"""

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

class ASLAlphabetRecognizer:
    def __init__(self, model_path='dataset/ResNet50V2-ASL.h5'):
        """
        Inicializa el reconocedor de alfabeto ASL.
        
        Args:
            model_path (str): Ruta al modelo preentrenado
        """
        self.model_path = model_path
        self.model = None
        
        # Usar las 26 letras completas del alfabeto
        self.class_names = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
        ]
        
        # Sistema ULTRA SIMPLE - solo confianza básica
        self.min_confidence_threshold = 0.5  # 50% mínimo (más permisivo)
        
        self.load_model()
    
    def load_model(self):
        """Carga el modelo preentrenado."""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                print(f"Modelo cargado desde: {self.model_path}")
            else:
                print(f"Error: No se encontró el modelo en {self.model_path}")
        except Exception as e:
            print(f"Error al cargar el modelo: {e}")
    
    def preprocess_image(self, image):
        """
        Preprocesa la imagen SIMPLE para el modelo.
        
        Args:
            image: Imagen de entrada (numpy array)
            
        Returns:
            numpy array: Imagen preprocesada
        """
        # Redimensionar a 256x256 (tamaño esperado por ResNet)
        image_resized = cv2.resize(image, (256, 256))
        
        # Normalizar valores de píxeles
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Expandir dimensiones para batch
        image_batch = np.expand_dims(image_normalized, axis=0)
        
        return image_batch
    

    
    def predict(self, image, landmarks=None):
        """
        Predice la letra ASL en la imagen - VERSIÓN SIMPLE.
        
        Args:
            image: Imagen de entrada
            landmarks: Landmarks de la mano (no usado en versión simple)
            
        Returns:
            tuple: (letra_predicha, confianza)
        """
        if self.model is None:
            return None, 0.0
        
        try:
            # Preprocesar imagen
            processed_image = self.preprocess_image(image)
            
            # Realizar predicción
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Obtener la clase con mayor probabilidad
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            predicted_letter = self.class_names[predicted_class]
            
            # Solo devolver si la confianza es suficiente
            if confidence >= self.min_confidence_threshold:
                return predicted_letter, confidence
            else:
                return None, confidence
            
        except Exception as e:
            print(f"Error en predicción: {e}")
            return None, 0.0
    

    
    def get_top_predictions(self, image, top_k=3):
        """
        Obtiene las top-k predicciones.
        
        Args:
            image: Imagen de entrada
            top_k (int): Número de predicciones a retornar
            
        Returns:
            list: Lista de tuplas (letra, confianza)
        """
        if self.model is None:
            return []
        
        try:
            processed_image = self.preprocess_image(image)
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Validar que tenemos predicciones
            if len(predictions) == 0 or len(predictions[0]) == 0:
                return []
            
            # Asegurar que top_k no sea mayor que el número de clases
            top_k = min(top_k, len(predictions[0]), len(self.class_names))
            
            # Obtener índices de las top-k predicciones
            top_indices = np.argsort(predictions[0])[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if idx < len(self.class_names):  # Validación adicional
                    letter = self.class_names[idx]
                    confidence = float(predictions[0][idx])
                    results.append((letter, confidence))
            
            return results
            
        except Exception as e:
            print(f"Error en predicciones múltiples: {e}")
            return []
    
    def get_stability_info(self):
        """Información simple de estabilidad."""
        return {
            'stable': True,
            'message': 'Sistema simplificado - sin estabilización'
        }
    
    def reset_history(self):
        """Reinicia el historial - versión simple."""
        pass