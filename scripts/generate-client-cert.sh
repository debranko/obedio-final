#!/bin/bash

# =================================================================
# OBEDIO MQTT Client Certificate Generation Script
# This script generates client certificates signed by the OBEDIO CA
# =================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="${PROJECT_ROOT}/docker/certificates"
CA_DIR="${CERTS_DIR}/ca"
CLIENTS_DIR="${CERTS_DIR}/clients"

# Certificate configuration
CLIENT_KEY_SIZE=2048
CLIENT_VALIDITY_DAYS=365  # 1 year
CA_KEY_FILE="${CA_DIR}/ca.key"
CA_CERT_FILE="${CA_DIR}/ca.crt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to show usage
show_usage() {
    echo "Usage: $0 <device-id> [device-type] [organization]"
    echo
    echo "Parameters:"
    echo "  device-id     : Unique identifier for the device (required)"
    echo "  device-type   : Type of device (optional, default: device)"
    echo "  organization  : Organization name (optional, default: OBEDIO)"
    echo
    echo "Examples:"
    echo "  $0 button-001                    # Generate cert for button-001"
    echo "  $0 watch-042 watch               # Generate cert for watch device"
    echo "  $0 sensor-123 sensor \"OBEDIO IoT\" # Generate cert with custom org"
    echo
    echo "Device Types:"
    echo "  - button    : Emergency button devices"
    echo "  - watch     : Smartwatch devices"
    echo "  - sensor    : Environmental sensors"
    echo "  - gateway   : Gateway devices"
    echo "  - admin     : Administrative clients"
    echo "  - service   : Service clients"
    echo "  - device    : Generic device (default)"
    echo
}

