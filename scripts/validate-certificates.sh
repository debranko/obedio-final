#!/bin/bash

# =================================================================
# OBEDIO MQTT Certificate Validation and Management Script
# This script validates certificates, checks expiration, and provides utilities
# =================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="${PROJECT_ROOT}/docker/certificates"
CA_DIR="${CERTS_DIR}/ca"
SERVER_DIR="${CERTS_DIR}/server"
CLIENTS_DIR="${CERTS_DIR}/clients"

# Certificate files
CA_CERT_FILE="${CA_DIR}/ca.crt"
CA_KEY_FILE="${CA_DIR}/ca.key"
SERVER_CERT_FILE="${CERTS_DIR}/server.crt"
SERVER_KEY_FILE="${CERTS_DIR}/server.key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_header() {
    echo -e "${CYAN}[SECTION]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  validate       Validate all certificates (default)"
    echo "  check-expiry   Check certificate expiration dates"
    echo "  verify-chain   Verify certificate chains"
    echo "  list-certs     List all certificates"
    echo "  test-server    Test server certificate configuration"
    echo "  test-client    Test client certificate [device-id]"
    echo "  cleanup        Clean up expired certificates"
    echo "  info           Show detailed certificate information"
    echo "  help           Show this help message"
    echo
    echo "Options:"
    echo "  --verbose      Enable verbose output"
    echo "  --json         Output in JSON format (where applicable)"
    echo "  --days N       Check for certificates expiring in N days (default: 30)"
    echo
    echo "Examples:"
    echo "  $0                           # Validate all certificates"
    echo "  $0 check-expiry --days 7     # Check for certs expiring in 7 days"
    echo "  $0 test-client button-001    # Test specific client certificate"
    echo "  $0 info --json               # Get certificate info in JSON format"
    echo
}

# Function to check if OpenSSL is available
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi
}

# Function to check if certificate exists
check_cert_exists() {
    local cert_file="$1"
    local cert_name="$2"
    
    if [[ ! -f "$cert_file" ]]; then
        log_error "$cert_name certificate not found at $cert_file"
        return 1
    fi
    return 0
}

# Function to get certificate expiration date
get_cert_expiry() {
    local cert_file="$1"
    
    if [[ ! -f "$cert_file" ]]; then
        echo "FILE_NOT_FOUND"
        return 1
    fi
    
    openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d'=' -f2
}

# Function to get certificate expiration in days
get_cert_expiry_days() {
    local cert_file="$1"
    
    if [[ ! -f "$cert_file" ]]; then
        echo "-1"
        return 1
    fi
    
    local expiry_date
    expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d'=' -f2)
    
    if [[ -z "$expiry_date" ]]; then
        echo "-1"
        return 1
    fi
    
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    local current_epoch
    current_epoch=$(date +%s)
    
    local days_remaining
    days_remaining=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "$days_remaining"
}

# Function to validate a single certificate
validate_certificate() {
    local cert_file="$1"
    local cert_name="$2"
    local ca_file="${3:-}"
    
    log_info "Validating $cert_name certificate..."
    
    # Check if certificate file exists
    if ! check_cert_exists "$cert_file" "$cert_name"; then
        return 1
    fi
    
    # Verify certificate format
    if ! openssl x509 -in "$cert_file" -text -noout >/dev/null 2>&1; then
        log_error "$cert_name certificate is corrupted or invalid format"
        return 1
    fi
    
    # Check expiration
    local days_remaining
    days_remaining=$(get_cert_expiry_days "$cert_file")
    
    if [[ "$days_remaining" -lt 0 ]]; then
        log_error "$cert_name certificate has expired"
        return 1
    elif [[ "$days_remaining" -lt 30 ]]; then
        log_warning "$cert_name certificate expires in $days_remaining days"
    else
        log_success "$cert_name certificate is valid (expires in $days_remaining days)"
    fi
    
    # Verify against CA if provided
    if [[ -n "$ca_file" && -f "$ca_file" ]]; then
        if openssl verify -CAfile "$ca_file" "$cert_file" >/dev/null 2>&1; then
            log_success "$cert_name certificate chain verification passed"
        else
            log_error "$cert_name certificate chain verification failed"
            return 1
        fi
    fi
    
    return 0
}

