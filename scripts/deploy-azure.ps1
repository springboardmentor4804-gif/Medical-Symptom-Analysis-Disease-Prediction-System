param(
    [Parameter(Mandatory = $true)] [string] $SubscriptionId,
    [Parameter(Mandatory = $true)] [string] $ResourceGroup,
    [Parameter(Mandatory = $true)] [string] $Location,
    [Parameter(Mandatory = $true)] [string] $RegistryName,
    [Parameter(Mandatory = $true)] [string] $PostgresServerName,
    [Parameter(Mandatory = $true)] [string] $PostgresAdminUser,
    [Parameter(Mandatory = $true)] [string] $PostgresAdminPassword,
    [Parameter(Mandatory = $true)] [string] $JwtSecretKey,
    [Parameter(Mandatory = $true)] [string] $FernetKey
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$acrLoginServer = "$RegistryName.azurecr.io"
$apiImage = 'medassist-api:latest'
$webImage = 'medassist-web:latest'

az account set --subscription $SubscriptionId
az group create --name $ResourceGroup --location $Location | Out-Null
az acr create --name $RegistryName --resource-group $ResourceGroup --location $Location --sku Basic --admin-enabled true | Out-Null
az acr build --registry $RegistryName --image $apiImage --file "$root/backend/Dockerfile" "$root/backend"
az acr build --registry $RegistryName --image $webImage --build-arg VITE_API_BASE=/api --file "$root/backend/frontend/Dockerfile" "$root/backend/frontend"

az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "$root/infra/main.bicep" `
    --parameters location=$Location registryName=$RegistryName apiImage=$apiImage webImage=$webImage postgresServerName=$PostgresServerName postgresAdminUser=$PostgresAdminUser postgresAdminPassword=$PostgresAdminPassword jwtSecretKey=$JwtSecretKey fernetKey=$FernetKey