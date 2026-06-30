@echo off
setlocal
title AALM App
cd /d "%~dp0backend"

REM --- locate Python 3 ---
set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE ( where python >nul 2>nul && set "PYEXE=python" )
if not defined PYEXE (
  echo.
  echo  Python 3 was not found on this computer.
  echo  Install it from https://www.python.org/downloads/  ^(check "Add Python to PATH"^),
  echo  then double-click this file again.
  echo.
  pause
  exit /b 1
)

REM --- create a private virtual environment on first run ---
if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment ^(first run only^)...
  %PYEXE% -m venv .venv
)
set "VENV_PY=.venv\Scripts\python.exe"

echo Installing / updating dependencies...
"%VENV_PY%" -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 ( echo Dependency installation failed. & pause & exit /b 1 )

echo.
echo  Starting the AALM app...  a browser tab will open at http://localhost:8000/
echo  Keep THIS window open while you use the app; close it to stop the server.
echo.

REM open the browser a few seconds after the server starts (PowerShell handles quoting cleanly)
start "" /min powershell -NoProfile -Command "Start-Sleep 3; Start-Process 'http://localhost:8000/'"

"%VENV_PY%" -m uvicorn app:app --port 8000
pause
