# Azure Deployment

This setup deploys the documented application pair: `backend/app.main:app` as a private FastAPI Container App and `backend/frontend` as a public Vite/Nginx Container App. Nginx proxies `/api/*` to the private API over the Container Apps environment, so the browser uses one origin. The API image includes `backend/ml/models`.

## Azure resources

The Bicep template creates an Azure Container Apps environment, two Container Apps, a Basic Azure Container Registry, Log Analytics-backed Container Apps logging, and an Azure Database for PostgreSQL Flexible Server with one `medassist` database. The PostgreSQL firewall rule permits Azure services; tighten networking before handling real clinical data.

## Prerequisites

Install Azure CLI and Docker only if building locally. Sign in and choose a subscription:

```powershell
az login
az account set --subscription '<subscription-id>'
```

The deploy script requires: subscription ID, resource group, Azure region, globally unique ACR name, globally unique PostgreSQL server name, PostgreSQL administrator username/password, `JWT_SECRET_KEY`, and `FERNET_KEY`. The last five values are passed to Bicep as secure parameters and are not written to files. Use a generated Fernet key compatible with the application.

## Deploy

From the repository root, run:

```powershell
.\scripts\deploy-azure.ps1 `
  -SubscriptionId '<subscription-id>' `
  -ResourceGroup 'rg-medassist' `
  -Location 'eastus' `
  -RegistryName '<globally-unique-acr-name>' `
  -PostgresServerName '<globally-unique-postgres-name>' `
  -PostgresAdminUser 'medassistadmin' `
  -PostgresAdminPassword '<strong-password>' `
  -JwtSecretKey '<random-secret>' `
  -FernetKey '<fernet-key>'
```

The script remotely builds both images with ACR, then provisions the infrastructure and deploys them. It uses the ACR admin credential only as an ARM deployment secret. For production, replace this with managed identity and Key Vault references.

## Validate

```powershell
az bicep build --file .\infra\main.bicep
az containerapp show --name medassist-web --resource-group rg-medassist --query properties.configuration.ingress.fqdn -o tsv
az containerapp logs show --name medassist-api --resource-group rg-medassist --follow
```

Open the returned HTTPS web URL. The API is intentionally private and is reached through the web proxy. Azure subscription permissions, quota, DNS availability, and image build size must be checked in the target subscription.

## Important application note

The deployed entry point is `backend/app/main.py`. The separate root `frontend/` app and legacy `backend/main.py` are not part of this deployment. The existing source contains legacy hard-coded secrets in `backend/main.py`; they are not used by this container, but should be removed before broader production use.