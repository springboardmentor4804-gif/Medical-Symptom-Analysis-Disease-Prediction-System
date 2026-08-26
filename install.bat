@echo off
REM ===========================================================================
REM  MedAssist AI - one-shot installer (Windows)
REM
REM  Creates the Python virtual environment, installs backend and frontend
REM  dependencies, generates a SECRET_KEY, and verifies that the trained model
REM  artifacts actually load. Safe to re-run.
REM
REM  Usage:  double-click, or from a terminal:  install.bat
REM ===========================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo ==========================================================
echo   MedAssist AI - installer
echo ==========================================================
echo.

REM ---------------------------------------------------------------------------
REM 1. Python
REM ---------------------------------------------------------------------------
echo [1/6] Checking Python...
where python >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Python is not on your PATH.
    echo   Install Python 3.10-3.12 from https://www.python.org/downloads/
    echo   and tick "Add python.exe to PATH" during setup.
    goto :fail
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo   Found Python !PYVER!

REM The model artifacts are pickled under numpy 2.x, which needs Python 3.10+.
for /f "tokens=1,2 delims=." %%a in ("!PYVER!") do (
    set PYMAJOR=%%a
    set PYMINOR=%%b
)
if !PYMAJOR! LSS 3 goto :badpython
if !PYMAJOR! EQU 3 if !PYMINOR! LSS 10 goto :badpython

REM ---------------------------------------------------------------------------
REM 2. Virtual environment
REM ---------------------------------------------------------------------------
echo.
echo [2/6] Creating virtual environment (.venv)...
if exist ".venv\Scripts\python.exe" (
    echo   Already exists - reusing it.
) else (
    python -m venv .venv
    if errorlevel 1 (
        echo   ERROR: could not create the virtual environment.
        goto :fail
    )
    echo   Created.
)
set PY=.venv\Scripts\python.exe

REM ---------------------------------------------------------------------------
REM 3. Backend dependencies
REM ---------------------------------------------------------------------------
echo.
echo [3/6] Installing backend dependencies (this takes a few minutes)...
"%PY%" -m pip install --upgrade pip --trusted-host pypi.org --trusted-host files.pythonhosted.org --quiet
"%PY%" -m pip install -r backend\requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org --quiet
if errorlevel 1 (
    echo   ERROR: dependency installation failed. Scroll up for the reason.
    goto :fail
)
echo   Backend dependencies installed.

REM ---------------------------------------------------------------------------
REM 4. Environment file
REM ---------------------------------------------------------------------------
echo.
echo [4/6] Configuring environment...
REM Delegated to a Python script: generating the key and writing a multi-line
REM file inline in batch needs nested quoting that cmd mangles, and the failure
REM is silent - it writes an empty SECRET_KEY.
"%PY%" backend\bootstrap_env.py
if errorlevel 1 (
    echo   ERROR: could not write backend\.env
    goto :fail
)

REM ---------------------------------------------------------------------------
REM 5. Verify the trained model artifacts load
REM ---------------------------------------------------------------------------
echo.
echo [5/6] Verifying model artifacts...
if not exist "backend\artifacts\model1_classifier.joblib" (
    echo   ERROR: backend\artifacts is missing or incomplete.
    echo   Re-export the 21 trained artifacts from the training
    echo   notebook into backend\artifacts\.
    goto :fail
)
"%PY%" backend\verify_artifacts.py --smoke
if errorlevel 1 (
    echo   ERROR: the model artifacts failed to load.
    echo   The most common cause is a numpy version mismatch - the artifacts
    echo   are pickled under numpy 2.x and cannot be read by numpy 1.x.
    goto :fail
)

REM ---------------------------------------------------------------------------
REM 6. Frontend
REM ---------------------------------------------------------------------------
echo.
echo [6/6] Installing web frontend...
where npm >nul 2>&1
if errorlevel 1 (
    echo   WARNING: npm not found, skipping the web frontend.
    echo   Install Node.js 18+ from https://nodejs.org/ then run:
    echo       cd web ^&^& npm install
    set SKIPPED_WEB=1
) else (
    pushd web
    call npm install --no-audit --no-fund
    set NPM_RC=!errorlevel!
    popd
    if !NPM_RC! NEQ 0 (
        echo   ERROR: npm install failed.
        goto :fail
    )
    echo   Web dependencies installed.
)

echo.
echo ==========================================================
echo   Installation complete.
echo ==========================================================
echo.
echo   Start everything:      start.bat
echo   Backend only:          .venv\Scripts\python -m uvicorn main:app --reload --app-dir backend
echo   Web only:              cd web ^&^& npm run dev
echo   Run the tests:         .venv\Scripts\python -m pytest backend\tests -q
echo.
echo   Web UI:                http://localhost:5173
echo   API docs:              http://127.0.0.1:8000/docs
echo.
if defined SKIPPED_WEB echo   REMINDER: install Node.js, then run "cd web && npm install".
echo.
pause
exit /b 0

:badpython
echo   ERROR: Python !PYVER! is too old. This project needs Python 3.10 or newer
echo   (the model artifacts require numpy 2.x).
goto :fail

:fail
echo.
echo ==========================================================
echo   Installation FAILED - see the error above.
echo ==========================================================
echo.
pause
exit /b 1
