#!/bin/bash

# Configuration Variables - PLEASE UPDATE THESE
RESOURCE_GROUP="你的资源组名称"
INVENTORY_APP_NAME="你的库存FunctionApp名称"
BOOKING_APP_NAME="你的预定FunctionApp名称"
STORAGE_ACCOUNT_NAME="webf5038411"
INDEX_DOCUMENT="index.html"
ERROR_DOCUMENT="index.html"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

if ! command_exists az; then
  echo "Azure CLI (az) is not installed."
  exit 1
fi

if ! command_exists func; then
  echo "Azure Functions Core Tools (func) is not installed."
  exit 1
fi

# 1. Deploy Inventory Service
echo "Deploying Inventory Service..."
cd device-loan-inventory-svc
npm install
npm run build
func azure functionapp publish $INVENTORY_APP_NAME --javascript
cd ..

# 2. Deploy Booking Service
echo "Deploying Booking Service..."
cd device-loan-booking-svc
npm install
npm run build
func azure functionapp publish $BOOKING_APP_NAME --javascript
cd ..

# 3. Configure Backend Settings
echo "Configuring Backend Settings..."
# Get Inventory URL
INVENTORY_HOST=$(az functionapp show --name $INVENTORY_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" --output tsv)
INVENTORY_URL="https://$INVENTORY_HOST"

# Set Inventory URL in Booking Service App Settings
az functionapp config appsettings set --name $BOOKING_APP_NAME --resource-group $RESOURCE_GROUP --settings "INVENTORY_SERVICE_URL=$INVENTORY_URL"

# Configure CORS
az functionapp cors add --name $INVENTORY_APP_NAME --resource-group $RESOURCE_GROUP --allowed-origins "*"
az functionapp cors add --name $BOOKING_APP_NAME --resource-group $RESOURCE_GROUP --allowed-origins "*"

# 4. Build and Deploy Frontend
echo "Building and Deploying Frontend..."
cd device-loan-web

# Get Booking URL
BOOKING_HOST=$(az functionapp show --name $BOOKING_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" --output tsv)
BOOKING_URL="https://$BOOKING_HOST"

# Create production .env file
echo "VITE_INVENTORY_API=$INVENTORY_URL/api" > .env.production
echo "VITE_BOOKING_API=$BOOKING_URL/api" >> .env.production

npm install
npm run build

# Upload to Azure Storage Static Website
az storage blob service-properties update --account-name $STORAGE_ACCOUNT_NAME --static-website --404-document $ERROR_DOCUMENT --index-document $INDEX_DOCUMENT

# Upload files
az storage blob upload-batch -s dist -d '$web' --account-name $STORAGE_ACCOUNT_NAME

# Get Frontend URL
WEB_URL=$(az storage account show -n $STORAGE_ACCOUNT_NAME -g $RESOURCE_GROUP --query "primaryEndpoints.web" --output tsv)

echo "Deployment Complete!"
echo "Frontend URL: $WEB_URL"
echo "Inventory API: $INVENTORY_URL"
echo "Booking API: $BOOKING_URL"
