"""
Reconocedor ASL actualizado para usar el modelo entrenado con nuestro dataset.
"""

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
import os

class ASLAlphabetRecognizerV2:
    def __init__(self, model_path='models/asl_quick_model.h5', 
                 class_mapping_path='models/class_mapping_quick.json'):
        """
        Inicializa el reconocedor ASL v2.
        
        Args:
            model_path: Ruta al modelo entrenado
            class_mapping_path: Ruta al mapeo de clases
        """
        self.model_path = model_path
        self.class_mapping_path = class_mapping_path
        self.model = None
        self.class_names = []
        self.min_confidence = 0.6
        
        self.load_model_and_classes()
    
    def load_model_and_classes(self):
        """Carga el modelo y el mapeo de clases."""
        try:
            # Cargar modelo
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                print(f"Modelo cargado: {self.model_path}")
            else:
                print(f"Modelo no encontrado: {self.model_path}")
                return
            
            # Cargar mapeo de clases
            if os.path.exists(self.class_mapping_path):
                with open(self.class_mapping_path, 'r') as f:
                    class_mapping = json.load(f)
                
                # Convertir a lista ordenada por índice
                self.class_names = [class_mapping[str(i)] for i in range(len(class_mapping))]
                print(f"Clases cargadas: {self.class_names}")
            else:
                print(f"Mapeo de clases no encontrado: {self.class_mapping_path}")
                
        except Exception as e:
            print(f"Error cargando modelo: {e}")
    
    def preprocess_image(self, image):
        """
        Preprocesa la imagen para el modelo.
        
        Args:
            image: Imagen de entrada
            
        Returns:
            numpy array: Imagen preprocesada
        """
        # Redimensionar a 224x224 (tamaño del modelo)
        image_resized = cv2.resize(image, (224, 224))
        
        # Normalizar
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Expandir dimensiones
        image_batch = np.expand_dims(image_normalized, axis=0)
        
        return image_batch
    
    def predict(self, image, landmarks=None):
        """
        Predice la letra ASL.
        
        Args:
            image: Imagen de entrada
            landmarks: Landmarks de la mano (opcional, para compatibilidad)
            
        Returns:
            tuple: (letra, confianza)
        """
        if self.model is None or len(self.class_names) == 0:
            return None, 0.0
        
        try:
            # Preprocesar
            processed_image = self.preprocess_image(image)
            
            # Predecir
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Obtener mejor predicción
            predicted_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_idx])
            
            if predicted_idx < len(self.class_names):
                predicted_letter = self.class_names[predicted_idx]
                
                # Solo retornar si confianza es suficiente
                if confidence >= self.min_confidence:
                    return predicted_letter, confidence
                else:
                    return None, confidence
            else:
                return None, 0.0
                
        except Exception as e:
            print(f"Error en predicción: {e}")
            return None, 0.0
    
    def get_top_predictions(self, image, top_k=3):
        """
        Obtiene las mejores predicciones.
        
        Args:
            image: Imagen de entrada
            top_k: Número de predicciones
            
        Returns:
            list: Lista de (letra, confianza)
        """
        if self.model is None or len(self.class_names) == 0:
            return []
        
        try:
            processed_image = self.preprocess_image(image)
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Obtener top-k índices
            top_k = min(top_k, len(predictions[0]), len(self.class_names))
            top_indices = np.argsort(predictions[0])[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if idx < len(self.class_names):
                    letter = self.class_names[idx]
                    confidence = float(predictions[0][idx])
                    results.append((letter, confidence))
            
            return results
            
        except Exception as e:
            print(f"Error en predicciones múltiples: {e}")
            return []
    
    def get_available_letters(self):
        """Retorna las letras disponibles en el modelo."""
        return self.class_names.copy()
    
    def get_stability_info(self):
        """Información de estabilidad - compatibilidad con el código existente."""
        return {
            'stable': True,
            'message': 'Modelo entrenado - alta precisión'
        }
    
    def reset_history(self):
        """Reinicia historial - compatibilidad con el código existente."""
        pass
    
    def is_model_loaded(self):
        """Verifica si el modelo está cargado correctamente."""
        return self.model is not None and len(self.class_names) > 0