#!/bin/bash

# =================================================================
# OBEDIO MQTT Server Certificate Generation Script
# This script generates server certificates signed by the OBEDIO CA
# =================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="${PROJECT_ROOT}/docker/certificates"
CA_DIR="${CERTS_DIR}/ca"
SERVER_DIR="${CERTS_DIR}/server"

# Certificate configuration
SERVER_KEY_SIZE=2048
SERVER_VALIDITY_DAYS=730  # 2 years
SERVER_CN="mosquitto.obedio.local"
CA_KEY_FILE="${CA_DIR}/ca.key"
CA_CERT_FILE="${CA_DIR}/ca.crt"
SERVER_KEY_FILE="${SERVER_DIR}/server.key"
SERVER_CERT_FILE="${SERVER_DIR}/server.crt"
SERVER_CSR_FILE="${SERVER_DIR}/server.csr"
SERVER_CONFIG_FILE="${SERVER_DIR}/server.conf"

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
    log_info "Setting up directory structure..."
    
    mkdir -p "${SERVER_DIR}"
    chmod 755 "${SERVER_DIR}"
    
    log_success "Server directory created"
}

# Function to create server certificate configuration
create_server_config() {
    log_info "Creating server certificate configuration..."
    
    cat > "${SERVER_CONFIG_FILE}" << EOF
# OBEDIO MQTT Server Certificate Configuration
[ req ]
default_bits = ${SERVER_KEY_SIZE}
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[ req_distinguished_name ]
C = US
O = OBEDIO
CN = ${SERVER_CN}

[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[ v3_server ]
basicConstraints = CA:FALSE
nsCertType = server
nsComment = "OBEDIO MQTT Server Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = mosquitto
DNS.2 = mosquitto.obedio.local
DNS.3 = localhost
DNS.4 = obedio-mosquitto
DNS.5 = mqtt.obedio.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    log_success "Server configuration file created"
}

# Function to generate server private key
generate_server_key() {
    log_info "Generating server private key (${SERVER_KEY_SIZE} bits)..."
    
    # Check if server key already exists
    if [[ -f "${SERVER_KEY_FILE}" ]]; then
        log_warning "Server private key already exists at ${SERVER_KEY_FILE}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing server private key"
            return 0
        fi
        
        # Backup existing key
        backup_file="${CERTS_DIR}/backup/server.key.backup.$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${CERTS_DIR}/backup"
        cp "${SERVER_KEY_FILE}" "${backup_file}"
        log_info "Backed up existing server key to ${backup_file}"
    fi
    
    # Generate server private key
    openssl genrsa -out "${SERVER_KEY_FILE}" "${SERVER_KEY_SIZE}"
    
    # Set strict permissions on private key
    chmod 600 "${SERVER_KEY_FILE}"
    
    log_success "Server private key generated successfully"
}

# Function to generate certificate signing request
generate_csr() {
    log_info "Generating certificate signing request..."
    
    # Generate CSR
    openssl req -new \
        -key "${SERVER_KEY_FILE}" \
        -out "${SERVER_CSR_FILE}" \
        -config "${SERVER_CONFIG_FILE}" \
        -extensions v3_req
    
    log_success "Certificate signing request generated"
}

# Function to sign server certificate with CA
sign_server_cert() {
    log_info "Signing server certificate with CA..."
    
    # Check if server certificate already exists
    if [[ -f "${SERVER_CERT_FILE}" ]]; then
        log_warning "Server certificate already exists at ${SERVER_CERT_FILE}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing server certificate"
            return 0
        fi
        
        # Backup existing certificate
        backup_file="${CERTS_DIR}/backup/server.crt.backup.$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${CERTS_DIR}/backup"
        cp "${SERVER_CERT_FILE}" "${backup_file}"
        log_info "Backed up existing server certificate to ${backup_file}"
    fi
    
    # Sign certificate with CA
    openssl x509 -req \
        -in "${SERVER_CSR_FILE}" \
        -CA "${CA_CERT_FILE}" \
        -CAkey "${CA_KEY_FILE}" \
        -CAcreateserial \
        -out "${SERVER_CERT_FILE}" \
        -days "${SERVER_VALIDITY_DAYS}" \
        -extensions v3_server \
        -extfile "${SERVER_CONFIG_FILE}"
    
    # Set appropriate permissions
    chmod 644 "${SERVER_CERT_FILE}"
    
    # Clean up CSR file
    rm -f "${SERVER_CSR_FILE}"
    
    log_success "Server certificate signed successfully"
}

# Function to verify server certificate
verify_server_cert() {
    log_info "Verifying server certificate..."
    
    # Verify certificate against CA
    if openssl verify -CAfile "${CA_CERT_FILE}" "${SERVER_CERT_FILE}" > /dev/null 2>&1; then
        log_success "Server certificate verification passed"
        
        # Display certificate details
        echo
        log_info "Server Certificate Details:"
        echo "----------------------------------------"
        openssl x509 -in "${SERVER_CERT_FILE}" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|Public Key:|Signature Algorithm:|DNS:|IP Address:)"
        echo "----------------------------------------"
        
        # Display certificate fingerprint
        fingerprint=$(openssl x509 -in "${SERVER_CERT_FILE}" -fingerprint -sha256 -noout | cut -d'=' -f2)
        echo "SHA256 Fingerprint: ${fingerprint}"
        echo
    else
        log_error "Server certificate verification failed"
        exit 1
    fi
}

