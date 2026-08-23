# Additional Utility Scripts

This folder contains supplementary installation scripts for MedAssist AI.

> **Note:** The main scripts (`install.bat`, `start.bat`, `start.ps1`) are in the **root directory** for easy access. This folder contains the improved installation version.

## Available Scripts

### Installation Scripts

#### `install_fixed.bat` (Improved Version)
Enhanced installation script with better error handling and validation.

**What it does:**
- Creates Python virtual environment (`.venv`)
- Installs all backend dependencies from `requirements.txt`
- Verifies model artifacts exist
- Sets up environment configuration
- Better error messages and validation

**Usage:**
```cmd
scripts\install_fixed.bat
```

## Main Scripts (Root Directory)

The primary scripts are located in the **root directory** for convenience:

- **`install.bat`** - Main installation script (root)
- **`start.bat`** - Main startup script (root)
- **`start.ps1`** - PowerShell startup script (root)

## Quick Start Workflow

```cmd
# 1. First-time setup (use root script)
install.bat

# 2. Start the application (use root script)
start.bat

# Alternative: Use PowerShell
.\start.ps1

# Alternative: Use improved installation
scripts\install_fixed.bat
```

## Manual Commands

If you prefer to run commands manually:

### Backend
```cmd
cd backend
..\\.venv\\Scripts\\activate
python main.py
```

### Frontend
```cmd
cd web
npm install
npm run dev
```

### Streamlit (Optional)
```cmd
cd frontend
..\\.venv\\Scripts\\activate
streamlit run app.py
```

## Troubleshooting

### "venv not found"
Run `install_fixed.bat` first to create the virtual environment.

### "Module not found"
Reinstall dependencies:
```cmd
.venv\Scripts\activate
pip install -r backend\requirements.txt
```

### "Port already in use"
Kill existing processes:
```cmd
# Kill process on port 8000 (backend)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### "Model artifacts not found"
Ensure `backend/artifacts/` exists with all 21 trained artifacts. See main README.md for details.

## Notes

- These scripts are Windows-specific (.bat, .ps1)
- For macOS/Linux, use manual commands or adapt scripts to `.sh`
- All scripts should be run from the project root directory
