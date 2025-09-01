#!/bin/bash
# =================================================================
# OBEDIO MQTT Services - Stop Script
# =================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.mqtt.yml"
PROJECT_NAME="obedio-mqtt"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}        OBEDIO MQTT Monitor & Control System - Shutdown${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    print_status "Docker is running"
}

# Check if services are running
check_services() {
    if ! docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q >/dev/null 2>&1; then
        print_warning "No MQTT services appear to be running"
        return 1
    fi
    return 0
}

# Graceful shutdown
graceful_shutdown() {
    print_status "Performing graceful shutdown of MQTT services..."
    
    # Stop services in reverse dependency order
    local services=("mqtt-admin-api" "mosquitto" "redis" "postgresql")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps "$service" | grep -q "Up"; then
            print_status "Stopping service: $service"
            docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop "$service"
        else
            print_warning "Service $service is not running"
        fi
    done
}

# Force shutdown
force_shutdown() {
    print_warning "Performing force shutdown of MQTT services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --timeout 30
}

# Clean shutdown (removes containers but keeps volumes)
clean_shutdown() {
    print_status "Performing clean shutdown (removing containers)..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans
}

# Display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -f, --force     Force stop all services immediately"
    echo "  -c, --clean     Clean stop (remove containers but keep volumes)"
    echo "  -h, --help      Show this help message"
    echo
    echo "Default behavior: Graceful shutdown"
}

# Main function
main() {
    local force=false
    local clean=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                force=true
                shift
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Pre-flight checks
    check_docker
    
    if ! check_services; then
        print_status "No services to stop"
        exit 0
    fi
    
    # Show current status
    print_status "Current service status:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    echo
    
    # Perform shutdown based on options
    if [ "$force" = true ]; then
        force_shutdown
    elif [ "$clean" = true ]; then
        clean_shutdown
    else
        graceful_shutdown
    fi
    
    # Verify shutdown
    echo
    print_status "Verifying service shutdown..."
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q | wc -l | grep -q "0"; then
        print_status "All services stopped successfully"
    else
        print_warning "Some services may still be running:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    fi
    
    echo
    print_status "MQTT services shutdown completed"
    
    # Show cleanup commands
    echo
    echo -e "${BLUE}=== Cleanup Commands ===${NC}"
    echo -e "Remove all containers:    ${YELLOW}./scripts/stop-mqtt-services.sh --clean${NC}"
    echo -e "Remove volumes (data):    ${YELLOW}./scripts/reset-mqtt-services.sh${NC}"
    echo -e "View remaining services:  ${YELLOW}docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps${NC}"
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"