# Deploy Script for CDLS System

# Configuration Variables - PLEASE UPDATE THESE
$ResourceGroup = "device-loan-rg"     # 例如: CDLS-RG
$InventoryAppName = "device-loan-inventory-svc"  # 例如: device-loan-inventory-app-123
$BookingAppName = "device-loan-booking-svc"    # 例如: device-loan-booking-app-123
$StorageAccountName = "webf5038411" # 已根据你的截图填入
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
# Get Inventory URL
$InventoryHost = az functionapp show --name $InventoryAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
$InventoryUrl = "https://$InventoryHost"

# Set Inventory URL in Booking Service App Settings
az functionapp config appsettings set --name $BookingAppName --resource-group $ResourceGroup --settings "INVENTORY_SERVICE_URL=$InventoryUrl"

# Configure CORS for both functions to allow the frontend (we'll update this after getting frontend URL, but for now allow all or specific)
# For now, let's allow all to ensure it works, or user can restrict later.
az functionapp cors add --name $InventoryAppName --resource-group $ResourceGroup --allowed-origins "*"
az functionapp cors add --name $BookingAppName --resource-group $ResourceGroup --allowed-origins "*"

# 4. Build and Deploy Frontend
Write-Host "Building and Deploying Frontend..."
cd device-loan-web

# Create production .env file temporarily with real URLs
$BookingHost = az functionapp show --name $BookingAppName --resource-group $ResourceGroup --query "defaultHostName" --output tsv
$BookingUrl = "https://$BookingHost"

Set-Content .env.production "VITE_INVENTORY_API=$InventoryUrl/api`nVITE_BOOKING_API=$BookingUrl/api"

npm install
npm run build

# Upload to Azure Storage Static Website
# Enable static website hosting if not already
az storage blob service-properties update --account-name $StorageAccountName --static-website --404-document $ErrorDocument --index-document $IndexDocument

# Upload files
az storage blob upload-batch -s dist -d '$web' --account-name $StorageAccountName

# Get Frontend URL
$WebUrl = az storage account show -n $StorageAccountName -g $ResourceGroup --query "primaryEndpoints.web" --output tsv

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
