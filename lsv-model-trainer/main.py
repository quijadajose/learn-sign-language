import os
import json
import tensorflow as tf
assert tf.__version__.startswith('2')
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
from mediapipe_model_maker import gesture_recognizer
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Ruta para subir archivos
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Asegúrate de que la carpeta de subida exista
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_files():
    # Obtener el JSON de los datos de la lección
    lesson_data = json.loads(request.form['lesson'])
    
    # Inicializar el índice global de la imagen
    global_image_index = 0
    
    # Procesar cada lección
    for lesson in lesson_data:
        lesson_name = lesson['name']
        lesson_dir = os.path.join(app.config['UPLOAD_FOLDER'], lesson_name)
        
        # Crear el directorio de la lección si no existe
        os.makedirs(lesson_dir, exist_ok=True)
        
        for word in lesson['word']:
            word_name = word['name']
            num_parts = len(word['parts'])
            for part_index, part in enumerate(word['parts']):
                # Determinar el nombre del directorio de la parte
                if num_parts > 1:
                    part_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"{word_name}-part-{part_index}")
                else:
                    part_dir = os.path.join(app.config['UPLOAD_FOLDER'], word_name)
                # Crear el directorio de la parte si no existe
                os.makedirs(part_dir, exist_ok=True)
                
                for image_filename in part['images']:
                    # Los archivos se reciben en el request.files
                    file_key = f"image_{global_image_index}"
                    print(f"Looking for file with key: {file_key}")
                    if file_key in request.files:
                        file = request.files[file_key]
                        if file.filename == '':
                            print(f"Filename for key {file_key} is empty")
                            continue
                        safe_filename = secure_filename(file.filename)
                        file_path = os.path.join(part_dir, safe_filename)
                        print(f"Saving file: {file.filename} to {part_dir}")
                        file.save(file_path)
                    else:
                        print(f"File {file_key} not found in request")
                    
                    # Incrementar el índice global de la imagen
                    global_image_index += 1
    train_gesture_model('uploads','salida')
    return jsonify({"message": "Files uploaded and processed successfully"}), 200

def train_gesture_model(input_path, output_path):
    # Visualizar ejemplos del conjunto de datos
    NUM_EXAMPLES = 5
    labels = os.listdir(input_path)

    for label in labels:
        label_dir = os.path.join(input_path, label)
        example_filenames = os.listdir(label_dir)[:NUM_EXAMPLES]
        fig, axs = plt.subplots(1, NUM_EXAMPLES, figsize=(10, 2))
        for i in range(NUM_EXAMPLES):
            axs[i].imshow(plt.imread(os.path.join(label_dir, example_filenames[i])))
            axs[i].get_xaxis().set_visible(False)
            axs[i].get_yaxis().set_visible(False)
        fig.suptitle(f'Showing {NUM_EXAMPLES} examples for {label}')
        plt.show()

    # Cargar y procesar el conjunto de datos
    data = gesture_recognizer.Dataset.from_folder(
        dirname=input_path,
        hparams=gesture_recognizer.HandDataPreprocessingParams()
    )

    train_data, rest_data = data.split(0.8)
    validation_data, test_data = rest_data.split(0.5)

    # Configurar las opciones del modelo y entrenar el reconocedor de gestos
    hparams = gesture_recognizer.HParams(export_dir=output_path)
    options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)
    model = gesture_recognizer.GestureRecognizer.create(
        train_data=train_data,
        validation_data=validation_data,
        options=options
    )

    # Evaluar el rendimiento del modelo
    loss, acc = model.evaluate(test_data, batch_size=1)
    print(f"Test loss:{loss}, Test accuracy:{acc}")

    # Exportar a un modelo TensorFlow Lite
    model.export_model()
    os.system(f'ls {output_path}')
if __name__ == '__main__':
    app.run(debug=False, host='localhost', port=3001)