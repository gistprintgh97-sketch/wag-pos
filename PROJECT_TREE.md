wag-pos-commercial/
├── README.md                          # Project overview & quick start
├── .gitignore                         # Git ignore rules
├── docker-compose.yml                 # Full stack orchestration
│
├── backend/                           # Node.js + Express API
│   ├── Dockerfile                     # Backend container image
│   ├── .env.example                   # Environment variables template
│   ├── package.json                   # Dependencies & scripts
│   ├── server.js                      # Express app entry point
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # Multi-tenant database schema
│   │   └── seed.js                    # Demo data seed script
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT auth + role checks (ADMIN, MANAGER, CASHIER)
│   │   └── tenant.js                  # Multi-tenant extraction (subdomain/header/query)
│   │
│   ├── routes/
│   │   ├── tenants.js                 # Shop registration & login
│   │   ├── products.js                # CRUD + restock (plan limits enforced)
│   │   ├── sales.js                   # Checkout + history (tenant-scoped)
│   │   ├── reports.js                 # Dashboard analytics (tenant-scoped)
│   │   ├── users.js                   # User management (plan limits enforced)
│   │   ├── settings.js                # Tenant-specific settings
│   │   ├── billing.js                 # Paystack subscription payments
│   │   ├── momo.js                    # MTN MoMo payment integration
│   │   └── superAdmin.js             # SaaS operator dashboard API
│   │
│   └── services/
│       ├── paystack.js                # Paystack API wrapper (Ghana payments)
│       └── momo.js                    # MTN MoMo API service (sandbox + production)
│
├── frontend/                          # React 18 + Vite + Tailwind
│   ├── Dockerfile                     # Frontend container image (Nginx)
│   ├── nginx.conf                     # Nginx static server config
│   ├── index.html                     # HTML entry point
│   ├── .env.example                   # Frontend environment template
│   ├── package.json                   # Dependencies & scripts
│   ├── tailwind.config.js             # Tailwind theme (pos-blue, pos-dark, etc.)
│   └── vite.config.js                 # Vite build config + proxy
│   │
│   └── src/
│       ├── main.jsx                   # React root render
│       ├── App.jsx                    # Route definitions
│       ├── index.css                  # Global styles + component classes
│       │
│       ├── context/
│       │   ├── AuthContext.jsx        # Authentication state (tenant-aware login)
│       │   └── TenantContext.jsx      # Tenant/subscription state management
│       │
│       ├── hooks/
│       │   └── useApi.js              # API call wrapper with loading & toast
│       │
│       ├── services/
│       │   └── api.js                 # Axios instance (auto-injects tenant slug + token)
│       │
│       ├── components/
│       │   ├── Layout.jsx             # Sidebar navigation + trial alerts + user menu
│       │   ├── Modal.jsx              # Reusable modal dialog
│       │   ├── LoadingSpinner.jsx     # Loading indicator (full-screen + inline)
│       │   └── ErrorBoundary.jsx      # React error boundary
│       │
│       └── pages/
│           ├── Login.jsx              # Shop slug + PIN login
│           ├── Register.jsx           # New shop signup (14-day trial)
│           ├── Dashboard.jsx          # Stats cards + product grid + low stock alerts
│           ├── Products.jsx           # Inventory table + add/edit/restock modals
│           ├── Sales.jsx              # Cart checkout + MoMo + receipt printing
│           ├── Reports.jsx            # Analytics + date range + CSV export
│           ├── Users.jsx              # Team management (ADMIN/MANAGER/CASHIER)
│           ├── Settings.jsx           # Shop config + feature toggles (MoMo/Card)
│           ├── Billing.jsx            # Subscription plans + Paystack payments
│           ├── MoMoConfig.jsx         # MTN MoMo credentials setup
│           ├── PaystackCallback.jsx   # Payment verification after redirect
│           └── SuperAdmin.jsx         # SaaS operator dashboard (all tenants)
│
├── nginx/                             # Production reverse proxy
│   └── nginx.conf                     # SSL + rate limiting + API proxy
│
├── docs/
│   ├── DEPLOYMENT.md                  # Render/Railway/AWS/Lightsail guides
│   └── MIGRATION.md                   # Single-tenant → multi-tenant migration
│
└── .github/
    └── workflows/
        └── deploy.yml                 # CI/CD: test → build → push Docker → deploy
