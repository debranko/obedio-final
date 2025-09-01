#!/bin/bash
# =================================================================
# OBEDIO MQTT Services - Logs Viewer Script
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
echo -e "${BLUE}        OBEDIO MQTT Monitor & Control System - Logs Viewer${NC}"
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

# Display usage
usage() {
    echo "Usage: $0 [OPTIONS] [SERVICE]"
    echo
    echo "Services:"
    echo "  postgresql      PostgreSQL database logs"
    echo "  redis           Redis cache logs"
    echo "  mosquitto       MQTT broker logs"
    echo "  mqtt-admin-api  MQTT Admin API logs"
    echo "  all             All services (default)"
    echo
    echo "Options:"
    echo "  -f, --follow    Follow log output (like tail -f)"
    echo "  -t, --tail N    Show last N lines (default: 100)"
    echo "  -s, --since T   Show logs since timestamp (e.g., '1h', '30m', '2024-01-01')"
    echo "  --no-color      Disable colored output"
    echo "  -h, --help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0                          # Show last 100 lines from all services"
    echo "  $0 -f mosquitto             # Follow MQTT broker logs"
    echo "  $0 -t 50 mqtt-admin-api     # Show last 50 lines from API"
    echo "  $0 --since 1h               # Show logs from last hour"
}

# Check if services are running
check_services() {
    if ! docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q >/dev/null 2>&1; then
        print_error "No MQTT services appear to be running"
        exit 1
    fi
}

# View logs for a specific service
view_service_logs() {
    local service=$1
    local follow=$2
    local tail_lines=$3
    local since=$4
    local no_color=$5
    
    local docker_args=""
    
    # Build docker-compose logs arguments
    if [ "$follow" = true ]; then
        docker_args="$docker_args -f"
    fi
    
    if [ -n "$tail_lines" ]; then
        docker_args="$docker_args --tail=$tail_lines"
    fi
    
    if [ -n "$since" ]; then
        docker_args="$docker_args --since=$since"
    fi
    
    if [ "$no_color" = true ]; then
        docker_args="$docker_args --no-color"
    fi
    
    print_status "Viewing logs for service: $service"
    print_status "Press Ctrl+C to stop following logs"
    echo
    
    # Execute docker-compose logs
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs $docker_args "$service"
}

# View logs for all services
view_all_logs() {
    local follow=$1
    local tail_lines=$2
    local since=$3
    local no_color=$4
    
    local docker_args=""
    
    # Build docker-compose logs arguments
    if [ "$follow" = true ]; then
        docker_args="$docker_args -f"
    fi
    
    if [ -n "$tail_lines" ]; then
        docker_args="$docker_args --tail=$tail_lines"
    fi
    
    if [ -n "$since" ]; then
        docker_args="$docker_args --since=$since"
    fi
    
    if [ "$no_color" = true ]; then
        docker_args="$docker_args --no-color"
    fi
    
    print_status "Viewing logs for all services"
    print_status "Press Ctrl+C to stop following logs"
    echo
    
    # Execute docker-compose logs for all services
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs $docker_args
}

# Main function
main() {
    local service=""
    local follow=false
    local tail_lines="100"
    local since=""
    local no_color=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                follow=true
                shift
                ;;
            -t|--tail)
                tail_lines="$2"
                shift 2
                ;;
            -s|--since)
                since="$2"
                shift 2
                ;;
            --no-color)
                no_color=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            postgresql|redis|mosquitto|mqtt-admin-api|all)
                service="$1"
                shift
                ;;
            *)
                print_error "Unknown option or service: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Default to all services if none specified
    if [ -z "$service" ]; then
        service="all"
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if services are running
    check_services
    
    # View logs based on service selection
    if [ "$service" = "all" ]; then
        view_all_logs "$follow" "$tail_lines" "$since" "$no_color"
    else
        # Validate service name
        case $service in
            postgresql|redis|mosquitto|mqtt-admin-api)
                view_service_logs "$service" "$follow" "$tail_lines" "$since" "$no_color"
                ;;
            *)
                print_error "Invalid service name: $service"
                print_error "Valid services: postgresql, redis, mosquitto, mqtt-admin-api, all"
                exit 1
                ;;
        esac
    fi
}

# Handle script interruption
trap 'echo; print_status "Log viewing stopped"; exit 0' INT TERM

# Run main function
main "$@"