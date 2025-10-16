#!/bin/bash

# Firebase Extensions Installation Script for TourTrip.app
# This script installs and configures Firebase Extensions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_ID=""
EXTENSIONS_FILE="firebase-extensions.yaml"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed. Please install it first:"
        log_info "npm install -g firebase-tools"
        exit 1
    fi
    
    if ! command -v yq &> /dev/null; then
        log_warning "yq is not installed. Installing via npm..."
        npm install -g yq
    fi
    
    log_success "Dependencies checked"
}

# Get Firebase project configuration
get_project_config() {
    log_info "Getting project configuration..."
    
    # Get current project
    PROJECT_ID=$(firebase use --json | jq -r '.result.project')
    
    if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
        log_error "No Firebase project selected. Please run 'firebase use <project-id>' first"
        exit 1
    fi
    
    log_info "Using project: $PROJECT_ID"
    log_info "Environment: $ENVIRONMENT"
}

# Install Stripe Payments Extension
install_stripe_extension() {
    log_info "Installing Stripe Payments Extension..."
    
    firebase ext:install firestore-stripe-payments \
        --project=$PROJECT_ID \
        --params="
            PRODUCTS_COLLECTION=products,
            CUSTOMERS_COLLECTION=customers,
            CHECKOUT_SESSION_COLLECTION=checkout_sessions,
            PRICE_COLLECTION=prices,
            SYNC_USERS_ON_CREATE=yes,
            DELETE_STRIPE_CUSTOMERS=no
        " \
        --non-interactive
    
    log_success "Stripe Payments Extension installed"
}

# Install SendGrid Email Extension
install_sendgrid_extension() {
    log_info "Installing SendGrid Email Extension..."
    
    firebase ext:install firestore-send-email \
        --project=$PROJECT_ID \
        --params="
            MAIL_COLLECTION=mail,
            DEFAULT_FROM=noreply@tourtrip.app,
            DEFAULT_REPLY_TO=support@tourtrip.app,
            USERS_COLLECTION=users,
            TEMPLATES_COLLECTION=emailTemplates
        " \
        --non-interactive
    
    log_success "SendGrid Email Extension installed"
}

# Install Image Resizing Extension
install_image_resize_extension() {
    log_info "Installing Image Resizing Extension..."
    
    firebase ext:install storage-resize-images \
        --project=$PROJECT_ID \
        --params="
            IMG_SIZES=200x200,400x400,800x800,1200x1200,
            RESIZED_IMAGES_PATH=resized,
            DELETE_ORIGINAL_FILE=no,
            CACHE_CONTROL_HEADER=max-age=31536000,
            IMG_TYPES=jpeg,jpg,png,webp,
            CONVERT_TO=webp
        " \
        --non-interactive
    
    log_success "Image Resizing Extension installed"
}

# Install Algolia Search Extension
install_algolia_extension() {
    log_info "Installing Algolia Search Extension..."
    
    firebase ext:install firestore-algolia-search \
        --project=$PROJECT_ID \
        --params="
            COLLECTION_PATH=tours,
            FIELDS=title,description,location,tags,category,price,
            INDEX_NAME=tours_index,
            TRANSFORM_FUNCTION=algoliaTransform
        " \
        --non-interactive
    
    log_success "Algolia Search Extension installed"
}

# Install Translation Extension
install_translate_extension() {
    log_info "Installing Translation Extension..."
    
    firebase ext:install firestore-translate-text \
        --project=$PROJECT_ID \
        --params="
            COLLECTION_PATH=tours,
            INPUT_FIELD_NAME=description,
            OUTPUT_FIELD_NAME=descriptions,
            LANGUAGES=en,tr,de,fr,es,it
        " \
        --non-interactive
    
    log_success "Translation Extension installed"
}

# Install BigQuery Export Extension
install_bigquery_extension() {
    log_info "Installing BigQuery Export Extension..."
    
    firebase ext:install firestore-bigquery-export \
        --project=$PROJECT_ID \
        --params="
            COLLECTION_PATH={default},
            DATASET_ID=firestore_export,
            TABLE_ID={collectionId}_raw_changelog,
            DATASET_LOCATION=EU,
            BACKUP_COLLECTION=backups
        " \
        --non-interactive
    
    log_success "BigQuery Export Extension installed"
}

# Install URL Shortener Extension
install_url_shortener_extension() {
    log_info "Installing URL Shortener Extension..."
    
    firebase ext:install firestore-shorten-urls-bitly \
        --project=$PROJECT_ID \
        --params="
            COLLECTION_PATH=shortenedUrls,
            URL_FIELD_NAME=url,
            SHORT_URL_FIELD_NAME=shortUrl
        " \
        --non-interactive
    
    log_success "URL Shortener Extension installed"
}

