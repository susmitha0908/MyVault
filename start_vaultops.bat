@echo off
title VaultOps Launcher
echo ===================================================
echo           STARTING VAULTOPS COMMAND CENTER         
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server on port 8000...
start /min "VaultOps Backend" cmd /c "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Server on port 3001...
start /min "VaultOps Frontend" cmd /c "cd /d "%~dp0frontend" && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo   VaultOps is running! Opening browser...
echo   Frontend URL: http://localhost:3001
echo ===================================================
start http://localhost:3001
exit