# Function to validate CA certificate
validate_ca_certificate() {
    log_header "Validating Certificate Authority"
    
    local ca_valid=true
    
    # Validate CA certificate
    if ! validate_certificate "$CA_CERT_FILE" "CA"; then
        ca_valid=false
    fi
    
    # Check if CA private key exists and matches
    if [[ -f "$CA_KEY_FILE" ]]; then
        if [[ -f "$CA_CERT_FILE" ]]; then
            local ca_cert_modulus ca_key_modulus
            ca_cert_modulus=$(openssl x509 -noout -modulus -in "$CA_CERT_FILE" 2>/dev/null | openssl md5)
            ca_key_modulus=$(openssl rsa -noout -modulus -in "$CA_KEY_FILE" 2>/dev/null | openssl md5)
            
            if [[ "$ca_cert_modulus" == "$ca_key_modulus" ]]; then
                log_success "CA certificate and private key match"
            else
                log_error "CA certificate and private key do not match"
                ca_valid=false
            fi
        fi
    else
        log_warning "CA private key not found"
    fi
    
    return $([[ "$ca_valid" == "true" ]] && echo 0 || echo 1)
}

# Function to validate server certificate
validate_server_certificate() {
    log_header "Validating Server Certificate"
    
    local server_valid=true
    
    # Validate server certificate
    if ! validate_certificate "$SERVER_CERT_FILE" "Server" "$CA_CERT_FILE"; then
        server_valid=false
    fi
    
    # Check if server private key exists and matches
    if [[ -f "$SERVER_KEY_FILE" ]]; then
        if [[ -f "$SERVER_CERT_FILE" ]]; then
            local server_cert_modulus server_key_modulus
            server_cert_modulus=$(openssl x509 -noout -modulus -in "$SERVER_CERT_FILE" 2>/dev/null | openssl md5)
            server_key_modulus=$(openssl rsa -noout -modulus -in "$SERVER_KEY_FILE" 2>/dev/null | openssl md5)
            
            if [[ "$server_cert_modulus" == "$server_key_modulus" ]]; then
                log_success "Server certificate and private key match"
            else
                log_error "Server certificate and private key do not match"
                server_valid=false
            fi
        fi
    else
        log_warning "Server private key not found"
    fi
    
    return $([[ "$server_valid" == "true" ]] && echo 0 || echo 1)
}

