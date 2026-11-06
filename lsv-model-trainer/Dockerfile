FROM python:3.11-slim@sha256:65bd3d9f1d7fa268dd1909973ba7eb4bdf41f6dcf2cfbe76ba9528b170f3fd79

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin trainer

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --chown en el COPY: un `chown -R` posterior duplicaría todo /app en otra capa.
COPY --chown=trainer:trainer . .
RUN chmod +x /app/docker-entrypoint.sh \
    && chown trainer:trainer /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DATA_BASE_DIR=/shared
ENV TRAINER_UID=10001
ENV TRAINER_HEALTH_PORT=8089

# Entrypoint starts as root to fix /shared perms, then drops to trainer.
ENTRYPOINT ["/app/docker-entrypoint.sh"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('TRAINER_HEALTH_PORT', '8089') + '/healthz', timeout=2)"

CMD ["python", "-u", "main.py"]
