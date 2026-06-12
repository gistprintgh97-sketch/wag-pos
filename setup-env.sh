#!/bin/bash
# Setup environment files for WAG POS

echo "Setting up WAG POS environment..."

# Backend
if [ ! -f backend/.env ]; then
  cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:Walls9977@postgres:5432/wag_pos

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=changeThisToASuperSecretRandomStringInProduction

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080

# Paystack (Ghana payments)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Frontend URL (for callbacks)
FRONTEND_URL=http://localhost:8080

# Super Admin
SUPER_ADMIN_KEY=your_super_admin_secret_key_here
EOF
  echo "✅ Created backend/.env"
else
  echo "⚠️  backend/.env already exists"
fi

# Frontend
if [ ! -f frontend/.env ]; then
  cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
EOF
  echo "✅ Created frontend/.env"
else
  echo "⚠️  frontend/.env already exists"
fi

echo ""
echo "📝 Please edit the .env files with your actual credentials before starting."
