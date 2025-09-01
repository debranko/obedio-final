#!/bin/bash
# =================================================================
# OBEDIO MQTT Services - Start Script
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
ENV_FILE=".env.mqtt"
PROJECT_NAME="obedio-mqtt"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}        OBEDIO MQTT Monitor & Control System - Startup${NC}"
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
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Check if docker-compose file exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker compose file '$COMPOSE_FILE' not found"
        exit 1
    fi
    print_status "Found docker-compose file: $COMPOSE_FILE"
}

# Check for environment file
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.mqtt.example" ]; then
            print_warning "Environment file '$ENV_FILE' not found"
            echo -e "Creating $ENV_FILE from .env.mqtt.example..."
            cp .env.mqtt.example "$ENV_FILE"
            print_warning "Please review and update $ENV_FILE with your specific configuration"
        else
            print_error "No environment file found. Please create $ENV_FILE"
            exit 1
        fi
    fi
    print_status "Environment file found: $ENV_FILE"
}

# Create required directories
create_directories() {
    print_status "Creating required directories..."
    
    # Volume directories
    mkdir -p docker/volumes/postgres
    mkdir -p docker/volumes/redis
    mkdir -p docker/volumes/mosquitto/data
    mkdir -p docker/volumes/mosquitto/logs
    
    # Certificate directory
    mkdir -p docker/certificates
    
    # Log directory
    mkdir -p logs
    
    print_status "Directories created successfully"
}

# Set proper permissions
set_permissions() {
    print_status "Setting directory permissions..."
    
    # Set permissions for mosquitto directories
    chmod 755 docker/volumes/mosquitto/data
    chmod 755 docker/volumes/mosquitto/logs
    
    # Set permissions for postgres directory
    chmod 700 docker/volumes/postgres
    
    # Set permissions for certificates
    if [ -d "docker/certificates" ]; then
        chmod 600 docker/certificates/* 2>/dev/null || true
    fi
    
    print_status "Permissions set successfully"
}

# Check service health
check_service_health() {
    local service=$1
    local retries=30
    local count=0
    
    print_status "Checking health of service: $service"
    
    while [ $count -lt $retries ]; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps "$service" | grep -q "healthy\|Up"; then
            print_status "Service $service is healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
        count=$((count + 1))
    done
    
    print_error "Service $service failed to become healthy"
    return 1
}

# Main startup sequence
main() {
    print_status "Starting OBEDIO MQTT services..."
    
    # Pre-flight checks
    check_docker
    check_compose_file
    check_env_file
    create_directories
    set_permissions
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull
    
    # Start services
    print_status "Starting Docker services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    # Wait for services to become healthy
    echo
    print_status "Waiting for services to become healthy..."
    
    # Check each service
    check_service_health "postgresql" || true
    check_service_health "redis" || true
    check_service_health "mosquitto" || true
    check_service_health "mqtt-admin-api" || true
    
    echo
    print_status "Service startup completed!"
    
    # Display service status
    echo
    echo -e "${BLUE}=== Service Status ===${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    
    echo
    echo -e "${BLUE}=== Service URLs ===${NC}"
    echo -e "MQTT Broker (Plain):     ${GREEN}mqtt://localhost:1883${NC}"
    echo -e "MQTT Broker (TLS):       ${GREEN}mqtts://localhost:8883${NC}"
    echo -e "MQTT WebSocket:          ${GREEN}ws://localhost:9001${NC}"
    echo -e "PostgreSQL Database:     ${GREEN}postgresql://localhost:5432/obedio${NC}"
    echo -e "Redis Cache:             ${GREEN}redis://localhost:6379${NC}"
    echo -e "MQTT Admin API:          ${GREEN}http://localhost:4001${NC}"
    echo -e "API Health Check:        ${GREEN}http://localhost:4001/health${NC}"
    
    echo
    echo -e "${BLUE}=== Useful Commands ===${NC}"
    echo -e "View logs:               ${YELLOW}./scripts/logs-mqtt-services.sh${NC}"
    echo -e "Stop services:           ${YELLOW}./scripts/stop-mqtt-services.sh${NC}"
    echo -e "Health check:            ${YELLOW}./scripts/health-check-mqtt.sh${NC}"
    echo -e "Clean reset:             ${YELLOW}./scripts/reset-mqtt-services.sh${NC}"
    
    echo
    print_status "MQTT services are now running!"
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"