@echo off
echo === myPilot - Demarrage ===

:: Tuer les anciens processus sur les ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8002 "') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4174 "') do taskkill /PID %%a /F 2>nul

echo [1/3] Migration base de donnees...
cd /d "%~dp0backend"
venv\Scripts\python -m alembic upgrade head

echo [2/4] Demarrage du backend FastAPI...
start "myPilot Backend" cmd /c "venv\Scripts\uvicorn app.main:app --port 8002 2>&1"

:: Attendre que le backend soit pret
timeout /t 3 /nobreak > nul

echo [3/4] Construction du frontend...
cd /d "%~dp0frontend"
call npm run build

echo [4/4] Demarrage du serveur frontend...
start "myPilot Frontend" cmd /c "npm run preview -- --port 4174 2>&1"

timeout /t 2 /nobreak > nul

echo.
echo === myPilot demarre ! ===
echo Frontend : http://localhost:4174
echo Backend  : http://localhost:8002
echo API Docs : http://localhost:8002/docs
echo.
echo Appuyez sur une touche pour ouvrir dans le navigateur...
pause > nul
start http://localhost:4174