# Function to validate client certificates
validate_client_certificates() {
    log_header "Validating Client Certificates"
    
    if [[ ! -d "$CLIENTS_DIR" ]]; then
        log_warning "No client certificates directory found"
        return 0
    fi
    
    local client_count=0
    local valid_clients=0
    
    for client_dir in "$CLIENTS_DIR"/*; do
        if [[ -d "$client_dir" ]]; then
            local device_id
            device_id=$(basename "$client_dir")
            local cert_file="$client_dir/$device_id.crt"
            local key_file="$client_dir/$device_id.key"
            
            ((client_count++))
            
            log_info "Validating client certificate for $device_id..."
            
            local client_valid=true
            
            # Validate client certificate
            if ! validate_certificate "$cert_file" "Client ($device_id)" "$CA_CERT_FILE"; then
                client_valid=false
            fi
            
            # Check if client private key exists and matches
            if [[ -f "$key_file" ]]; then
                if [[ -f "$cert_file" ]]; then
                    local client_cert_modulus client_key_modulus
                    client_cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" 2>/dev/null | openssl md5)
                    client_key_modulus=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5)
                    
                    if [[ "$client_cert_modulus" == "$client_key_modulus" ]]; then
                        log_success "Client certificate and private key match for $device_id"
                    else
                        log_error "Client certificate and private key do not match for $device_id"
                        client_valid=false
                    fi
                fi
            else
                log_warning "Client private key not found for $device_id"
            fi
            
            if [[ "$client_valid" == "true" ]]; then
                ((valid_clients++))
            fi
        fi
    done
    
    log_info "Client certificate validation summary: $valid_clients/$client_count certificates valid"
    
    return $([[ "$valid_clients" -eq "$client_count" ]] && echo 0 || echo 1)
}

# Function to check certificate expiration
check_certificate_expiry() {
    local warning_days="${1:-30}"
    
    log_header "Checking Certificate Expiration (warning threshold: $warning_days days)"
    
    local expiring_certs=()
    local expired_certs=()
    
    # Check CA certificate
    if [[ -f "$CA_CERT_FILE" ]]; then
        local days_remaining
        days_remaining=$(get_cert_expiry_days "$CA_CERT_FILE")
        
        if [[ "$days_remaining" -lt 0 ]]; then
            expired_certs+=("CA")
            log_error "CA certificate has EXPIRED"
        elif [[ "$days_remaining" -le "$warning_days" ]]; then
            expiring_certs+=("CA ($days_remaining days)")
            log_warning "CA certificate expires in $days_remaining days"
        else
            log_success "CA certificate is valid (expires in $days_remaining days)"
        fi
    fi
    
    # Check server certificate
    if [[ -f "$SERVER_CERT_FILE" ]]; then
        local days_remaining
        days_remaining=$(get_cert_expiry_days "$SERVER_CERT_FILE")
        
        if [[ "$days_remaining" -lt 0 ]]; then
            expired_certs+=("Server")
            log_error "Server certificate has EXPIRED"
        elif [[ "$days_remaining" -le "$warning_days" ]]; then
            expiring_certs+=("Server ($days_remaining days)")
            log_warning "Server certificate expires in $days_remaining days"
        else
            log_success "Server certificate is valid (expires in $days_remaining days)"
        fi
    fi
    
    # Check client certificates
    if [[ -d "$CLIENTS_DIR" ]]; then
        for client_dir in "$CLIENTS_DIR"/*; do
            if [[ -d "$client_dir" ]]; then
                local device_id
                device_id=$(basename "$client_dir")
                local cert_file="$client_dir/$device_id.crt"
                
                if [[ -f "$cert_file" ]]; then
                    local days_remaining
                    days_remaining=$(get_cert_expiry_days "$cert_file")
                    
                    if [[ "$days_remaining" -lt 0 ]]; then
                        expired_certs+=("Client ($device_id)")
                        log_error "Client certificate for $device_id has EXPIRED"
                    elif [[ "$days_remaining" -le "$warning_days" ]]; then
                        expiring_certs+=("Client $device_id ($days_remaining days)")
                        log_warning "Client certificate for $device_id expires in $days_remaining days"
                    else
                        log_success "Client certificate for $device_id is valid (expires in $days_remaining days)"
                    fi
                fi
            fi
        done
    fi
    
    # Summary
    echo
    if [[ ${#expired_certs[@]} -gt 0 ]]; then
        log_error "EXPIRED certificates found: ${expired_certs[*]}"
    fi
    
    if [[ ${#expiring_certs[@]} -gt 0 ]]; then
        log_warning "Certificates expiring soon: ${expiring_certs[*]}"
    fi
    
    if [[ ${#expired_certs[@]} -eq 0 && ${#expiring_certs[@]} -eq 0 ]]; then
        log_success "All certificates are valid and not expiring soon"
    fi
}

# Function to list all certificates
list_certificates() {
    local json_output="${1:-false}"
    
    log_header "Certificate Inventory"
    
    if [[ "$json_output" == "true" ]]; then
        echo "{"
        echo '  "certificates": ['
        
        local first=true
        
        # CA Certificate
        if [[ -f "$CA_CERT_FILE" ]]; then
            [[ "$first" == "false" ]] && echo ","
            echo -n '    {"type": "ca", "path": "'$CA_CERT_FILE'", "days_remaining": '$(get_cert_expiry_days "$CA_CERT_FILE")'}'
            first=false
        fi
        
        # Server Certificate
        if [[ -f "$SERVER_CERT_FILE" ]]; then
            [[ "$first" == "false" ]] && echo ","
            echo -n '    {"type": "server", "path": "'$SERVER_CERT_FILE'", "days_remaining": '$(get_cert_expiry_days "$SERVER_CERT_FILE")'}'
            first=false
        fi
        
        # Client Certificates
        if [[ -d "$CLIENTS_DIR" ]]; then
            for client_dir in "$CLIENTS_DIR"/*; do
                if [[ -d "$client_dir" ]]; then
                    local device_id
                    device_id=$(basename "$client_dir")
                    local cert_file="$client_dir/$device_id.crt"
                    
                    if [[ -f "$cert_file" ]]; then
                        [[ "$first" == "false" ]] && echo ","
                        echo -n '    {"type": "client", "device_id": "'$device_id'", "path": "'$cert_file'", "days_remaining": '$(get_cert_expiry_days "$cert_file")'}'
                        first=false
                    fi
                fi
            done
        fi
        
        echo
        echo '  ]'
        echo "}"
    else
        printf "%-15s %-20s %-15s %s\n" "TYPE" "IDENTIFIER" "DAYS_REMAINING" "PATH"
        echo "=================================================================================="
        
        # CA Certificate
        if [[ -f "$CA_CERT_FILE" ]]; then
            local days_remaining
            days_remaining=$(get_cert_expiry_days "$CA_CERT_FILE")
            printf "%-15s %-20s %-15s %s\n" "CA" "root-ca" "$days_remaining" "$CA_CERT_FILE"
        fi
        
        # Server Certificate
        if [[ -f "$SERVER_CERT_FILE" ]]; then
            local days_remaining
            days_remaining=$(get_cert_expiry_days "$SERVER_CERT_FILE")
            printf "%-15s %-20s %-15s %s\n" "Server" "mosquitto" "$days_remaining" "$SERVER_CERT_FILE"
        fi
        
        # Client Certificates
        if [[ -d "$CLIENTS_DIR" ]]; then
            for client_dir in "$CLIENTS_DIR"/*; do
                if [[ -d "$client_dir" ]]; then
                    local device_id
                    device_id=$(basename "$client_dir")
                    local cert_file="$client_dir/$device_id.crt"
                    
                    if [[ -f "$cert_file" ]]; then
                        local days_remaining
                        days_remaining=$(get_cert_expiry_days "$cert_file")
                        printf "%-15s %-20s %-15s %s\n" "Client" "$device_id" "$days_remaining" "$cert_file"
                    fi
                fi
            done
        fi
    fi
}

# Function to test server certificate
test_server_certificate() {
    log_header "Testing Server Certificate Configuration"
    
    # Check if Docker is running and Mosquitto is accessible
    if command -v docker >/dev/null 2>&1 && docker ps | grep -q obedio-mosquitto; then
        log_info "Testing TLS connection to Mosquitto broker..."
        
        if timeout 5 openssl s_client -connect localhost:8883 -CAfile "$CA_CERT_FILE" -verify_return_error < /dev/null >/dev/null 2>&1; then
            log_success "TLS connection to Mosquitto broker successful"
        else
            log_error "TLS connection to Mosquitto broker failed"
            log_info "Ensure Mosquitto is running with: docker-compose -f docker-compose.mqtt.yml up -d"
        fi
    else
        log_warning "Mosquitto broker is not running - skipping connection test"
        log_info "Start Mosquitto with: docker-compose -f docker-compose.mqtt.yml up -d"
    fi
    
    # Validate certificate files
    validate_server_certificate
}

# Function to test client certificate
test_client_certificate() {
    local device_id="$1"
    
    if [[ -z "$device_id" ]]; then
        log_error "Device ID is required for client certificate testing"
        return 1
    fi
    
    log_header "Testing Client Certificate for $device_id"
    
    local client_dir="$CLIENTS_DIR/$device_id"
    local cert_file="$client_dir/$device_id.crt"
    local key_file="$client_dir/$device_id.key"
    
    # Validate certificate files
    if ! validate_certificate "$cert_file" "Client ($device_id)" "$CA_CERT_FILE"; then
        return 1
    fi
    
    # Check if Docker is running and Mosquitto is accessible
    if command -v docker >/dev/null 2>&1 && docker ps | grep -q obedio-mosquitto; then
        log_info "Testing TLS client authentication to Mosquitto broker..."
        
        if timeout 5 openssl s_client -connect localhost:8883 \
            -CAfile "$CA_CERT_FILE" \
            -cert "$cert_file" \
            -key "$key_file" \
            -verify_return_error < /dev/null >/dev/null 2>&1; then
            log_success "TLS client authentication successful for $device_id"
        else
            log_error "TLS client authentication failed for $device_id"
        fi
    else
        log_warning "Mosquitto broker is not running - skipping connection test"
    fi
}

# Function to cleanup expired certificates
cleanup_expired_certificates() {
    log_header "Cleaning Up Expired Certificates"
    
    local cleanup_count=0
    
    if [[ -d "$CLIENTS_DIR" ]]; then
        for client_dir in "$CLIENTS_DIR"/*; do
            if [[ -d "$client_dir" ]]; then
                local device_id
                device_id=$(basename "$client_dir")
                local cert_file="$client_dir/$device_id.crt"
                
                if [[ -f "$cert_file" ]]; then
                    local days_remaining
                    days_remaining=$(get_cert_expiry_days "$cert_file")
                    
                    if [[ "$days_remaining" -lt 0 ]]; then
                        log_warning "Moving expired certificate for $device_id to backup"
                        
                        local backup_dir="$CERTS_DIR/backup/expired/$(date +%Y%m%d)"
                        mkdir -p "$backup_dir"
                        
                        mv "$client_dir" "$backup_dir/"
                        log_info "Moved $client_dir to $backup_dir/"
                        
                        ((cleanup_count++))
                    fi
                fi
            fi
        done
    fi
    
    if [[ "$cleanup_count" -eq 0 ]]; then
        log_success "No expired certificates found to clean up"
    else
        log_success "Cleaned up $cleanup_count expired certificates"
    fi
}

# Function to show detailed certificate information
show_certificate_info() {
    local json_output="${1:-false}"
    
    log_header "Detailed Certificate Information"
    
    if [[ "$json_output" == "true" ]]; then
        echo "{"
        echo '  "ca": {'
        
        if [[ -f "$CA_CERT_FILE" ]]; then
            echo '    "exists": true,'
            echo '    "subject": "'$(openssl x509 -in "$CA_CERT_FILE" -noout -subject 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "issuer": "'$(openssl x509 -in "$CA_CERT_FILE" -noout -issuer 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "serial": "'$(openssl x509 -in "$CA_CERT_FILE" -noout -serial 2>/dev/null | cut -d'=' -f2)'",'
            echo '    "not_before": "'$(openssl x509 -in "$CA_CERT_FILE" -noout -startdate 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "not_after": "'$(openssl x509 -in "$CA_CERT_FILE" -noout -enddate 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "days_remaining": '$(get_cert_expiry_days "$CA_CERT_FILE")
        else
            echo '    "exists": false'
        fi
        
        echo '  },'
        echo '  "server": {'
        
        if [[ -f "$SERVER_CERT_FILE" ]]; then
            echo '    "exists": true,'
            echo '    "subject": "'$(openssl x509 -in "$SERVER_CERT_FILE" -noout -subject 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "issuer": "'$(openssl x509 -in "$SERVER_CERT_FILE" -noout -issuer 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "serial": "'$(openssl x509 -in "$SERVER_CERT_FILE" -noout -serial 2>/dev/null | cut -d'=' -f2)'",'
            echo '    "not_before": "'$(openssl x509 -in "$SERVER_CERT_FILE" -noout -startdate 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "not_after": "'$(openssl x509 -in "$SERVER_CERT_FILE" -noout -enddate 2>/dev/null | cut -d'=' -f2-)'",'
            echo '    "days_remaining": '$(get_cert_expiry_days "$SERVER_CERT_FILE")
        else
            echo '    "exists": false'
        fi
        
        echo '  }'
        echo "}"
    else
        # CA Certificate
        echo "Certificate Authority (CA):"
        echo "=========================="
        if [[ -f "$CA_CERT_FILE" ]]; then
            openssl x509 -in "$CA_CERT_FILE" -text -noout | head -20
        else
            echo "CA certificate not found"
        fi
        
        echo
        echo "Server Certificate:"
        echo "=================="
        if [[ -f "$SERVER_CERT_FILE" ]]; then
            openssl x509 -in "$SERVER_CERT_FILE" -text -noout | head -20
        else
            echo "Server certificate not found"
        fi
    fi
}

# Main function to validate all certificates
validate_all_certificates() {
    log_header "OBEDIO MQTT Certificate Validation"
    
    local overall_status=0
    
    # Validate CA
    if ! validate_ca_certificate; then
        overall_status=1
    fi
    
    echo
    
    # Validate Server
    if ! validate_server_certificate; then
        overall_status=1
    fi
    
    echo
    
    # Validate Clients
    if ! validate_client_certificates; then
        overall_status=1
    fi
    
    echo
    log_header "Validation Summary"
    
    if [[ "$overall_status" -eq 0 ]]; then
        log_success "All certificates are valid and properly configured"
    else
        log_error "Certificate validation failed - please check the errors above"
    fi
    
    return $overall_status
}

# Main execution
main() {
    local command="${1:-validate}"
    local verbose=false
    local json_output=false
    local warning_days=30
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                verbose=true
                shift
                ;;
            --json)
                json_output=true
                shift
                ;;
            --days)
                warning_days="$2"
                shift 2
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Check prerequisites
    check_openssl
    
    # Execute command
    case "$command" in
        "validate")
            validate_all_certificates
            ;;
        "check-expiry")
            check_certificate_expiry "$warning_days"
            ;;
        "verify-chain")
            validate_ca_certificate
            validate_server_certificate
            validate_client_certificates
            ;;
        "list-certs")
            list_certificates "$json_output"
            ;;
        "test-server")
            test_server_certificate
            ;;
        "test-client")
            if [[ -n "${2:-}" ]]; then
                test_client_certificate "$2"
            else
                log_error "Device ID required for test-client command"
                show_usage
                exit 1
            fi
            ;;
        "cleanup")
            cleanup_expired_certificates
            ;;
        "info")
            show_certificate_info "$json_output"
            ;;
        "help")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi