#!/bin/bash
# =================================================================
# OBEDIO MQTT Services - Reset Script
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
echo -e "${BLUE}        OBEDIO MQTT Monitor & Control System - Reset${NC}"
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

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "WARNING: This script will completely reset the MQTT infrastructure!"
    echo "All data, logs, and containers will be permanently deleted."
    echo
    echo "Options:"
    echo "  --confirm       Confirm that you want to proceed with the reset"
    echo "  --keep-volumes  Keep volume data (only remove containers and images)"
    echo "  --keep-images   Keep Docker images (only remove containers and volumes)"
    echo "  -h, --help      Show this help message"
    echo
    echo "Reset levels:"
    echo "  Full reset:     Removes containers, volumes, networks, and images"
    echo "  Keep volumes:   Removes containers and images but preserves data"
    echo "  Keep images:    Removes containers and volumes but keeps images"
}

# Confirmation prompt
confirm_reset() {
    local keep_volumes=$1
    local keep_images=$2
    
    echo -e "${RED}WARNING: This will permanently delete:${NC}"
    echo "  - All MQTT service containers"
    
    if [ "$keep_volumes" = false ]; then
        echo "  - All data volumes (PostgreSQL, Redis, Mosquitto data)"
        echo "  - All log files"
    fi
    
    if [ "$keep_images" = false ]; then
        echo "  - Docker images for MQTT services"
    fi
    
    echo "  - Docker networks"
    echo
    echo -e "${YELLOW}This action cannot be undone!${NC}"
    echo
    
    read -p "Are you absolutely sure you want to proceed? (type 'YES' to confirm): " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        print_status "Reset cancelled by user"
        exit 0
    fi
}

# Stop all services
stop_services() {
    print_status "Stopping all MQTT services..."
    
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q >/dev/null 2>&1; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --timeout 30
        print_success "Services stopped"
    else
        print_warning "No services were running"
    fi
}

# Remove containers and networks
remove_containers() {
    print_status "Removing containers and networks..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans
    
    # Remove any dangling containers
    local dangling_containers
    dangling_containers=$(docker ps -a --filter "name=obedio-" --format "{{.ID}}" 2>/dev/null || true)
    
    if [ -n "$dangling_containers" ]; then
        print_status "Removing dangling containers..."
        echo "$dangling_containers" | xargs docker rm -f
    fi
    
    print_success "Containers and networks removed"
}

# Remove volumes
remove_volumes() {
    print_status "Removing data volumes..."
    
    # Remove named volumes
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v
    
    # Remove volume directories
    local volume_dirs=(
        "docker/volumes/postgres"
        "docker/volumes/redis" 
        "docker/volumes/mosquitto/data"
        "docker/volumes/mosquitto/logs"
        "logs"
    )
    
    for dir in "${volume_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_status "Removing directory: $dir"
            rm -rf "$dir"
        fi
    done
    
    # Remove any orphaned volumes
    local orphaned_volumes
    orphaned_volumes=$(docker volume ls --filter "name=${PROJECT_NAME}" --format "{{.Name}}" 2>/dev/null || true)
    
    if [ -n "$orphaned_volumes" ]; then
        print_status "Removing orphaned volumes..."
        echo "$orphaned_volumes" | xargs docker volume rm -f
    fi
    
    print_success "Volumes removed"
}

# Remove images
remove_images() {
    print_status "Removing Docker images..."
    
    # Remove images built for this project
    local project_images
    project_images=$(docker images --filter "label=com.docker.compose.project=${PROJECT_NAME}" --format "{{.ID}}" 2>/dev/null || true)
    
    if [ -n "$project_images" ]; then
        echo "$project_images" | xargs docker rmi -f
    fi
    
    # Remove specific MQTT-related images
    local mqtt_images=(
        "eclipse-mosquitto:2.0.18"
        "postgres:15-alpine"
        "redis:7-alpine"
    )
    
    for image in "${mqtt_images[@]}"; do
        if docker images "$image" --format "{{.ID}}" | grep -q .; then
            print_status "Removing image: $image"
            docker rmi "$image" 2>/dev/null || true
        fi
    done
    
    # Remove built mqtt-admin-api image
    local api_images
    api_images=$(docker images --filter "reference=*mqtt-admin-api*" --format "{{.ID}}" 2>/dev/null || true)
    
    if [ -n "$api_images" ]; then
        echo "$api_images" | xargs docker rmi -f
    fi
    
    print_success "Images removed"
}

# Clean up Docker system
cleanup_docker() {
    print_status "Cleaning up Docker system..."
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove dangling images
    docker image prune -f
    
    print_success "Docker system cleaned"
}

# Recreate directory structure
recreate_structure() {
    print_status "Recreating directory structure..."
    
    # Create essential directories
    mkdir -p docker/volumes/postgres
    mkdir -p docker/volumes/redis
    mkdir -p docker/volumes/mosquitto/data
    mkdir -p docker/volumes/mosquitto/logs
    mkdir -p docker/certificates
    mkdir -p logs
    
    # Set proper permissions
    chmod 755 docker/volumes/mosquitto/data
    chmod 755 docker/volumes/mosquitto/logs
    chmod 700 docker/volumes/postgres
    
    print_success "Directory structure recreated"
}

# Main function
main() {
    local confirmed=false
    local keep_volumes=false
    local keep_images=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --confirm)
                confirmed=true
                shift
                ;;
            --keep-volumes)
                keep_volumes=true
                shift
                ;;
            --keep-images)
                keep_images=true
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
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Require confirmation
    if [ "$confirmed" = false ]; then
        confirm_reset "$keep_volumes" "$keep_images"
    fi
    
    print_status "Starting MQTT infrastructure reset..."
    echo
    
    # Stop services
    stop_services
    
    # Remove containers
    remove_containers
    
    # Remove volumes (unless keeping them)
    if [ "$keep_volumes" = false ]; then
        remove_volumes
    fi
    
    # Remove images (unless keeping them)
    if [ "$keep_images" = false ]; then
        remove_images
    fi
    
    # Clean up Docker system
    cleanup_docker
    
    # Recreate directory structure (if volumes were removed)
    if [ "$keep_volumes" = false ]; then
        recreate_structure
    fi
    
    echo
    print_success "MQTT infrastructure reset completed!"
    
    echo
    echo -e "${BLUE}=== Next Steps ===${NC}"
    echo -e "To restart the infrastructure:"
    echo -e "  ${YELLOW}./scripts/start-mqtt-services.sh${NC}"
    echo
    echo -e "To check status after restart:"
    echo -e "  ${YELLOW}./scripts/health-check-mqtt.sh${NC}"
    
    # Show what was preserved
    if [ "$keep_volumes" = true ]; then
        echo
        print_status "Data volumes were preserved and will be reused"
    fi
    
    if [ "$keep_images" = true ]; then
        echo
        print_status "Docker images were preserved and will be reused"
    fi
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"