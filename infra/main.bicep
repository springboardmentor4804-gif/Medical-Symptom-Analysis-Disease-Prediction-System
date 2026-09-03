targetScope = 'resourceGroup'

param location string = resourceGroup().location
param environmentName string = 'medassist-env'
param apiAppName string = 'medassist-api'
param webAppName string = 'medassist-web'
param registryName string
param apiImage string
param webImage string
param postgresServerName string
param postgresAdminUser string
@secure()
param postgresAdminPassword string
@secure()
param jwtSecretKey string
@secure()
param fernetKey string

var logWorkspaceName = '${environmentName}-logs'
var postgresDatabaseName = 'medassist'
var registryLoginServer = '${registryName}.azurecr.io'
var databaseUrl = 'postgresql://${postgresAdminUser}:${postgresAdminPassword}@${postgresServerName}.postgres.database.azure.com:5432/${postgresDatabaseName}?sslmode=require'

resource logs 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logWorkspaceName
  location: location
  properties: {
    retentionInDays: 30
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword
    version: '16'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgres
  name: postgresDatabaseName
}

resource allowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: apiAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      secrets: [
        { name: 'registry-password'; value: listCredentials(registry.id, '2023-11-01').passwords[0].value }
        { name: 'database-url'; value: databaseUrl }
        { name: 'jwt-secret-key'; value: jwtSecretKey }
        { name: 'fernet-key'; value: fernetKey }
      ]
      registries: [
        {
          server: registryLoginServer
          username: listCredentials(registry.id, '2023-11-01').username
          passwordSecretRef: 'registry-password'
        }
      ]
      ingress: {
        external: false
        targetPort: 8000
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${registryLoginServer}/${apiImage}'
          env: [
            { name: 'DATABASE_URL'; secretRef: 'database-url' }
            { name: 'JWT_SECRET_KEY'; secretRef: 'jwt-secret-key' }
            { name: 'FERNET_KEY'; secretRef: 'fernet-key' }
            { name: 'CORS_ORIGINS'; value: '*' }
          ]
          resources: {
            cpu: 1
            memory: '2Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

resource web 'Microsoft.App/containerApps@2024-03-01' = {
  name: webAppName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      secrets: [
        { name: 'registry-password'; value: listCredentials(registry.id, '2023-11-01').passwords[0].value }
      ]
      registries: [
        {
          server: registryLoginServer
          username: listCredentials(registry.id, '2023-11-01').username
          passwordSecretRef: 'registry-password'
        }
      ]
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'web'
          image: '${registryLoginServer}/${webImage}'
          resources: {
            cpu: 0.25
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

output webUrl string = 'https://${web.properties.configuration.ingress.fqdn}'
output apiInternalFqdn string = api.properties.configuration.ingress.fqdn