# Firebase Extensions Installation Script for TourTrip.app (PowerShell)
# This script installs and configures Firebase Extensions

param(
    [string]$Environment = "development",
    [switch]$SkipVerification = $false,
    [switch]$Force = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ExtensionsFile = "firebase-extensions.yaml"
$ProjectId = ""

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check dependencies
function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    # Check Firebase CLI
    try {
        $firebaseVersion = firebase --version
        Write-Success "Firebase CLI found: $firebaseVersion"
    }
    catch {
        Write-Error "Firebase CLI is not installed. Please install it first:"
        Write-Info "npm install -g firebase-tools"
        exit 1
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install it first."
        exit 1
    }
    
    Write-Success "Dependencies checked"
}

# Get Firebase project configuration
function Get-ProjectConfig {
    Write-Info "Getting project configuration..."
    
    try {
        $projectInfo = firebase use --json | ConvertFrom-Json
        $script:ProjectId = $projectInfo.result.project
        
        if (-not $ProjectId -or $ProjectId -eq "null") {
            Write-Error "No Firebase project selected. Please run 'firebase use <project-id>' first"
            exit 1
        }
        
        Write-Info "Using project: $ProjectId"
        Write-Info "Environment: $Environment"
    }
    catch {
        Write-Error "Failed to get project configuration: $_"
        exit 1
    }
}

