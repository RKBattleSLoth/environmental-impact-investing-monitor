# EIIM Docker Development Commands

.PHONY: help build up down logs clean install test lint

# Default target
help:
	@echo "EIIM Development Commands"
	@echo "========================="
	@echo "make setup     - Initial setup (copy .env, install deps)"
	@echo "make build     - Build all Docker containers"
	@echo "make up        - Start all services in development mode"
	@echo "make down      - Stop all services"
	@echo "make logs      - View logs from all services"
	@echo "make clean     - Clean up containers and volumes"
	@echo "make install   - Install dependencies in containers"
	@echo "make test      - Run tests"
	@echo "make lint      - Run linting"
	@echo "make db-init   - Initialize database"
	@echo "make db-reset  - Reset database (DANGER: removes all data)"

# Initial setup
setup:
	@echo "Setting up EIIM development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file - please configure it"; fi
	@echo "Setup complete! Please configure your .env file and run 'make up'"

# Build containers
build:
	@echo "Building Docker containers..."
	docker-compose build

# Start development environment
up:
	@echo "Starting EIIM development environment..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001"
	@echo "Database: localhost:5432"

# Start with logs
up-logs:
	@echo "Starting EIIM with logs..."
	docker-compose up

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Clean up everything
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	docker-compose exec backend npm install
	@echo "Installing frontend dependencies..."
	docker-compose exec frontend npm install

# Run tests
test:
	@echo "Running backend tests..."
	docker-compose exec backend npm test
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test -- --watchAll=false

# Run linting
lint:
	@echo "Running backend linting..."
	docker-compose exec backend npm run lint
	@echo "Running frontend linting..."
	docker-compose exec frontend npm run lint

# Database operations
db-init:
	@echo "Initializing database..."
	docker-compose exec backend npm run db:migrate

db-reset:
	@echo "Resetting database (this will delete all data)..."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker-compose down
	docker volume rm river_road_postgres_data
	docker-compose up -d db
	sleep 5
	docker-compose up -d

# Development helpers
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec db psql -U eiim_user -d eiim

# Production build
build-prod:
	@echo "Building production containers..."
	docker-compose -f docker-compose.prod.yml build

# Check service status
status:
	@echo "Service Status:"
	@echo "==============="
	@docker-compose ps