# Function to setup certificates for Mosquitto
setup_mosquitto_certs() {
    log_info "Setting up certificates for Mosquitto..."
    
    # Copy certificates to main certificates directory
    cp "${SERVER_CERT_FILE}" "${CERTS_DIR}/server.crt"
    cp "${SERVER_KEY_FILE}" "${CERTS_DIR}/server.key"
    
    # Set appropriate permissions
    chmod 644 "${CERTS_DIR}/server.crt"
    chmod 600 "${CERTS_DIR}/server.key"
    
    log_success "Server certificates copied to Mosquitto directory"
}

# Function to create certificate chain
create_cert_chain() {
    log_info "Creating certificate chain..."
    
    # Create certificate chain file (server cert + CA cert)
    cat "${SERVER_CERT_FILE}" "${CA_CERT_FILE}" > "${SERVER_DIR}/server-chain.crt"
    cp "${SERVER_DIR}/server-chain.crt" "${CERTS_DIR}/server-chain.crt"
    
    chmod 644 "${SERVER_DIR}/server-chain.crt"
    chmod 644 "${CERTS_DIR}/server-chain.crt"
    
    log_success "Certificate chain created"
}

# Function to test certificate configuration
test_certificate() {
    log_info "Testing certificate configuration..."
    
    # Test certificate and key match
    server_cert_modulus=$(openssl x509 -noout -modulus -in "${SERVER_CERT_FILE}" | openssl md5)
    server_key_modulus=$(openssl rsa -noout -modulus -in "${SERVER_KEY_FILE}" | openssl md5)
    
    if [[ "${server_cert_modulus}" == "${server_key_modulus}" ]]; then
        log_success "Certificate and private key match"
    else
        log_error "Certificate and private key do not match"
        exit 1
    fi
    
    # Test certificate chain
    if openssl verify -CAfile "${CA_CERT_FILE}" "${SERVER_CERT_FILE}" > /dev/null 2>&1; then
        log_success "Certificate chain validation passed"
    else
        log_error "Certificate chain validation failed"
        exit 1
    fi
}

# Function to display next steps
show_next_steps() {
    echo
    log_success "🎉 Server certificate generation completed successfully!"
    echo
    echo "Generated files:"
    echo "  - Server Private Key: ${SERVER_KEY_FILE}"
    echo "  - Server Certificate: ${SERVER_CERT_FILE}"
    echo "  - Server Config:      ${SERVER_CONFIG_FILE}"
    echo "  - Certificate Chain:  ${SERVER_DIR}/server-chain.crt"
    echo "  - Mosquitto Server Cert: ${CERTS_DIR}/server.crt"
    echo "  - Mosquitto Server Key:  ${CERTS_DIR}/server.key"
    echo
    echo "Certificate Details:"
    echo "  - Common Name: ${SERVER_CN}"
    echo "  - Valid for: ${SERVER_VALIDITY_DAYS} days"
    echo "  - Key Size: ${SERVER_KEY_SIZE} bits"
    echo
    echo "Subject Alternative Names (SAN):"
    echo "  - DNS: mosquitto, mosquitto.obedio.local, localhost, obedio-mosquitto, mqtt.obedio.local"
    echo "  - IP: 127.0.0.1, ::1"
    echo
    echo "Next steps:"
    echo "  1. Generate client certificates using: ./scripts/generate-client-cert.sh <device-id>"
    echo "  2. Start the MQTT system with: docker-compose -f docker-compose.mqtt.yml up -d"
    echo "  3. Test TLS connection with: openssl s_client -connect localhost:8883 -CAfile ${CERTS_DIR}/ca.crt"
    echo
    echo "⚠️  SECURITY NOTES:"
    echo "  - Keep the server private key (${SERVER_KEY_FILE}) secure"
    echo "  - The server certificate is valid for ${SERVER_VALIDITY_DAYS} days"
    echo "  - Monitor certificate expiration and renew before expiry"
    echo
}

# Main execution
main() {
    echo "================================================"
    echo "OBEDIO MQTT Server Certificate Generator"
    echo "================================================"
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_directories
    create_server_config
    
    # Generate server certificate
    generate_server_key
    generate_csr
    sign_server_cert
    
    # Create additional files
    create_cert_chain
    setup_mosquitto_certs
    
    # Verify and test
    verify_server_cert
    test_certificate
    
    # Display results
    show_next_steps
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi