# API de Reconocimiento de Gestos para Lenguaje de Señas

Esta API permite subir datos y entrenar modelos de reconocimiento de gestos para el Lenguaje de Señas, utilizando Machine Learning para procesar y clasificar las señas.

## Tecnologías Utilizadas

- **Framework**: Flask
- **Machine Learning**: TensorFlow y Mediapipe Model Maker
- **Visualización**: Matplotlib

## Endpoints Disponibles

### POST `/upload`

Este endpoint permite subir un conjunto de datos de lecciones para entrenar un modelo de reconocimiento de gestos.

#### Detalles de la petición

- **Headers**:
  - `Content-Type: multipart/form-data`
- **Cuerpo de la petición**:
  - Campo `lesson`: Un JSON que describe las lecciones, palabras y partes.
  - Archivos de imagen: Se deben enviar las imágenes referenciadas en el JSON con claves formateadas como `image_0`, `image_1`, etc.

#### Ejemplo de JSON

```json
{
  "lesson": [
    {
      "name": "Lección 1",
      "word": [
        {
          "name": "Hola",
          "parts": [
            {
              "images": ["image_0", "image_1"]
            }
          ]
        }
      ]
    }
  ]
}
```

#### Respuesta Exitosa

- **Código**: 200
- **Cuerpo**:

```json
{
  "message": "Files uploaded and processed successfully"
}
```

## Configuración

1. Instala las dependencias necesarias:

2. Asegúrate de que la carpeta `uploads` exista o será creada automáticamente.

3. Ejecuta la API:

   ```bash
   python main.py
   ```

4. Accede a la API en `http://localhost:3001`.

## Estructura del Proyecto

```text
/
|-- main.py               # Archivo principal de la API
|-- uploads/              # Carpeta para los datos subidos
|-- salida/               # Carpeta donde se exportan los modelos entrenados
```

## Contribuciones

¡Las contribuciones son bienvenidas! Sigue estos pasos para colaborar:

1. Haz un fork de este repositorio.
2. Crea una rama para tu funcionalidad:

   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

3. Realiza tus cambios y haz un commit:

   ```bash
   git commit -m "Agrega nueva funcionalidad"
   ```

4. Sube tus cambios:

   ```bash
   git push origin feature/nueva-funcionalidad
   ```

5. Abre un pull request.
