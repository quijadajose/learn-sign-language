# Pendientes antes de publicar

- [ ] Rotar `GOOGLE_CLIENT_SECRET` y la contraseña de aplicación de Gmail. Actualizar los secretos del despliegue y revocar los anteriores.
- [ ] Configurar `FRONTEND_URL` con el origen público completo del frontend, incluido `https://`.
- [ ] Incluir el volumen `lsv_uploads` en el respaldo junto con la base de datos para poder restaurar las imágenes y sus referencias.
- [ ] Si la protección de la rama exige el check `Backend e2e smoke`, sustituirlo por `Backend e2e (all suites)`.
- [ ] Ajustar el hook de pre-commit para que use `lsv-model-trainer/.venv/bin/python` cuando exista.
- [ ] Hacer el primer push y comprobar en GitHub Actions que CI y deploy terminan correctamente.
