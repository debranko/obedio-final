#!/bin/bash
# Docker Deployment Example
# 
# This script demonstrates how to deploy and manage the OBEDIO
# device simulators using Docker Compose.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker and Docker Compose are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

# Setup environment file
setup_environment() {
    log_info "Setting up environment file..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
            log_warning "Please review and update .env file with your configuration"
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    docker-compose build
    
    log_success "Docker images built successfully"
}

# Start basic services
start_basic() {
    log_info "Starting basic device simulators..."
    
    docker-compose up -d button-simulator watch-simulator repeater-simulator
    
    log_success "Basic simulators started"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Show running containers
    docker-compose ps
}

# Start all services including monitoring
start_all() {
    log_info "Starting all services including monitoring..."
    
    docker-compose up -d
    
    log_success "All services started"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 15
    
    # Show running containers
    docker-compose ps
}

# Run load test
run_load_test() {
    log_info "Running containerized load test..."
    
    docker-compose run --rm load-tester npm run test:performance -- run basic_load
    
    log_success "Load test completed"
}

# Scale services
scale_services() {
    local button_count=${1:-3}
    local watch_count=${2:-2}
    local repeater_count=${3:-2}
    
    log_info "Scaling services: Buttons=$button_count, Watches=$watch_count, Repeaters=$repeater_count"
    
    docker-compose up -d --scale button-simulator=$button_count \
                        --scale watch-simulator=$watch_count \
                        --scale repeater-simulator=$repeater_count
    
    log_success "Services scaled successfully"
    docker-compose ps
}

# Show logs
show_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        log_info "Showing logs for all services..."
        docker-compose logs --tail=50 -f
    else
        log_info "Showing logs for $service..."
        docker-compose logs --tail=50 -f "$service"
    fi
}

# Monitor system resources
monitor_resources() {
    log_info "Monitoring system resources..."
    
    echo "Docker container stats:"
    docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Check if services are running
    local services=("button-simulator" "watch-simulator" "repeater-simulator")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All core services are healthy"
    else
        log_warning "Some services are not running properly"
    fi
    
    # Show container resource usage
    echo ""
    monitor_resources
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    
    docker-compose down
    
    log_success "All services stopped"
}

# Clean up everything
cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down --volumes --remove-orphans
    
    # Remove images (optional - uncomment if needed)
    # docker-compose down --rmi all
    
    # Prune unused Docker resources
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Export logs
export_logs() {
    local output_dir="./logs/docker-export-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Exporting logs to $output_dir..."
    
    mkdir -p "$output_dir"
    
    # Export logs for each service
    local services=("button-simulator" "watch-simulator" "repeater-simulator" "load-tester" "metrics-collector")
    
    for service in "${services[@]}"; do
        if docker-compose ps -q "$service" &> /dev/null; then
            docker-compose logs "$service" > "$output_dir/${service}.log" 2>&1
            log_info "Exported logs for $service"
        fi
    done
    
    # Export container stats
    docker stats --no-stream --format "json" > "$output_dir/container-stats.json"
    
    log_success "Logs exported to $output_dir"
}

# Show usage information
usage() {
    echo "OBEDIO Device Simulators - Docker Deployment Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup          - Setup environment and build images"
    echo "  start          - Start basic simulators (button, watch, repeater)"
    echo "  start-all      - Start all services including monitoring"
    echo "  scale [b w r]  - Scale services (button, watch, repeater counts)"
    echo "  load-test      - Run containerized load test"
    echo "  logs [service] - Show logs (optionally for specific service)"
    echo "  monitor        - Monitor resource usage"
    echo "  health         - Perform health check"
    echo "  stop           - Stop all services"
    echo "  cleanup        - Stop services and clean up resources"
    echo "  export-logs    - Export logs to files"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Initial setup"
    echo "  $0 start                    # Start basic services"
    echo "  $0 scale 5 3 2             # Scale to 5 buttons, 3 watches, 2 repeaters"
    echo "  $0 logs button-simulator    # Show button simulator logs"
    echo "  $0 health                   # Check service health"
    echo ""
}

# Main script logic
main() {
    local command=${1:-""}
    
    case $command in
        "setup")
            check_prerequisites
            setup_environment
            build_images
            log_success "Setup completed. Run '$0 start' to begin simulation."
            ;;
        "start")
            check_prerequisites
            start_basic
            ;;
        "start-all")
            check_prerequisites
            start_all
            ;;
        "scale")
            scale_services "$2" "$3" "$4"
            ;;
        "load-test")
            run_load_test
            ;;
        "logs")
            show_logs "$2"
            ;;
        "monitor")
            monitor_resources
            ;;
        "health")
            health_check
            ;;
        "stop")
            stop_services
            ;;
        "cleanup")
            cleanup
            ;;
        "export-logs")
            export_logs
            ;;
        "help"|"--help"|"-h"|"")
            usage
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run the script
main "$@"