.PHONY: help install dev build start stop logs migrate seed clean deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd backend && npm install
	cd frontend && npm install

dev: ## Start development servers (backend + frontend separately)
	@echo "Starting backend on :5000 and frontend on :5173"
	cd backend && npm run dev &
	cd frontend && npm run dev

build: ## Build Docker images
	docker-compose build

start: ## Start all services with Docker Compose
	docker-compose up -d

stop: ## Stop all services
	docker-compose down

logs: ## View logs
	docker-compose logs -f

migrate: ## Run database migrations
	docker-compose exec backend npx prisma migrate dev

seed: ## Seed database with demo data
	docker-compose exec backend npx prisma db seed

studio: ## Open Prisma Studio
	docker-compose exec backend npx prisma studio

clean: ## Remove all containers and volumes
	docker-compose down -v
	 docker system prune -f

deploy-render: ## Deploy to Render (requires render CLI)
	render deploy

status: ## Check service status
	@echo "=== Docker Containers ==="
	@docker-compose ps
	@echo ""
	@echo "=== API Health ==="
	@curl -s http://localhost:5000/health || echo "API not responding"
