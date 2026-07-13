@echo off
title AALM App
echo(
echo  Starting the AALM app...
echo(

docker info >nul 2>nul
if errorlevel 1 (
  echo  Docker is not installed or not running.
  echo  Install Docker Desktop, start it, then run this file again:
  echo    https://www.docker.com/products/docker-desktop/
  echo(
  pause
  exit /b 1
)

echo  The first run downloads the app image ^(a few minutes^); later runs are quick.
echo  When the window shows "Uvicorn running", the app is ready.
echo  Keep THIS window open while you use the app; close it to stop.
echo(
start "" "http://localhost:8000/"
docker run --rm -p 8000:8000 --pull=always ghcr.io/ag-pureearth/aalm-app:latest
pause
