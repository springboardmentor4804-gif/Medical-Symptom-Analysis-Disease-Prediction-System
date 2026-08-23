# Starts the MedAssist backend (FastAPI/uvicorn) and web frontend (Vite) in
# separate windows and waits for the backend to come up.
#
# Usage:  powershell -ExecutionPolicy Bypass -File start.ps1
# (or just double-click start.bat)
#
# Run install.bat first - this script deliberately uses the project's virtual
# environment rather than whatever `python` happens to be on PATH, because the
# model artifacts need the exact numpy/scikit-learn versions pinned in
# backend/requirements.txt.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendDir = Join-Path $root "backend"
$webDir     = Join-Path $root "web"
$venvPython = Join-Path $root ".venv\Scripts\python.exe"

function Fail($message) {
    Write-Host $message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

# ---- preflight ------------------------------------------------------------
if (-not (Test-Path $venvPython)) {
    Fail "No virtual environment found at .venv. Run install.bat first."
}
if (-not (Test-Path (Join-Path $backendDir ".env"))) {
    Fail "backend\.env is missing. Run install.bat, or copy backend\.env.example to backend\.env and set SECRET_KEY."
}
if (-not (Test-Path (Join-Path $root "model\artifacts\model1_classifier.joblib"))) {
    Fail "model\artifacts is missing or incomplete. Train with training\kaggle_train.py and copy its artifacts/ output into model\artifacts\."
}
$webInstalled = Test-Path (Join-Path $webDir "node_modules")
if (-not $webInstalled) {
    Write-Host "web\node_modules is missing - the frontend will not start." -ForegroundColor Yellow
    Write-Host "Run: cd web; npm install" -ForegroundColor Yellow
}

# ---- backend --------------------------------------------------------------
Write-Host "Starting backend (FastAPI) on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$backendDir'; & '$venvPython' -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
) | Out-Null

Write-Host "Waiting for the backend to become healthy..." -ForegroundColor DarkGray
$backendUp = $false
for ($i = 0; $i -lt 45; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -eq 200) { $backendUp = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendUp) {
    Write-Host "Backend is up." -ForegroundColor Green
    # Loading the models is lazy, so confirm they can actually be read rather
    # than waiting for the first assessment to fail.
    try {
        $status = Invoke-RestMethod -Uri "http://127.0.0.1:8000/system/model-status" -TimeoutSec 20
        if ($status.healthy) {
            Write-Host "Model artifacts loaded (version $($status.model_version))." -ForegroundColor Green
        }
    } catch {
        Write-Host "Could not confirm model status (the endpoint needs a login) - check the backend window if assessments fail." -ForegroundColor DarkGray
    }
} else {
    Write-Host "Backend did not respond within 45s - check the backend window for errors." -ForegroundColor Yellow
}

# ---- frontend -------------------------------------------------------------
if ($webInstalled) {
    Write-Host "Starting web frontend (Vite) on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$webDir'; npm run dev"
    ) | Out-Null
}

Write-Host ""
Write-Host "Backend:  http://127.0.0.1:8000  (API docs at /docs)" -ForegroundColor Green
if ($webInstalled) {
    Write-Host "Web UI:   http://127.0.0.1:5173" -ForegroundColor Green
}
Write-Host ""
Write-Host "Each service runs in its own window. Close them (or Ctrl+C inside) to stop." -ForegroundColor DarkGray
