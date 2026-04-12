@echo off
echo === myPilot - Mode Dev ===

:: Tuer les anciens processus
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8002 "') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /PID %%a /F 2>nul

echo [1/3] Migration base de donnees...
cd /d "%~dp0backend"
venv\Scripts\python -m alembic upgrade head

echo [2/3] Demarrage du backend FastAPI (reload automatique)...
start "myPilot Backend" cmd /c "set PYTHONPATH=. && venv\Scripts\uvicorn app.main:app --port 8002 --reload 2>&1"

timeout /t 3 /nobreak > nul

echo [3/3] Demarrage du frontend Vite (HMR)...
cd /d "%~dp0frontend"
start "myPilot Frontend Dev" cmd /c "npm run dev -- --port 5173 2>&1"

timeout /t 2 /nobreak > nul

echo.
echo === myPilot dev demarre ! ===
echo Frontend : http://localhost:5173
echo Backend  : http://localhost:8002
echo API Docs : http://localhost:8002/docs
echo.
start http://localhost:5173
