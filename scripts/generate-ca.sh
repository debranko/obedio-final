#!/bin/bash

# =================================================================
# OBEDIO MQTT Certificate Authority (CA) Generation Script
# This script generates a root Certificate Authority for OBEDIO MQTT system
# =================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="${PROJECT_ROOT}/docker/certificates"
CA_DIR="${CERTS_DIR}/ca"

# Certificate configuration
CA_KEY_SIZE=4096
CA_VALIDITY_DAYS=3650  # 10 years
CA_SUBJECT="/C=US/O=OBEDIO/CN=OBEDIO Root CA"
CA_KEY_FILE="${CA_DIR}/ca.key"
CA_CERT_FILE="${CA_DIR}/ca.crt"
CA_CONFIG_FILE="${CA_DIR}/ca.conf"

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

# Function to check if OpenSSL is available
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi
    log_info "OpenSSL version: $(openssl version)"
}

# Function to create directory structure
setup_directories() {
    log_info "Setting up directory structure..."
    
    # Create certificates directory structure
    mkdir -p "${CA_DIR}"
    mkdir -p "${CERTS_DIR}/server"
    mkdir -p "${CERTS_DIR}/clients"
    mkdir -p "${CERTS_DIR}/backup"
    
    # Set proper permissions
    chmod 755 "${CERTS_DIR}"
    chmod 700 "${CA_DIR}"
    
    log_success "Directory structure created"
}

# Function to create CA configuration file
create_ca_config() {
    log_info "Creating CA configuration file..."
    
    cat > "${CA_CONFIG_FILE}" << EOF
# OBEDIO Root CA Configuration File
[ req ]
default_bits = ${CA_KEY_SIZE}
prompt = no
distinguished_name = req_distinguished_name
x509_extensions = v3_ca

[ req_distinguished_name ]
C = US
O = OBEDIO
CN = OBEDIO Root CA

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical,CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = obedio-ca
DNS.2 = ca.obedio.local
EOF

    log_success "CA configuration file created"
}

# Function to generate CA private key
generate_ca_key() {
    log_info "Generating CA private key (${CA_KEY_SIZE} bits)..."
    
    # Check if CA key already exists
    if [[ -f "${CA_KEY_FILE}" ]]; then
        log_warning "CA private key already exists at ${CA_KEY_FILE}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing CA private key"
            return 0
        fi
        
        # Backup existing key
        backup_file="${CERTS_DIR}/backup/ca.key.backup.$(date +%Y%m%d_%H%M%S)"
        cp "${CA_KEY_FILE}" "${backup_file}"
        log_info "Backed up existing CA key to ${backup_file}"
    fi
    
    # Generate new CA private key
    openssl genrsa -out "${CA_KEY_FILE}" "${CA_KEY_SIZE}"
    
    # Set strict permissions on private key
    chmod 600 "${CA_KEY_FILE}"
    
    log_success "CA private key generated successfully"
}

# Function to generate CA certificate
generate_ca_cert() {
    log_info "Generating CA certificate (valid for ${CA_VALIDITY_DAYS} days)..."
    
    # Check if CA certificate already exists
    if [[ -f "${CA_CERT_FILE}" ]]; then
        log_warning "CA certificate already exists at ${CA_CERT_FILE}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing CA certificate"
            return 0
        fi
        
        # Backup existing certificate
        backup_file="${CERTS_DIR}/backup/ca.crt.backup.$(date +%Y%m%d_%H%M%S)"
        cp "${CA_CERT_FILE}" "${backup_file}"
        log_info "Backed up existing CA certificate to ${backup_file}"
    fi
    
    # Generate CA certificate
    openssl req -new -x509 \
        -key "${CA_KEY_FILE}" \
        -out "${CA_CERT_FILE}" \
        -days "${CA_VALIDITY_DAYS}" \
        -config "${CA_CONFIG_FILE}" \
        -extensions v3_ca
    
    # Set appropriate permissions
    chmod 644 "${CA_CERT_FILE}"
    
    log_success "CA certificate generated successfully"
}

# Function to verify CA certificate
verify_ca_cert() {
    log_info "Verifying CA certificate..."
    
    # Verify certificate
    if openssl x509 -in "${CA_CERT_FILE}" -text -noout > /dev/null 2>&1; then
        log_success "CA certificate is valid"
        
        # Display certificate details
        echo
        log_info "CA Certificate Details:"
        echo "----------------------------------------"
        openssl x509 -in "${CA_CERT_FILE}" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|Public Key:|Signature Algorithm:)"
        echo "----------------------------------------"
        
        # Display certificate fingerprint
        fingerprint=$(openssl x509 -in "${CA_CERT_FILE}" -fingerprint -sha256 -noout | cut -d'=' -f2)
        echo "SHA256 Fingerprint: ${fingerprint}"
        echo
    else
        log_error "CA certificate verification failed"
        exit 1
    fi
}

# Function to copy CA certificate to Mosquitto directory
setup_mosquitto_ca() {
    log_info "Setting up CA certificate for Mosquitto..."
    
    # Copy CA certificate to main certificates directory
    cp "${CA_CERT_FILE}" "${CERTS_DIR}/ca.crt"
    chmod 644 "${CERTS_DIR}/ca.crt"
    
    log_success "CA certificate copied to ${CERTS_DIR}/ca.crt"
}

# Function to create certificate database files
create_cert_db() {
    log_info "Creating certificate database files..."
    
    # Create certificate database files for tracking issued certificates
    touch "${CA_DIR}/index.txt"
    echo "01" > "${CA_DIR}/serial"
    echo "01" > "${CA_DIR}/crlnumber"
    
    log_success "Certificate database files created"
}

# Function to display next steps
show_next_steps() {
    echo
    log_success "🎉 CA generation completed successfully!"
    echo
    echo "Generated files:"
    echo "  - CA Private Key: ${CA_KEY_FILE}"
    echo "  - CA Certificate: ${CA_CERT_FILE}"
    echo "  - CA Config:      ${CA_CONFIG_FILE}"
    echo "  - Mosquitto CA:   ${CERTS_DIR}/ca.crt"
    echo
    echo "Next steps:"
    echo "  1. Generate server certificates using: ./scripts/generate-server-cert.sh"
    echo "  2. Generate client certificates using: ./scripts/generate-client-cert.sh <device-id>"
    echo "  3. Start the MQTT system with: docker-compose -f docker-compose.mqtt.yml up -d"
    echo
    echo "⚠️  SECURITY NOTES:"
    echo "  - Keep the CA private key (${CA_KEY_FILE}) secure and backed up"
    echo "  - The CA certificate is valid for ${CA_VALIDITY_DAYS} days"
    echo "  - Use proper file permissions in production environments"
    echo
}

# Main execution
main() {
    echo "============================================="
    echo "OBEDIO MQTT Certificate Authority Generator"
    echo "============================================="
    echo
    
    # Check prerequisites
    check_openssl
    
    # Setup environment
    setup_directories
    create_ca_config
    
    # Generate CA
    generate_ca_key
    generate_ca_cert
    
    # Setup additional files
    create_cert_db
    setup_mosquitto_ca
    
    # Verify and display results
    verify_ca_cert
    show_next_steps
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi