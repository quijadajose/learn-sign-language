# Plataforma para el Aprendizaje del Lenguaje de Señas Venezolano (LSV)

Este proyecto tiene como objetivo crear una plataforma educativa para aprender el Lenguaje de Señas Venezolano (LSV). El monorepo contiene tres subproyectos que trabajan juntos para lograr este objetivo.

[![Status](https://img.shields.io/badge/Estado-Monitor-brightgreen)](https://stats.uptimerobot.com/n46WRvlnZD)


## Estructura del Proyecto

- **`lsv-backend`**:
  - Backend desarrollado en [NestJS](https://nestjs.com/).
  - Maneja endpoints para la autenticación, registro, y gestión de lecciones.
  - Implementa arquitectura hexagonal.

- **`lsv-frontend`**:
  - Interfaz de usuario para interactuar con la plataforma.

- **`lsv-model-trainer`**:
  - API en Python para entrenar modelos de detección de señas.

- **Backend**: NestJS, TypeORM, MySQL
- **Frontend**: React (Vite), Tailwind CSS
- **Machine Learning**: Python, TensorFlow/PyTorch

## Despliegue con Docker

Este proyecto utiliza Docker Compose para gestionar los diferentes servicios (Backend, Frontend y Base de Datos).

### 🛠️ Desarrollo Local
Para levantar todo el stack en modo desarrollo (con hot-reload y debug ports):
```bash
docker compose up -d
```

### 🚀 Producción
Para levantar el stack optimizado para producción:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

> [!NOTE]
> El despliegue a producción está automatizado mediante **GitHub Actions**. Solo necesitas hacer `git push origin main`.

## Instalación Manual

Si prefieres no usar Docker para el desarrollo, sigue estos pasos:


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
