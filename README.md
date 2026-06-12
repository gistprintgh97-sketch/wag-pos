# WAG POS System v2.0

A commercial-grade, multi-tenant Point of Sale (POS) system built for supermarkets, mini stores, pharmacies, and retail shops in Ghana and beyond.

## Features

### Core POS
- Product management with categories, barcodes, and stock tracking
- Fast sales checkout with cart system
- Receipt printing support
- Sales history with pagination
- Low stock alerts
- Multi-user support (Admin, Manager, Cashier)

### Multi-Tenant SaaS
- Each shop gets its own isolated tenant
- Subdomain-based or header-based tenant resolution
- Plan-based limits (users, products)
- 14-day free trial for new signups

### Payments
- **Cash** - Standard cash payments
- **MTN Mobile Money (MoMo)** - Direct integration with MTN MoMo API
- **Card** - Via Paystack (Ghana)
- **Paystack Subscriptions** - Automated recurring billing

### Subscription Plans
| Plan | Monthly | Yearly | Users | Products | Features |
|------|---------|--------|-------|----------|----------|
| Starter | Free | Free | 2 | 100 | Basic POS, Reports |
| Basic | GHS 49 | GHS 499 | 5 | 500 | + MoMo Payments |
| Pro | GHS 99 | GHS 999 | 15 | 2,000 | + All Features |
| Enterprise | GHS 249 | GHS 2,499 | 50 | 10,000 | + API Access, Priority Support |

## Tech Stack

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL
**Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
**Payments:** Paystack (Ghana), MTN MoMo API
**Deployment:** Docker, Docker Compose, Nginx

## Quick Start

```bash
# Clone repository
git clone <your-repo>
cd wag-pos-commercial

# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database and payment credentials

# 2. Start services
docker-compose up -d

# 3. Initialize database
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma db seed

# 4. Access
# Frontend: http://localhost:8080
# API:      http://localhost:5000
# Login:    slug=demo, pin=1234 (Admin)
```

## Project Structure

```
wag-pos-commercial/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Multi-tenant DB schema
│   │   └── seed.js            # Demo data
│   ├── middleware/
│   │   ├── auth.js            # JWT auth + role checks
│   │   └── tenant.js          # Tenant extraction middleware
│   ├── routes/
│   │   ├── tenants.js         # Registration & login
│   │   ├── products.js        # CRUD + restock
│   │   ├── sales.js           # Checkout + history
│   │   ├── reports.js         # Analytics
│   │   ├── users.js           # User management
│   │   ├── settings.js        # Tenant settings
│   │   ├── billing.js         # Paystack subscriptions
│   │   └── momo.js            # MTN MoMo payments
│   ├── services/
│   │   ├── paystack.js        # Paystack API wrapper
│   │   └── momo.js            # MTN MoMo API service
│   ├── server.js              # Express app entry
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # All page components
│   │   ├── components/        # Reusable UI
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── TenantContext.jsx
│   │   ├── hooks/useApi.js
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   └── vite.config.js
├── nginx/
│   └── nginx.conf             # Production reverse proxy
├── docker-compose.yml
└── docs/
    └── DEPLOYMENT.md          # Full deployment guide
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://app.wagpos.com
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
FRONTEND_URL=https://app.wagpos.com
```

### Frontend (.env)
```
VITE_API_URL=https://api.wagpos.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guides on:
- Render.com (free tier available)
- Railway.app
- AWS Lightsail
- Custom VPS with Docker

## MoMo Setup

1. Register at [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
2. Create an app and get your Subscription Key
3. Generate API User and API Key
4. Configure in your shop settings → MoMo Setup
5. Start with Sandbox, request production approval

## Paystack Setup

1. Create account at [paystack.com](https://paystack.com)
2. Get your test/live keys from Dashboard → Settings → API Keys
3. Add `PAYSTACK_SECRET_KEY` to backend environment
4. Add `VITE_PAYSTACK_PUBLIC_KEY` to frontend environment

## License

Commercial License - WAG POS System by Gist_tech

## Support

For support, contact: support@wagpos.com