# Install SMS Extension
install_sms_extension() {
    log_info "Installing SMS Extension..."
    
    firebase ext:install firestore-send-sms \
        --project=$PROJECT_ID \
        --params="
            COLLECTION_PATH=sms,
            DELIVERY_RECEIPT_COLLECTION=smsDelivery
        " \
        --non-interactive
    
    log_success "SMS Extension installed"
}

# Install Audit Logs Extension
install_audit_extension() {
    log_info "Installing Audit Logs Extension..."
    
    firebase ext:install firestore-firestore-audit \
        --project=$PROJECT_ID \
        --params="
            AUDIT_COLLECTION=auditLogs,
            WATCHED_COLLECTIONS=users,bookings,payments,tours,
            INCLUDE_METADATA=yes,
            CAPTURE_READ_OPERATIONS=no,
            CAPTURE_WRITE_OPERATIONS=yes
        " \
        --non-interactive
    
    log_success "Audit Logs Extension installed"
}

# Install all extensions
install_all_extensions() {
    log_info "Installing all Firebase Extensions..."
    
    # Install in order to handle dependencies
    install_stripe_extension
    install_image_resize_extension
    install_sendgrid_extension
    install_algolia_extension
    install_translate_extension
    install_bigquery_extension
    install_url_shortener_extension
    install_sms_extension
    install_audit_extension
    
    log_success "All extensions installed successfully!"
}

# Configure extension parameters based on environment
configure_extensions() {
    log_info "Configuring extensions for environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development)
            log_info "Setting up development configuration..."
            # Development-specific configuration
            ;;
        staging)
            log_info "Setting up staging configuration..."
            # Staging-specific configuration
            ;;
        production)
            log_info "Setting up production configuration..."
            # Production-specific configuration
            ;;
        *)
            log_warning "Unknown environment: $ENVIRONMENT. Using development defaults."
            ;;
    esac
}

# Verify extensions installation
verify_extensions() {
    log_info "Verifying extensions installation..."
    
    # List installed extensions
    firebase ext:list --project=$PROJECT_ID
    
    # Check extension status
    extensions=(
        "firestore-stripe-payments"
        "firestore-send-email"
        "storage-resize-images"
        "firestore-algolia-search"
        "firestore-translate-text"
        "firestore-bigquery-export"
        "firestore-shorten-urls-bitly"
        "firestore-send-sms"
        "firestore-firestore-audit"
    )
    
    for ext in "${extensions[@]}"; do
        if firebase ext:info $ext --project=$PROJECT_ID &> /dev/null; then
            log_success "✓ $ext is installed"
        else
            log_error "✗ $ext is not installed or not working"
        fi
    done
}

# Set up extension triggers and webhooks
setup_webhooks() {
    log_info "Setting up webhooks and triggers..."
    
    # Stripe webhook setup
    log_info "Setting up Stripe webhooks..."
    log_warning "Please configure Stripe webhooks manually in the Stripe dashboard:"
    log_info "1. Go to https://dashboard.stripe.com/webhooks"
    log_info "2. Add endpoint: https://us-central1-$PROJECT_ID.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents"
    log_info "3. Select events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed"
    
    # SendGrid webhook setup
    log_info "Setting up SendGrid webhooks..."
    log_warning "Please configure SendGrid event webhooks in the SendGrid dashboard"
    
    log_success "Webhook setup instructions provided"
}

# Create extension configuration backup
backup_configuration() {
    log_info "Creating configuration backup..."
    
    backup_dir="backups/extensions-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $backup_dir
    
    # Export extension configurations
    firebase ext:list --project=$PROJECT_ID > "$backup_dir/extensions-list.txt"
    
    # Copy configuration files
    cp firebase-extensions.yaml "$backup_dir/"
    cp .env.example "$backup_dir/"
    
    log_success "Configuration backed up to: $backup_dir"
}

# Main installation flow
main() {
    log_info "Starting Firebase Extensions installation for TourTrip.app"
    log_info "Environment: $ENVIRONMENT"
    
    check_dependencies
    get_project_config
    backup_configuration
    configure_extensions
    install_all_extensions
    setup_webhooks
    verify_extensions
    
    log_success "Firebase Extensions installation completed!"
    log_info "Next steps:"
    log_info "1. Configure API keys in Firebase console"
    log_info "2. Set up webhooks for external services"
    log_info "3. Test extensions functionality"
    log_info "4. Monitor extension logs in Firebase console"
}

# Error handling
trap 'log_error "Installation failed at line $LINENO. Exit code: $?"' ERR

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
