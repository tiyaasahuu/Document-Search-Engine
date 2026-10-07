@echo off
TITLE Document Search Engine Launcher
echo =========================================================================
echo               Document & Research Intelligence Engine
echo =========================================================================
echo.

echo Checking backend virtual environment...
IF NOT EXIST "backend\venv\Scripts\python.exe" (
    echo [WARNING] Backend Python virtual environment not found in backend\venv.
    echo Please set up the backend environment first:
    echo   cd backend
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo Checking frontend node_modules...
IF NOT EXIST "frontend\node_modules" (
    echo [INFO] Frontend dependencies not found. Installing node_modules...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting Backend API Server (http://127.0.0.1:8000)...
start "Document Engine - Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting Frontend Web App (http://localhost:3000)...
start "Document Engine - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================================
echo Services launched in separate process windows!
echo - Backend API Docs: http://127.0.0.1:8000/docs
echo - Frontend Web UI:  http://localhost:3000
echo =========================================================================
echo.
