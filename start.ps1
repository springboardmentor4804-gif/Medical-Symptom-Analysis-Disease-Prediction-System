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

# ---- stop anything already running ---------------------------------------
# Every start must be a FRESH start. Without this, a backend left over from an
# earlier run keeps port 8000 and the newly spawned uvicorn dies on bind - so
# the app carries on serving whatever code was loaded first, and a `git pull`
# appears to have no effect. The old process answers /health with 200, so the
# readiness check below cannot tell the difference. Kill first, then start.
function Stop-MedAssistProcesses {
    $targets = New-Object System.Collections.Generic.HashSet[int]

    # Whatever currently holds our two ports, plus its process tree.
    foreach ($port in 8000, 5173) {
        try {
            Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop |
                ForEach-Object { [void]$targets.Add($_.OwningProcess) }
        } catch { }   # nothing listening on this port
    }

    # uvicorn --reload and `npm run dev` each spawn children that can outlive
    # the listener, so match this project's processes by command line too.
    $rootEscaped = [regex]::Escape($root)
    try {
        Get-CimInstance Win32_Process -ErrorAction Stop |
            Where-Object {
                $_.CommandLine -and
                $_.CommandLine -match $rootEscaped -and
                $_.CommandLine -match 'uvicorn|vite|npm-cli|multiprocessing-fork'
            } | ForEach-Object { [void]$targets.Add([int]$_.ProcessId) }
    } catch { }

    # Never kill this script's own shell or its ancestors.
    $self = @($PID)
    $walk = $PID
    for ($i = 0; $i -lt 8 -and $walk; $i++) {
        $walk = (Get-CimInstance Win32_Process -Filter "ProcessId=$walk" -ErrorAction SilentlyContinue).ParentProcessId
        if ($walk) { $self += [int]$walk }
    }

    $killed = 0
    foreach ($procId in $targets) {
        if ($self -contains $procId) { continue }
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            $killed++
        } catch { }   # already gone, or not ours to kill
    }

    if ($killed -gt 0) {
        Write-Host "Stopped $killed leftover MedAssist process(es)." -ForegroundColor DarkGray
        # Give Windows a moment to release the listening sockets.
        Start-Sleep -Seconds 2
    }
}

Write-Host "Clearing any previous MedAssist run..." -ForegroundColor DarkGray
Stop-MedAssistProcesses

foreach ($port in 8000, 5173) {
    $held = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($held) {
        Fail ("Port $port is still held by PID $($held.OwningProcess) and could not be freed. " +
              "Close that process manually, then run this script again.")
    }
}

# ---- preflight ------------------------------------------------------------
if (-not (Test-Path $venvPython)) {
    Fail "No virtual environment found at .venv. Run install.bat first."
}
if (-not (Test-Path (Join-Path $backendDir ".env"))) {
    Fail "backend\.env is missing. Run install.bat, or copy backend\.env.example to backend\.env and set SECRET_KEY."
}
if (-not (Test-Path (Join-Path $root "backend\artifacts\model1_classifier.joblib"))) {
    Fail "backend\artifacts is missing or incomplete. Re-export the 21 trained artifacts from the training notebook into backend\artifacts\."
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
