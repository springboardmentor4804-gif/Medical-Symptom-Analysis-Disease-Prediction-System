# MedAssist Azure Deployment Plan

## Scope
Deploy the documented MedAssist stack with low operational overhead:

- `medassist-api`: FastAPI from `backend/app.main:app`, packaged with the model files under `backend/ml/models`.
- `medassist-web`: the active Vite/React frontend at `backend/frontend`.
- Azure Database for PostgreSQL Flexible Server for persistence.
- Azure Container Apps Environment, Container Registry, Log Analytics, and Application Insights.

The root `frontend/` directory is an alternate/legacy Vite app and is intentionally excluded because `start-dev.ps1` and the root README select `backend/frontend`.

## Files to create or update

- `backend/Dockerfile`: production FastAPI image; build context is `backend/` so `app/`, `db/`, and `ml/models/` are included.
- `backend/.dockerignore`: exclude local environments, caches, tests, and secrets.
- `backend/frontend/Dockerfile`: multi-stage Vite build served by Nginx; build context is `backend/frontend/`.
- `backend/frontend/nginx.conf`: SPA fallback and runtime static serving.
- `infra/main.bicep`: subscription-scope Azure resources and Container Apps deployment wiring.
- `infra/main.bicepparam.example`: non-secret parameter example.
- `scripts/deploy-azure.ps1`: Azure CLI deployment instructions/automation; reads secrets from environment or prompts through Azure CLI usage, never commits them.
- `AZURE_DEPLOYMENT.md`: prerequisites, environment variables, first deployment commands, and operational notes.

## Configuration contract

Backend container variables:

- Required secret: `DATABASE_URL` using the PostgreSQL SQLAlchemy URL format, for example `postgresql+psycopg://...?...sslmode=require`.
- Required secret: `JWT_SECRET_KEY`.
- Required secret: `FERNET_KEY`.
- Required non-secret: `CORS_ORIGINS`, set to the deployed web URL.
- Optional: `PORT`, default `8000`.

Frontend build variable:

- `VITE_API_BASE`, set to the public API URL without a trailing slash. The deployment script passes it at image build time.

Azure deployment inputs:

- Azure subscription ID, resource group, location, globally unique ACR name, PostgreSQL administrator username/password, and a public DNS label for each Container App.
- The PostgreSQL password, JWT secret, and Fernet key are supplied as Container App secrets or Azure Key Vault references and are not stored in this repository.

## Execution and validation

1. Run the backend Python import/compile check and frontend `npm run build`.
2. Build both images with their documented contexts. Use a registry or Docker daemon supplied by the user.
3. Validate Bicep with `az bicep build --file infra/main.bicep` when Azure CLI is available.
4. Deploy with `scripts/deploy-azure.ps1` after `az login` and `az account set` are completed by the user.
5. Verify `/health` on the API and open the web Container App URL.

## Known blockers

- Azure subscription, region, resource names, and credentials are not available in this workspace; provisioning and live smoke tests cannot be executed here.
- The existing application source contains hard-coded secrets in legacy `backend/main.py`; this deployment uses `backend/app/main.py`, but source cleanup is outside deployment scope.
- Model artifact size and TensorFlow native dependencies may make the API image large; the Dockerfile preserves the existing model files and does not retrain them.
