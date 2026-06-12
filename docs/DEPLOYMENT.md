# 🚀 WAG POS Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Clone and navigate
cd wag-pos-commercial

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 3. Start with Docker Compose
docker-compose up -d

# 4. Run migrations & seed
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma db seed

# 5. Access
# Frontend: http://localhost:8080
# API:      http://localhost:5000
# Login:    slug=demo, pin=1234
```

---

## ☁️ Option 1: Render.com (Recommended for Beginners)

Render offers free PostgreSQL + web services with automatic deploys from Git.

### Step 1: Create Render Account
- Go to [render.com](https://render.com) and sign up

### Step 2: Deploy PostgreSQL
1. Click **New** → **PostgreSQL**
2. Name: `wag-pos-db`
3. Plan: Free (or Starter for production)
4. Copy the **Internal Database URL** after creation

### Step 3: Deploy Backend (Web Service)
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `wag-pos-api`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `cd backend && node server.js`
   - **Root Directory**: `./`
4. Add Environment Variables:
   ```
   DATABASE_URL=<your-render-postgres-url>
   JWT_SECRET=<generate-random-string>
   NODE_ENV=production
   PAYSTACK_SECRET_KEY=sk_test_...
   FRONTEND_URL=https://wag-pos-web.onrender.com
   ```
5. Click **Create Web Service**

### Step 4: Deploy Frontend (Static Site)
1. Click **New** → **Static Site**
2. Connect same repo
3. Configure:
   - **Name**: `wag-pos-web`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://wag-pos-api.onrender.com/api
   ```
5. Click **Create Static Site**

### Step 5: Update CORS
In Render dashboard, go to your API service → Environment → add:
```
ALLOWED_ORIGINS=https://wag-pos-web.onrender.com
```

---

## 🚂 Option 2: Railway.app (Great for Teams)

Railway auto-detects Dockerfiles and handles scaling seamlessly.

### Step 1: Create Railway Account
- Go to [railway.app](https://railway.app)

### Step 2: New Project
1. Click **New Project** → **Deploy from GitHub repo**
2. Select your WAG POS repo

### Step 3: Add PostgreSQL
1. Click **New** → **Database** → **Add PostgreSQL**
2. Railway auto-injects `DATABASE_URL` into your services

### Step 4: Deploy Services
Railway will auto-detect your `docker-compose.yml` or individual Dockerfiles.

If deploying services separately:
1. **Backend**: Add as service, set Dockerfile path to `./backend/Dockerfile`
2. **Frontend**: Add as service, set Dockerfile path to `./frontend/Dockerfile`
3. Add all environment variables in Railway dashboard

### Step 5: Custom Domain
1. Go to service settings → **Domains**
2. Click **Generate Domain** or add custom domain
3. Update `FRONTEND_URL` and `ALLOWED_ORIGINS` accordingly

---

## ☁️ Option 3: AWS Lightsail (Best Value for Production)

Lightsail offers predictable pricing ($5-40/month) with managed containers.

### Step 1: Create Container Service
1. AWS Console → Lightsail → Containers → **Create container service**
2. Choose power: **Nano** ($5/mo) for start, scale up later
3. Scale: 1 node

### Step 2: Push Docker Image
```bash
# Build and tag
docker build -t wag-pos-api ./backend
docker tag wag-pos-api:latest your-dockerhub-username/wag-pos-api:latest
docker push your-dockerhub-username/wag-pos-api:latest
```

### Step 3: Deploy
1. In Lightsail → Container service → **Create deployment**
2. Container name: `api`
3. Image: `your-dockerhub-username/wag-pos-api:latest`
4. Port: `5000`
5. Environment variables: Add all from `.env`
6. Public endpoint: Enable
7. Health check path: `/health`

### Step 4: Database
1. Lightsail → Databases → **Create database**
2. Choose PostgreSQL
3. Connect your container to the database

### Step 5: Frontend
Deploy frontend as a separate Lightsail container or use S3 + CloudFront.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Random string for token signing |
| `NODE_ENV` | Yes | `production` for live |
| `PORT` | No | Defaults to 5000 |
| `ALLOWED_ORIGINS` | Yes | Frontend URLs (comma-separated) |
| `PAYSTACK_SECRET_KEY` | For billing | Paystack test/live secret key |
| `PAYSTACK_PUBLIC_KEY` | For billing | Paystack test/live public key |
| `FRONTEND_URL` | Yes | Your frontend URL |
| `SUPER_ADMIN_KEY` | Optional | For super-admin API access |

---

## 🌍 Custom Domain Setup

### 1. Buy Domain
- Namecheap, GoDaddy, or Cloudflare

### 2. DNS Configuration
```
A     @     <your-server-ip>
CNAME www   <your-server-domain>
CNAME *     <your-server-domain>   # For subdomains (tenant.wagpos.com)
```

### 3. SSL Certificate
- Render/Railway: Auto-managed
- Lightsail: Use Lightsail certificate manager
- Manual: Use Let's Encrypt with Certbot

### 4. Update Environment
```
FRONTEND_URL=https://app.wagpos.com
ALLOWED_ORIGINS=https://app.wagpos.com,https://*.wagpos.com
```

---

## 📊 Monitoring & Logs

### Render
- Built-in logs dashboard
- Metrics: CPU, memory, requests

### Railway
- Real-time logs
- Metrics dashboard
- Alerting (paid plans)

### Lightsail
- CloudWatch integration
- Container logs via AWS CLI:
```bash
aws lightsail get-container-log --service-name wag-pos --container-name api
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy WAG POS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `ALLOWED_ORIGINS` includes your frontend URL |
| Database connection failed | Verify `DATABASE_URL` format and network access |
| Prisma errors | Run `npx prisma generate` and `npx prisma migrate deploy` |
| 403 on API | Check `x-tenant-slug` header is sent |
| Paystack fails | Verify keys are correct (test vs live) |
| MoMo not working | Ensure sandbox credentials first, request production approval |

---

## 📞 Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **AWS Lightsail**: [aws.amazon.com/lightsail](https://aws.amazon.com/lightsail)
- **Paystack**: [paystack.com/docs](https://paystack.com/docs)
- **MTN MoMo**: [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