# Function to validate parameters
validate_parameters() {
    if [[ $# -lt 1 ]]; then
        log_error "Device ID is required"
        show_usage
        exit 1
    fi
    
    # Validate device ID format
    if [[ ! "$1" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Device ID must contain only alphanumeric characters, hyphens, and underscores"
        exit 1
    fi
    
    # Check device ID length
    if [[ ${#1} -lt 3 || ${#1} -gt 64 ]]; then
        log_error "Device ID must be between 3 and 64 characters"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if OpenSSL is available
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi
    
    # Check if CA files exist
    if [[ ! -f "${CA_KEY_FILE}" ]]; then
        log_error "CA private key not found at ${CA_KEY_FILE}"
        log_error "Please run ./scripts/generate-ca.sh first"
        exit 1
    fi
    
    if [[ ! -f "${CA_CERT_FILE}" ]]; then
        log_error "CA certificate not found at ${CA_CERT_FILE}"
        log_error "Please run ./scripts/generate-ca.sh first"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to setup directory structure
setup_directories() {
    local device_id="$1"
    
    log_info "Setting up directory structure for ${device_id}..."
    
    # Create client directory
    mkdir -p "${CLIENTS_DIR}/${device_id}"
    chmod 755 "${CLIENTS_DIR}/${device_id}"
    
    log_success "Client directory created"
}

# Function to create client certificate configuration
create_client_config() {
    local device_id="$1"
    local device_type="$2"
    local organization="$3"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local config_file="${client_dir}/${device_id}.conf"
    
    log_info "Creating client certificate configuration..."
    
    # Determine certificate profile based on device type
    local key_usage="digitalSignature, keyAgreement"
    local extended_key_usage="clientAuth"
    local cert_comment="OBEDIO MQTT $(echo ${device_type} | sed 's/./\U&/') Certificate"
    
    case "$device_type" in
        "admin"|"service")
            extended_key_usage="clientAuth, serverAuth"
            ;;
        "gateway")
            key_usage="digitalSignature, keyEncipherment, keyAgreement"
            extended_key_usage="clientAuth, serverAuth"
            ;;
    esac
    
    cat > "${config_file}" << EOF
# OBEDIO MQTT Client Certificate Configuration
[ req ]
default_bits = ${CLIENT_KEY_SIZE}
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[ req_distinguished_name ]
C = US
O = ${organization}
CN = ${device_id}

[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = ${key_usage}
subjectAltName = @alt_names

[ v3_client ]
basicConstraints = CA:FALSE
nsCertType = client
nsComment = "${cert_comment}"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, ${key_usage}
extendedKeyUsage = ${extended_key_usage}
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = ${device_id}
DNS.2 = ${device_id}.obedio.local
EOF

    log_success "Client configuration file created"
}

# Function to generate client private key
generate_client_key() {
    local device_id="$1"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local key_file="${client_dir}/${device_id}.key"
    
    log_info "Generating client private key for ${device_id} (${CLIENT_KEY_SIZE} bits)..."
    
    # Check if client key already exists
    if [[ -f "${key_file}" ]]; then
        log_warning "Client private key already exists at ${key_file}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing client private key"
            return 0
        fi
        
        # Backup existing key
        backup_file="${CERTS_DIR}/backup/${device_id}.key.backup.$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${CERTS_DIR}/backup"
        cp "${key_file}" "${backup_file}"
        log_info "Backed up existing client key to ${backup_file}"
    fi
    
    # Generate client private key
    openssl genrsa -out "${key_file}" "${CLIENT_KEY_SIZE}"
    
    # Set strict permissions on private key
    chmod 600 "${key_file}"
    
    log_success "Client private key generated successfully"
}

# Function to generate certificate signing request
generate_csr() {
    local device_id="$1"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local key_file="${client_dir}/${device_id}.key"
    local csr_file="${client_dir}/${device_id}.csr"
    local config_file="${client_dir}/${device_id}.conf"
    
    log_info "Generating certificate signing request for ${device_id}..."
    
    # Generate CSR
    openssl req -new \
        -key "${key_file}" \
        -out "${csr_file}" \
        -config "${config_file}" \
        -extensions v3_req
    
    log_success "Certificate signing request generated"
}

# Function to sign client certificate with CA
sign_client_cert() {
    local device_id="$1"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local csr_file="${client_dir}/${device_id}.csr"
    local cert_file="${client_dir}/${device_id}.crt"
    local config_file="${client_dir}/${device_id}.conf"
    
    log_info "Signing client certificate for ${device_id} with CA..."
    
    # Check if client certificate already exists
    if [[ -f "${cert_file}" ]]; then
        log_warning "Client certificate already exists at ${cert_file}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing client certificate"
            return 0
        fi
        
        # Backup existing certificate
        backup_file="${CERTS_DIR}/backup/${device_id}.crt.backup.$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${CERTS_DIR}/backup"
        cp "${cert_file}" "${backup_file}"
        log_info "Backed up existing client certificate to ${backup_file}"
    fi
    
    # Sign certificate with CA
    openssl x509 -req \
        -in "${csr_file}" \
        -CA "${CA_CERT_FILE}" \
        -CAkey "${CA_KEY_FILE}" \
        -CAcreateserial \
        -out "${cert_file}" \
        -days "${CLIENT_VALIDITY_DAYS}" \
        -extensions v3_client \
        -extfile "${config_file}"
    
    # Set appropriate permissions
    chmod 644 "${cert_file}"
    
    # Clean up CSR file
    rm -f "${csr_file}"
    
    log_success "Client certificate signed successfully"
}

# Function to verify client certificate
verify_client_cert() {
    local device_id="$1"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local cert_file="${client_dir}/${device_id}.crt"
    
    log_info "Verifying client certificate for ${device_id}..."
    
    # Verify certificate against CA
    if openssl verify -CAfile "${CA_CERT_FILE}" "${cert_file}" > /dev/null 2>&1; then
        log_success "Client certificate verification passed"
        
        # Display certificate details
        echo
        log_info "Client Certificate Details:"
        echo "----------------------------------------"
        openssl x509 -in "${cert_file}" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|Public Key:|Signature Algorithm:|DNS:|URI:)"
        echo "----------------------------------------"
        
        # Display certificate fingerprint
        fingerprint=$(openssl x509 -in "${cert_file}" -fingerprint -sha256 -noout | cut -d'=' -f2)
        echo "SHA256 Fingerprint: ${fingerprint}"
        echo
    else
        log_error "Client certificate verification failed"
        exit 1
    fi
}

# Function to create certificate bundle
create_cert_bundle() {
    local device_id="$1"
    local device_type="$2"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local cert_file="${client_dir}/${device_id}.crt"
    local key_file="${client_dir}/${device_id}.key"
    local bundle_file="${client_dir}/${device_id}-bundle.pem"
    local chain_file="${client_dir}/${device_id}-chain.crt"
    
    log_info "Creating certificate bundle for ${device_id}..."
    
    # Create certificate chain (client cert + CA cert)
    cat "${cert_file}" "${CA_CERT_FILE}" > "${chain_file}"
    chmod 644 "${chain_file}"
    
    # Create complete bundle (private key + client cert + CA cert)
    cat "${key_file}" "${cert_file}" "${CA_CERT_FILE}" > "${bundle_file}"
    chmod 600 "${bundle_file}"
    
    log_success "Certificate bundle created"
}

# Function to create client configuration files
create_client_configs() {
    local device_id="$1"
    local device_type="$2"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local cert_file="${client_dir}/${device_id}.crt"
    local key_file="${client_dir}/${device_id}.key"
    
    log_info "Creating client configuration files..."
    
    # Create MQTT client configuration
    cat > "${client_dir}/${device_id}-mqtt.conf" << EOF
# OBEDIO MQTT Client Configuration for ${device_id}
# Device Type: ${device_type}
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

[connection]
host = mosquitto.obedio.local
port = 8883
keepalive = 60
clean_session = true

[security]
ca_certs = ${CA_CERT_FILE}
certfile = ${cert_file}
keyfile = ${key_file}
tls_version = tlsv1.2
cert_reqs = ssl.CERT_REQUIRED
ciphers = HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA

[client]
client_id = ${device_type}-${device_id}
username = ${device_type}-${device_id}
protocol = MQTTv5

[topics]
# Publish topics
status_topic = obedio/devices/${device_type}/${device_id}/status
telemetry_topic = obedio/devices/${device_type}/${device_id}/telemetry

# Subscribe topics
command_topic = obedio/devices/${device_type}/${device_id}/command
config_topic = obedio/devices/${device_type}/${device_id}/config

[qos]
default_qos = 1
retain_messages = false
EOF

    # Create environment file for Docker/container usage
    cat > "${client_dir}/${device_id}.env" << EOF
# OBEDIO MQTT Client Environment Configuration
MQTT_CLIENT_ID=${device_type}-${device_id}
MQTT_BROKER_HOST=mosquitto.obedio.local
MQTT_BROKER_PORT=8883
MQTT_USERNAME=${device_type}-${device_id}
MQTT_CA_CERT_PATH=${CA_CERT_FILE}
MQTT_CLIENT_CERT_PATH=${cert_file}
MQTT_CLIENT_KEY_PATH=${key_file}
MQTT_DEVICE_TYPE=${device_type}
MQTT_DEVICE_ID=${device_id}
MQTT_USE_TLS=true
MQTT_TLS_INSECURE=false
EOF

    chmod 644 "${client_dir}/${device_id}-mqtt.conf"
    chmod 644 "${client_dir}/${device_id}.env"
    
    log_success "Client configuration files created"
}

# Function to test certificate configuration
test_certificate() {
    local device_id="$1"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    local cert_file="${client_dir}/${device_id}.crt"
    local key_file="${client_dir}/${device_id}.key"
    
    log_info "Testing certificate configuration for ${device_id}..."
    
    # Test certificate and key match
    cert_modulus=$(openssl x509 -noout -modulus -in "${cert_file}" | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "${key_file}" | openssl md5)
    
    if [[ "${cert_modulus}" == "${key_modulus}" ]]; then
        log_success "Certificate and private key match"
    else
        log_error "Certificate and private key do not match"
        exit 1
    fi
    
    # Test certificate chain
    if openssl verify -CAfile "${CA_CERT_FILE}" "${cert_file}" > /dev/null 2>&1; then
        log_success "Certificate chain validation passed"
    else
        log_error "Certificate chain validation failed"
        exit 1
    fi
}

# Function to display next steps
show_next_steps() {
    local device_id="$1"
    local device_type="$2"
    local client_dir="${CLIENTS_DIR}/${device_id}"
    
    echo
    log_success "🎉 Client certificate generation completed successfully!"
    echo
    echo "Generated files for ${device_id}:"
    echo "  - Private Key:        ${client_dir}/${device_id}.key"
    echo "  - Certificate:        ${client_dir}/${device_id}.crt"
    echo "  - Certificate Chain:  ${client_dir}/${device_id}-chain.crt"
    echo "  - Certificate Bundle: ${client_dir}/${device_id}-bundle.pem"
    echo "  - MQTT Config:        ${client_dir}/${device_id}-mqtt.conf"
    echo "  - Environment Config: ${client_dir}/${device_id}.env"
    echo
    echo "Certificate Details:"
    echo "  - Device ID: ${device_id}"
    echo "  - Device Type: ${device_type}"
    echo "  - Valid for: ${CLIENT_VALIDITY_DAYS} days"
    echo "  - Key Size: ${CLIENT_KEY_SIZE} bits"
    echo
    echo "Usage Examples:"
    echo "  # Test TLS connection:"
    echo "  openssl s_client -connect localhost:8883 \\"
    echo "    -CAfile ${CA_CERT_FILE} \\"
    echo "    -cert ${client_dir}/${device_id}.crt \\"
    echo "    -key ${client_dir}/${device_id}.key"
    echo
    echo "  # Use with mosquitto_pub:"
    echo "  mosquitto_pub -h localhost -p 8883 --cafile ${CA_CERT_FILE} \\"
    echo "    --cert ${client_dir}/${device_id}.crt \\"
    echo "    --key ${client_dir}/${device_id}.key \\"
    echo "    -t 'obedio/devices/${device_type}/${device_id}/status' \\"
    echo "    -m '{\"status\":\"online\"}'"
    echo
    echo "Next steps:"
    echo "  1. Start the MQTT system: docker-compose -f docker-compose.mqtt.yml up -d"
    echo "  2. Test the certificate with the examples above"
    echo "  3. Use the generated configuration files in your IoT devices"
    echo
    echo "⚠️  SECURITY NOTES:"
    echo "  - Keep the private key (${client_dir}/${device_id}.key) secure"
    echo "  - The certificate is valid for ${CLIENT_VALIDITY_DAYS} days"
    echo "  - Monitor certificate expiration and renew before expiry"
    echo "  - Use proper file permissions in production environments"
    echo
}

# Main execution
main() {
    # Parse parameters
    local device_id="$1"
    local device_type="${2:-device}"
    local organization="${3:-OBEDIO}"
    
    echo "=================================================="
    echo "OBEDIO MQTT Client Certificate Generator"
    echo "=================================================="
    echo
    echo "Device ID: ${device_id}"
    echo "Device Type: ${device_type}"
    echo "Organization: ${organization}"
    echo
    
    # Validate and check prerequisites
    validate_parameters "$@"
    check_prerequisites
    
    # Setup environment
    setup_directories "${device_id}"
    create_client_config "${device_id}" "${device_type}" "${organization}"
    
    # Generate client certificate
    generate_client_key "${device_id}"
    generate_csr "${device_id}"
    sign_client_cert "${device_id}"
    
    # Create additional files
    create_cert_bundle "${device_id}" "${device_type}"
    create_client_configs "${device_id}" "${device_type}"
    
    # Verify and test
    verify_client_cert "${device_id}"
    test_certificate "${device_id}"
    
    # Display results
    show_next_steps "${device_id}" "${device_type}"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    main "$@"
fi