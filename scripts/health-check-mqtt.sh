#!/bin/bash
# =================================================================
# OBEDIO MQTT Services - Health Check Script
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
echo -e "${BLUE}        OBEDIO MQTT Monitor & Control System - Health Check${NC}"
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
    echo -e "${GREEN}[OK]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        return 1
    fi
    print_success "Docker is running"
    return 0
}

# Check service container status
check_container_status() {
    local service=$1
    local container_status
    
    container_status=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q "$service" 2>/dev/null)
    
    if [ -z "$container_status" ]; then
        print_error "Service $service: Container not found"
        return 1
    fi
    
    local running_status
    running_status=$(docker inspect --format='{{.State.Status}}' "$container_status" 2>/dev/null)
    
    if [ "$running_status" = "running" ]; then
        print_success "Service $service: Container running"
        return 0
    else
        print_error "Service $service: Container status is $running_status"
        return 1
    fi
}

# Check service health
check_service_health() {
    local service=$1
    local health_status
    
    container_id=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q "$service" 2>/dev/null)
    
    if [ -z "$container_id" ]; then
        print_error "Service $service: No container found"
        return 1
    fi
    
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no-healthcheck")
    
    case $health_status in
        "healthy")
            print_success "Service $service: Health check passed"
            return 0
            ;;
        "unhealthy")
            print_error "Service $service: Health check failed"
            return 1
            ;;
        "starting")
            print_warning "Service $service: Health check starting"
            return 1
            ;;
        "no-healthcheck")
            print_warning "Service $service: No health check configured"
            return 0
            ;;
        *)
            print_error "Service $service: Unknown health status: $health_status"
            return 1
            ;;
    esac
}

# Test PostgreSQL connection
test_postgresql() {
    print_status "Testing PostgreSQL connection..."
    
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T postgresql pg_isready -U obedio_user -d obedio >/dev/null 2>&1; then
        print_success "PostgreSQL: Connection successful"
        return 0
    else
        print_error "PostgreSQL: Connection failed"
        return 1
    fi
}

# Test Redis connection
test_redis() {
    print_status "Testing Redis connection..."
    
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis: Connection successful"
        return 0
    else
        print_error "Redis: Connection failed"
        return 1
    fi
}

# Test MQTT broker
test_mosquitto() {
    print_status "Testing MQTT broker..."
    
    # Test basic connection
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T mosquitto mosquitto_sub -t '$SYS/broker/uptime' -C 1 -W 5 >/dev/null 2>&1; then
        print_success "MQTT Broker: Basic connection successful"
    else
        print_error "MQTT Broker: Basic connection failed"
        return 1
    fi
    
    # Test broker stats
    local uptime
    uptime=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T mosquitto mosquitto_sub -t '$SYS/broker/uptime' -C 1 -W 5 2>/dev/null | tr -d '\r' || echo "unknown")
    print_status "MQTT Broker uptime: ${uptime} seconds"
    
    return 0
}

# Test MQTT Admin API
test_mqtt_api() {
    print_status "Testing MQTT Admin API..."
    
    # Test health endpoint
    if curl -f -s "http://localhost:4001/health" >/dev/null 2>&1; then
        print_success "MQTT Admin API: Health endpoint responsive"
        
        # Get API status
        local api_response
        api_response=$(curl -s "http://localhost:4001/health" 2>/dev/null || echo "{'status':'unknown'}")
        print_status "API Health: $api_response"
        return 0
    else
        print_error "MQTT Admin API: Health endpoint not responsive"
        return 1
    fi
}

# Check port connectivity
check_ports() {
    print_status "Checking port connectivity..."
    
    local ports=("1883:MQTT" "8883:MQTT-TLS" "9001:WebSocket" "5432:PostgreSQL" "6379:Redis" "4001:API")
    
    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d':' -f1)
        local service=$(echo "$port_info" | cut -d':' -f2)
        
        if nc -z localhost "$port" 2>/dev/null; then
            print_success "Port $port ($service): Accessible"
        else
            print_error "Port $port ($service): Not accessible"
        fi
    done
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local volume_dirs=("docker/volumes/postgres" "docker/volumes/redis" "docker/volumes/mosquitto")
    
    for dir in "${volume_dirs[@]}"; do
        if [ -d "$dir" ]; then
            local usage
            usage=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "unknown")
            print_status "Volume $dir: $usage"
        fi
    done
    
    # Check overall disk space
    local disk_usage
    disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        print_error "Disk usage is ${disk_usage}% - consider cleanup"
    elif [ "$disk_usage" -gt 80 ]; then
        print_warning "Disk usage is ${disk_usage}% - monitor space"
    else
        print_success "Disk usage is ${disk_usage}% - healthy"
    fi
}

# Main health check function
main() {
    local overall_status=0
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  -v, --verbose   Show detailed output"
                echo "  -h, --help      Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    print_status "Starting comprehensive health check..."
    echo
    
    # Docker check
    if ! check_docker; then
        overall_status=1
    fi
    
    echo
    print_status "=== Container Status ==="
    
    # Check each service
    services=("postgresql" "redis" "mosquitto" "mqtt-admin-api")
    for service in "${services[@]}"; do
        if ! check_container_status "$service"; then
            overall_status=1
        fi
    done
    
    echo
    print_status "=== Health Checks ==="
    
    # Health checks
    for service in "${services[@]}"; do
        if ! check_service_health "$service"; then
            overall_status=1
        fi
    done
    
    echo
    print_status "=== Service Connectivity ==="
    
    # Service-specific tests
    if ! test_postgresql; then
        overall_status=1
    fi
    
    if ! test_redis; then
        overall_status=1
    fi
    
    if ! test_mosquitto; then
        overall_status=1
    fi
    
    if ! test_mqtt_api; then
        overall_status=1
    fi
    
    echo
    print_status "=== Port Connectivity ==="
    check_ports
    
    if [ "$verbose" = true ]; then
        echo
        print_status "=== Resource Usage ==="
        check_disk_space
        
        echo
        print_status "=== Container Details ==="
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    fi
    
    echo
    echo -e "${BLUE}=== Health Check Summary ===${NC}"
    
    if [ $overall_status -eq 0 ]; then
        print_success "All services are healthy and operational"
        echo -e "System Status: ${GREEN}HEALTHY${NC}"
    else
        print_error "Some services have issues that need attention"
        echo -e "System Status: ${RED}UNHEALTHY${NC}"
        
        echo
        echo -e "${BLUE}=== Troubleshooting Commands ===${NC}"
        echo -e "View logs:        ${YELLOW}./scripts/logs-mqtt-services.sh${NC}"
        echo -e "Restart services: ${YELLOW}./scripts/stop-mqtt-services.sh && ./scripts/start-mqtt-services.sh${NC}"
        echo -e "Reset services:   ${YELLOW}./scripts/reset-mqtt-services.sh${NC}"
    fi
    
    exit $overall_status
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"