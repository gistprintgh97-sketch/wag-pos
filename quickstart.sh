#!/bin/bash
# WAG POS Commercial - Quick Start Script

set -e

echo "🚀 WAG POS System v2.0 - Quick Start"
echo "====================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }

echo "✅ Docker & Docker Compose found"

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your actual credentials"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please edit frontend/.env with your API URL"
fi

# Start services
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d --build

# Wait for database
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T backend npx prisma migrate dev --name init --accept-data-loss || true

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec -T backend npx prisma generate

# Seed database
echo "🌱 Seeding database with demo data..."
docker-compose exec -T backend npx prisma db seed || docker-compose exec -T backend node prisma/seed.js

echo ""
echo "====================================="
echo "🎉 WAG POS is ready!"
echo ""
echo "📱 Frontend:  http://localhost:8080"
echo "🔌 API:       http://localhost:5000"
echo "📊 Health:    http://localhost:5000/health"
echo ""
echo "🔑 Demo Login:"
echo "   Shop URL:  demo"
echo "   PIN:       1234 (Admin)"
echo "   PIN:       5678 (Cashier)"
echo ""
echo "📖 Documentation:"
echo "   - Deployment:  docs/DEPLOYMENT.md"
echo "   - Migration:   docs/MIGRATION.md"
echo ""
echo "🛑 To stop: docker-compose down"
echo "🗑️  To reset: docker-compose down -v"
