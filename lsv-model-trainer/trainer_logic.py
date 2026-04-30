import os
import json
import numpy as np
import tensorflow as tf
import tensorflowjs as tfjs
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import Callback
from tensorflow.keras.optimizers import Adam

FEATURES_COUNT = 258
EPOCHS = 80
LEARNING_RATE = 0.0001

class ProgressCallback(Callback):
    def __init__(self):
        super().__init__()
        self.last_reported = -1

    def on_epoch_end(self, epoch, logs=None):
        percent = int(((epoch + 1) / EPOCHS) * 100)
        accuracy = float(logs.get('categorical_accuracy', 0))
        
        # Reportar progreso cada 1% para mayor visibilidad en tiempo real
        if percent >= self.last_reported + 1 or percent == 100:
            if hasattr(self, 'on_progress_fn') and self.on_progress_fn:
                self.on_progress_fn(percent, accuracy)
            self.last_reported = percent
            
        # Verificar si se ha solicitado detener el entrenamiento
        if hasattr(self, 'stop_event') and self.stop_event and self.stop_event.is_set():
            raise Exception("Entrenamiento cancelado por el sistema")

def train_lstm_model(training_data, output_dir, on_progress_fn, stop_event=None):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Determinar SEQUENCE_LENGTH de forma dinámica
    all_lengths = [len(d['landmarks']) for d in training_data]
    if not all_lengths:
        raise ValueError("No se encontraron grabaciones válidas para entrenar.")
    
    max_len_in_data = max(all_lengths)
    # Seleccionamos un SEQUENCE_LENGTH óptimo: 
    # Mínimo 20 (para tener contexto), máximo 60 (para eficiencia).
    # Si el máximo en los datos es menor a 20, usamos el máximo pero al menos algo razonable.
    sequence_length = min(max(max_len_in_data, 20), 60)
    print(f"Configurando SEQUENCE_LENGTH dinámico: {sequence_length} (Max en datos: {max_len_in_data})")
    
    sequences, labels = [], []
    actions = sorted(list(set([d['signName'] for d in training_data])))
    label_map = {label: num for num, label in enumerate(actions)}

    for item in training_data:
        action = item['signName']
        res = np.array(item['landmarks'])
        
        # Caso A: La grabación es más corta que la secuencia objetivo -> Padding
        if len(res) < sequence_length:
            padding_len = sequence_length - len(res)
            # Rellenamos repitiendo el último frame (mantiene la pose final)
            last_frame = res[-1]
            padding = np.tile(last_frame, (padding_len, 1))
            res_padded = np.vstack([res, padding])
            sequences.append(res_padded)
            labels.append(label_map[action])
            
        # Caso B: La grabación es igual o más larga -> Ventanas deslizantes
        else:
            for frame_num in range(0, len(res) - sequence_length + 1, 5):
                window = res[frame_num : frame_num + sequence_length]
                sequences.append(window)
                labels.append(label_map[action])

    if len(sequences) == 0:
        raise ValueError(f"No se pudieron generar secuencias de entrenamiento. Verifica que las grabaciones tengan landmarks válidos.")

    X = np.array(sequences)
    y = to_categorical(labels).astype(int)

    # Asegurarnos de tener suficientes muestras para el split
    test_size = 0.2 if len(X) > 10 else 0.1
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size)

    model = Sequential([
        Input(shape=(sequence_length, FEATURES_COUNT)),
        LSTM(64, return_sequences=True, activation='tanh'),
        Dropout(0.2),
        LSTM(128, return_sequences=True, activation='tanh'),
        Dropout(0.2),
        LSTM(64, return_sequences=False, activation='tanh'),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(len(actions), activation='softmax')
    ])

    optimizer = Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    prog_cb = ProgressCallback()
    prog_cb.on_progress_fn = on_progress_fn
    prog_cb.stop_event = stop_event

    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[prog_cb],
        verbose=1
    )

    # EXPORTAR 
    tfjs.converters.save_keras_model(model, output_dir)
    
    # POST-PROCESAMIENTO (Limpieza del JSON para el Frontend) 
    model_json_path = os.path.join(output_dir, 'model.json')
    if os.path.exists(model_json_path):
        with open(model_json_path, 'r', encoding='utf-8') as f:
            model_data = json.load(f)
            
        import re
        
        # 1. Limpiar prefijos de pesos (Bug Keras 3)
        if 'weightsManifest' in model_data:
            for manifest in model_data['weightsManifest']:
                if 'weights' in manifest:
                    for weight in manifest['weights']:
                        if 'name' in weight:
                            weight['name'] = re.sub(r'^sequential(?:_\d+)?/', '', weight['name'])
                            
        # 2. Fix dtype y batch_input_shape recursivamente
        def patch_layers(obj):
            if not isinstance(obj, dict):
                return
            if 'layers' in obj and isinstance(obj['layers'], list):
                for i, layer in enumerate(obj['layers']):
                    if 'config' not in layer:
                        continue
                    
                    # Keras 3 exporta dtype como objeto a veces
                    if 'dtype' in layer['config'] and isinstance(layer['config']['dtype'], dict):
                        layer['config']['dtype'] = 'float32'
                        
                    # Fix batch_input_shape para InputLayer o la primera capa
                    if i == 0 or layer.get('class_name') == 'InputLayer':
                        shape = layer['config'].get('batch_input_shape') or \
                                layer['config'].get('batchInputShape') or \
                                layer['config'].get('batch_shape') or \
                                layer['config'].get('shape') or \
                                [None, sequence_length, FEATURES_COUNT]
                        layer['config']['batch_input_shape'] = shape
                        layer['config']['batchInputShape'] = shape
                        
            for key, value in obj.items():
                if isinstance(value, dict):
                    patch_layers(value)
                elif isinstance(value, list):
                    for item in value:
                        patch_layers(item)
                        
        patch_layers(model_data)
        
        with open(model_json_path, 'w', encoding='utf-8') as f:
            json.dump(model_data, f)
            
    # Obtener métricas finales
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)

    # Identificar el archivo bin generado por tensorflowjs
    bin_files = [f for f in os.listdir(output_dir) if f.endswith('.bin')]

    return {
        "accuracy": float(accuracy),
        "labels": actions,
        "logs": history.history,
        "modelJsonUrl": f"{output_dir}/model.json",
        "binUrls": bin_files,
        "sequenceLength": sequence_length
    }