# Install Stripe Payments Extension
function Install-StripeExtension {
    Write-Info "Installing Stripe Payments Extension..."
    
    try {
        $params = @{
            "PRODUCTS_COLLECTION" = "products"
            "CUSTOMERS_COLLECTION" = "customers"
            "CHECKOUT_SESSION_COLLECTION" = "checkout_sessions"
            "PRICE_COLLECTION" = "prices"
            "SYNC_USERS_ON_CREATE" = "yes"
            "DELETE_STRIPE_CUSTOMERS" = "no"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-stripe-payments --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "Stripe Payments Extension installed"
    }
    catch {
        Write-Error "Failed to install Stripe extension: $_"
        throw
    }
}

# Install SendGrid Email Extension
function Install-SendGridExtension {
    Write-Info "Installing SendGrid Email Extension..."
    
    try {
        $params = @{
            "MAIL_COLLECTION" = "mail"
            "DEFAULT_FROM" = "noreply@tourtrip.app"
            "DEFAULT_REPLY_TO" = "support@tourtrip.app"
            "USERS_COLLECTION" = "users"
            "TEMPLATES_COLLECTION" = "emailTemplates"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-send-email --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "SendGrid Email Extension installed"
    }
    catch {
        Write-Error "Failed to install SendGrid extension: $_"
        throw
    }
}

# Install Image Resizing Extension
function Install-ImageResizeExtension {
    Write-Info "Installing Image Resizing Extension..."
    
    try {
        $params = @{
            "IMG_SIZES" = "200x200,400x400,800x800,1200x1200"
            "RESIZED_IMAGES_PATH" = "resized"
            "DELETE_ORIGINAL_FILE" = "no"
            "CACHE_CONTROL_HEADER" = "max-age=31536000"
            "IMG_TYPES" = "jpeg,jpg,png,webp"
            "CONVERT_TO" = "webp"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install storage-resize-images --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "Image Resizing Extension installed"
    }
    catch {
        Write-Error "Failed to install Image Resize extension: $_"
        throw
    }
}

# Install Algolia Search Extension
function Install-AlgoliaExtension {
    Write-Info "Installing Algolia Search Extension..."
    
    try {
        $params = @{
            "COLLECTION_PATH" = "tours"
            "FIELDS" = "title,description,location,tags,category,price"
            "INDEX_NAME" = "tours_index"
            "TRANSFORM_FUNCTION" = "algoliaTransform"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-algolia-search --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "Algolia Search Extension installed"
    }
    catch {
        Write-Error "Failed to install Algolia extension: $_"
        throw
    }
}

# Install Translation Extension
function Install-TranslateExtension {
    Write-Info "Installing Translation Extension..."
    
    try {
        $params = @{
            "COLLECTION_PATH" = "tours"
            "INPUT_FIELD_NAME" = "description"
            "OUTPUT_FIELD_NAME" = "descriptions"
            "LANGUAGES" = "en,tr,de,fr,es,it"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-translate-text --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "Translation Extension installed"
    }
    catch {
        Write-Error "Failed to install Translation extension: $_"
        throw
    }
}

# Install BigQuery Export Extension
function Install-BigQueryExtension {
    Write-Info "Installing BigQuery Export Extension..."
    
    try {
        $params = @{
            "COLLECTION_PATH" = "{default}"
            "DATASET_ID" = "firestore_export"
            "TABLE_ID" = "{collectionId}_raw_changelog"
            "DATASET_LOCATION" = "EU"
            "BACKUP_COLLECTION" = "backups"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-bigquery-export --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "BigQuery Export Extension installed"
    }
    catch {
        Write-Error "Failed to install BigQuery extension: $_"
        throw
    }
}

# Install URL Shortener Extension
function Install-UrlShortenerExtension {
    Write-Info "Installing URL Shortener Extension..."
    
    try {
        $params = @{
            "COLLECTION_PATH" = "shortenedUrls"
            "URL_FIELD_NAME" = "url"
            "SHORT_URL_FIELD_NAME" = "shortUrl"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-shorten-urls-bitly --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "URL Shortener Extension installed"
    }
    catch {
        Write-Error "Failed to install URL Shortener extension: $_"
        throw
    }
}

# Install SMS Extension
function Install-SmsExtension {
    Write-Info "Installing SMS Extension..."
    
    try {
        $params = @{
            "COLLECTION_PATH" = "sms"
            "DELIVERY_RECEIPT_COLLECTION" = "smsDelivery"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-send-sms --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "SMS Extension installed"
    }
    catch {
        Write-Error "Failed to install SMS extension: $_"
        throw
    }
}

# Install Audit Logs Extension
function Install-AuditExtension {
    Write-Info "Installing Audit Logs Extension..."
    
    try {
        $params = @{
            "AUDIT_COLLECTION" = "auditLogs"
            "WATCHED_COLLECTIONS" = "users,bookings,payments,tours"
            "INCLUDE_METADATA" = "yes"
            "CAPTURE_READ_OPERATIONS" = "no"
            "CAPTURE_WRITE_OPERATIONS" = "yes"
        }
        
        $paramString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","
        
        firebase ext:install firestore-firestore-audit --project=$ProjectId --params=$paramString --non-interactive
        Write-Success "Audit Logs Extension installed"
    }
    catch {
        Write-Error "Failed to install Audit extension: $_"
        throw
    }
}

# Install all extensions
function Install-AllExtensions {
    Write-Info "Installing all Firebase Extensions..."
    
    try {
        # Install in order to handle dependencies
        Install-StripeExtension
        Install-ImageResizeExtension
        Install-SendGridExtension
        Install-AlgoliaExtension
        Install-TranslateExtension
        Install-BigQueryExtension
        Install-UrlShortenerExtension
        Install-SmsExtension
        Install-AuditExtension
        
        Write-Success "All extensions installed successfully!"
    }
    catch {
        Write-Error "Failed to install all extensions: $_"
        throw
    }
}

# Configure extension parameters based on environment
function Set-ExtensionConfiguration {
    Write-Info "Configuring extensions for environment: $Environment"
    
    switch ($Environment) {
        "development" {
            Write-Info "Setting up development configuration..."
            # Development-specific configuration
        }
        "staging" {
            Write-Info "Setting up staging configuration..."
            # Staging-specific configuration
        }
        "production" {
            Write-Info "Setting up production configuration..."
            # Production-specific configuration
        }
        default {
            Write-Warning "Unknown environment: $Environment. Using development defaults."
        }
    }
}

# Verify extensions installation
function Test-ExtensionsInstallation {
    if ($SkipVerification) {
        Write-Info "Skipping extensions verification"
        return
    }
    
    Write-Info "Verifying extensions installation..."
    
    try {
        # List installed extensions
        firebase ext:list --project=$ProjectId
        
        # Check extension status
        $extensions = @(
            "firestore-stripe-payments",
            "firestore-send-email",
            "storage-resize-images",
            "firestore-algolia-search",
            "firestore-translate-text",
            "firestore-bigquery-export",
            "firestore-shorten-urls-bitly",
            "firestore-send-sms",
            "firestore-firestore-audit"
        )
        
        foreach ($ext in $extensions) {
            try {
                firebase ext:info $ext --project=$ProjectId | Out-Null
                Write-Success "✓ $ext is installed"
            }
            catch {
                Write-Error "✗ $ext is not installed or not working"
            }
        }
    }
    catch {
        Write-Error "Failed to verify extensions: $_"
        throw
    }
}

# Set up extension triggers and webhooks
function Set-WebhooksConfiguration {
    Write-Info "Setting up webhooks and triggers..."
    
    # Stripe webhook setup
    Write-Info "Setting up Stripe webhooks..."
    Write-Warning "Please configure Stripe webhooks manually in the Stripe dashboard:"
    Write-Info "1. Go to https://dashboard.stripe.com/webhooks"
    Write-Info "2. Add endpoint: https://us-central1-$ProjectId.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents"
    Write-Info "3. Select events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed"
    
    # SendGrid webhook setup
    Write-Info "Setting up SendGrid webhooks..."
    Write-Warning "Please configure SendGrid event webhooks in the SendGrid dashboard"
    
    Write-Success "Webhook setup instructions provided"
}

# Create extension configuration backup
function Backup-Configuration {
    Write-Info "Creating configuration backup..."
    
    $backupDir = "backups/extensions-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    try {
        # Export extension configurations
        firebase ext:list --project=$ProjectId | Out-File -FilePath "$backupDir/extensions-list.txt"
        
        # Copy configuration files
        if (Test-Path $ExtensionsFile) {
            Copy-Item $ExtensionsFile "$backupDir/"
        }
        
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" "$backupDir/"
        }
        
        Write-Success "Configuration backed up to: $backupDir"
    }
    catch {
        Write-Error "Failed to create backup: $_"
        throw
    }
}

# Main installation flow
function Start-ExtensionsInstallation {
    Write-Info "Starting Firebase Extensions installation for TourTrip.app"
    Write-Info "Environment: $Environment"
    
    try {
        Test-Dependencies
        Get-ProjectConfig
        Backup-Configuration
        Set-ExtensionConfiguration
        Install-AllExtensions
        Set-WebhooksConfiguration
        Test-ExtensionsInstallation
        
        Write-Success "Firebase Extensions installation completed!"
        Write-Info "Next steps:"
        Write-Info "1. Configure API keys in Firebase console"
        Write-Info "2. Set up webhooks for external services"
        Write-Info "3. Test extensions functionality"
        Write-Info "4. Monitor extension logs in Firebase console"
    }
    catch {
        Write-Error "Installation failed: $_"
        exit 1
    }
}

# Run main function
Start-ExtensionsInstallation
