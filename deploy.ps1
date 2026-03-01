# Deploy Script for CDLS System

# Configuration Variables - PLEASE UPDATE THESE
$ResourceGroup = "device-loan-rg"     # 例如: CDLS-RG
$InventoryAppName = "device-loan-inventory-svc-fwf0chh5bscfg3h7"  # 实际函数应用名（来自提供的主机名）
$BookingAppName = "device-loan-booking-svc-hvd4dug3eye0g3hw"      # 实际函数应用名（来自提供的主机名）
$StorageAccountName = "webf5038411" # 已根据你的环境填入
$FrontendOrigin = "https://webf5038411.z1.web.core.windows.net/"

# 可选：如果已知函数主机名，直接填在这里可跳过 az functionapp show 查询
$InventoryHostOverride = "device-loan-inventory-svc-fwf0chh5bscfg3h7.norwayeast-01.azurewebsites.net"
$BookingHostOverride   = "device-loan-booking-svc-hvd4dug3eye0g3hw.norwayeast-01.azurewebsites.net"
$IndexDocument = "index.html"
$ErrorDocument = "index.html"

# 1. Deploy Inventory Service
Write-Host "Deploying Inventory Service..."
cd device-loan-inventory-svc
npm install
npm run build
func.cmd azure functionapp publish $InventoryAppName --javascript
cd ..

# 2. Deploy Booking Service
Write-Host "Deploying Booking Service..."
cd device-loan-booking-svc
npm install
npm run build
func.cmd azure functionapp publish $BookingAppName --javascript
cd ..

# 3. Configure Backend Settings
Write-Host "Configuring Backend Settings..."
try {
  if ($InventoryHostOverride -and $InventoryHostOverride.Length -gt 0) {
    $InventoryHost = $InventoryHostOverride
  } else {
    $InventoryHost = az functionapp show --name $InventoryAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
  }
  $InventoryUrl = "https://$InventoryHost"
} catch {
  Write-Host "WARN: Failed to query Inventory host via az; falling back to override variable"
  if (-not $InventoryUrl) {
    $InventoryUrl = "https://$InventoryHostOverride"
  }
}

# Set Inventory URL in Booking Service App Settings
try {
  az functionapp config appsettings set --name $BookingAppName --resource-group $ResourceGroup --settings "INVENTORY_SERVICE_URL=$InventoryUrl"
} catch {
  Write-Host "WARN: Failed to set app settings via az. Please ensure 'az login' has been done."
}

# Configure CORS for both functions to allow the frontend (we'll update this after getting frontend URL, but for now allow all or specific)
# For now, let's allow the specific frontend origin
try {
  az functionapp cors add --name $InventoryAppName --resource-group $ResourceGroup --allowed-origins $FrontendOrigin
  az functionapp cors add --name $BookingAppName --resource-group $ResourceGroup --allowed-origins $FrontendOrigin
} catch {
  Write-Host "WARN: Failed to configure CORS via az. Please ensure 'az login' has been done."
}

# 4. Build and Deploy Frontend
Write-Host "Building and Deploying Frontend..."
cd device-loan-web

# Create production .env file temporarily with real URLs
try {
  if ($BookingHostOverride -and $BookingHostOverride.Length -gt 0) {
    $BookingHost = $BookingHostOverride
  } else {
    $BookingHost = az functionapp show --name $BookingAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
  }
  $BookingUrl = "https://$BookingHost"
} catch {
  Write-Host "WARN: Failed to query Booking host via az; falling back to override variable"
  if (-not $BookingUrl) {
    $BookingUrl = "https://$BookingHostOverride"
  }
}

Set-Content .env.production "VITE_INVENTORY_API=$InventoryUrl/api`nVITE_BOOKING_API=$BookingUrl/api"

npm install
npm run build

# Upload to Azure Storage Static Website
# Enable static website hosting if not already
try {
  az storage blob service-properties update --account-name $StorageAccountName --static-website --404-document $ErrorDocument --index-document $IndexDocument
} catch {
  Write-Host "WARN: Failed to enable static website via az. Please ensure 'az login' has been done."
}

# Upload files
try {
  az storage blob upload-batch -s dist -d '$web' --account-name $StorageAccountName
} catch {
  Write-Host "WARN: Failed to upload static files via az. Please ensure 'az login' has been done."
}

# Get Frontend URL
try {
  $WebUrl = az storage account show -n $StorageAccountName -g $ResourceGroup --query "primaryEndpoints.web" --output tsv
} catch {
  Write-Host "WARN: Failed to query storage web endpoint via az."
}

Write-Host "Deployment Complete!"
Write-Host "Frontend URL: $WebUrl"
Write-Host "Inventory API: $InventoryUrl"
Write-Host "Booking API: $BookingUrl"

# Optional: Update CORS to only allow Frontend URL
# az functionapp cors remove --name $InventoryAppName --resource-group $ResourceGroup --allowed-origins "*"
# az functionapp cors add --name $InventoryAppName --resource-group $ResourceGroup --allowed-origins $WebUrl
# az functionapp cors remove --name $BookingAppName --resource-group $ResourceGroup --allowed-origins "*"
# az functionapp cors add --name $BookingAppName --resource-group $ResourceGroup --allowed-origins $WebUrl

cd ..
