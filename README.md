# Plataforma para el Aprendizaje del Lenguaje de Señas Venezolano (LSV)

Este proyecto tiene como objetivo crear una plataforma educativa para aprender el Lenguaje de Señas Venezolano (LSV). El monorepo contiene tres subproyectos que trabajan juntos para lograr este objetivo.

## Estructura del Proyecto

- **`lsv-backend`**:
  - Backend desarrollado en [NestJS](https://nestjs.com/).
  - Maneja endpoints para la autenticación, registro, y gestión de lecciones.
  - Implementa arquitectura hexagonal.

- **`lsv-frontend`**:
  - Interfaz de usuario para interactuar con la plataforma.

- **`lsv-model-trainer`**:
  - API en Python para entrenar modelos de detección de señas.

## Tecnologías utilizadas

- **Backend**: NestJS, TypeORM, MySQL
- **Frontend**: Angular
- **Machine Learning**: Python, TensorFlow/PyTorch

## Instalación

Sigue estos pasos para configurar el proyecto localmente:

1. Clona este repositorio:

2. Configura cada subproyecto siguiendo las instrucciones en sus respectivos directorios:
   - `lsv-backend/README.md`
   - `lsv-frontend/README.md`
   - `lsv-model-trainer/README.md`

3. Asegúrate de tener instaladas las dependencias necesarias y sigue las instrucciones para levantar cada servicio.

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas colaborar, sigue estos pasos:

1. Haz un fork de este repositorio.
2. Crea una rama para tu contribución:

   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

3. Realiza tus cambios y haz un commit:

   ```bash
   git commit -m "Agrega una nueva funcionalidad"
   ```

4. Sube tus cambios a tu repositorio fork:

   ```bash
   git push origin feature/nueva-funcionalidad
   ```

5. Abre un pull request en este repositorio.

Recuerda asegurarte de que las pruebas unitarias pasen antes de enviar tu contribución.

## Roadmap

Puedes encontrar el roadmap y las tareas actuales en la sección de [Projects](https://github.com/quijadajose?tab=projects) de este repositorio.

## Agradecimientos

Agradecemos a todos los contribuyentes y colaboradores por su apoyo en este proyecto.
