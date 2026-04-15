# PCMS Makefile
# Perceptual & Cognitive Mapping System
# For convenient local development and deployment

.PHONY: help setup dev start stop restart build start-prod install clean update reset remove status verify test test-coverage test-edge lint type-check

# Default target
help:
	@echo "PCMS - Perceptual & Cognitive Mapping System"
	@echo ""
	@echo "Available commands:"
	@echo "  setup      - Run the automated setup script"
	@echo "  start      - Start development server"
	@echo "  stop       - Stop development server"
	@echo "  restart    - Restart development server"
	@echo "  dev        - Start development server (alias for start)"
	@echo "  build      - Build for production"
	@echo "  start-prod - Start production server"
	@echo "  install    - Install dependencies"
	@echo "  clean      - Clean local data and cache"
	@echo "  update     - Update dependencies"
	@echo "  reset      - Reset project to clean state"
	@echo "  remove     - Remove project completely"
	@echo "  status     - Show system status"
	@echo "  verify     - Verify gitignore (no artifacts committed)"
	@echo "  test       - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  test-edge  - Run edge-case test suites"
	@echo "  lint       - Run linting"
	@echo "  type-check - Run TypeScript type checking"
	@echo ""
	@echo "Quick start:"
	@echo "  make setup  # Run automated setup"
	@echo "  make start  # Start development server"
	@echo "  make stop   # Stop server"
	@echo "  make status # Check system status"

# Automated setup
setup:
	@echo "Running PCMS setup script..."
	./setup.sh

# Development
dev:
	@echo "Starting development server..."
	./setup.sh start

start:
	@echo "Starting development server..."
	./setup.sh start

stop:
	@echo "Stopping development server..."
	./setup.sh stop

restart:
	@echo "Restarting development server..."
	./setup.sh restart

# Production
build:
	@echo "Building for production..."
	npm run build

start-prod:
	@echo "Starting production server..."
	npm run start

# Dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Cleanup
clean:
	@echo "Cleaning local data and cache..."
	./setup.sh clean

# Update
update:
	@echo "Updating dependencies..."
	./setup.sh update

# Reset
reset:
	@echo "Resetting project to clean state..."
	./setup.sh reset

# Remove
remove:
	@echo "Removing project completely..."
	./setup.sh remove

# Status
status:
	@echo "Checking system status..."
	./setup.sh status

# Verify gitignore
verify:
	@echo "Verifying gitignore (no testing artifacts committed)..."
	./verify-gitignore.sh

# Quality checks
test:
	@echo "Running quality checks (type-check + lint + unit tests)..."
	npm run test

test-coverage:
	@echo "Running unit tests with coverage..."
	npm run test:coverage

test-edge:
	@echo "Running edge-case test suites..."
	npm run test:edge

lint:
	@echo "Running linting..."
	npm run lint

type-check:
	@echo "Running TypeScript type checking..."
	npm run type-check

# Quick development setup
quick: install build
	@echo "Quick setup complete. Run 'make dev' to start development."

# Full setup including database
full: setup
	@echo "Full setup complete. Follow the database setup instructions."

# Development workflow
dev-setup: install build
	@echo "Development setup complete."
	@echo "Run 'make dev' to start the development server."

# Production deployment prep
deploy: clean build
	@echo "Ready for deployment."
	@echo "Build artifacts are ready for production."
