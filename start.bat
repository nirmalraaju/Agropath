@echo off
title AgroPath - Full Stack Launcher
color 0A

echo ============================================================
echo           AgroPath Precision Agriculture System
echo ============================================================
echo.

:: 1. Check MongoDB Service
echo [*] Checking local MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [!] Starting local MongoDB service...
    net start MongoDB
) else (
    echo [OK] Local MongoDB service is running.
)
echo.

:: 2. Launch FastAPI Backend
echo [*] Starting FastAPI Backend on http://localhost:8000...
start "AgroPath Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

:: 3. Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 4. Launch React Frontend
echo [*] Starting React Frontend on http://localhost:5173...
start "AgroPath Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 5. Open Browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================================
echo  AgroPath is now running!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - Swagger Docs: http://localhost:8000/docs
echo ============================================================
echo.
pause

