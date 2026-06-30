# Dockerfile — container image for deploying the AALM front-end to the web.
#
# IMPORTANT: the AALM model is a compiled binary. This Linux image runs the Python
# API and serves the frontend, but you must supply a model binary that runs on the
# container's OS:
#   * a Linux build of the Fortran model (recompile code/AALM31_Fortran.f90), OR
#   * call out to a separate Windows host/service from model_runner.py.
# Point the API at the binary with the AALM_EXE environment variable.
#
# Build:  docker build -t aalm-app .
# Run:    docker run -p 8000:8000 -e AALM_EXE=/opt/aalm/aalm_linux aalm-app

FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/  /app/backend/
COPY frontend/ /app/frontend/
COPY shared/   /app/shared/

# Provide the model binary at build/deploy time and set AALM_EXE to its path, e.g.:
# COPY aalm_linux /opt/aalm/aalm_linux
# ENV AALM_EXE=/opt/aalm/aalm_linux

EXPOSE 8000
WORKDIR /app/backend
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
