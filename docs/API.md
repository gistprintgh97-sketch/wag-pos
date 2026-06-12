# WAG POS API Documentation

## Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
x-tenant-slug: <your-shop-slug>
```

## Public Endpoints

### POST /api/tenants/register
Create a new shop (tenant).
```json
{
  "name": "My Shop",
  "slug": "my-shop",
  "email": "shop@email.com",
  "phone": "+233...",
  "businessType": "SUPERMARKET",
  "adminName": "John Doe",
  "adminPin": "1234",
  "plan": "STARTER"
}
```

### POST /api/tenants/login
Login to a shop.
```json
{
  "slug": "my-shop",
  "pin": "1234"
}
```

## Protected Endpoints (require auth + tenant)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Soft delete (Admin only)
- `PUT /api/products/restock/:id` - Restock product (Admin only)
- `GET /api/products/low-stock/alert` - Low stock alerts

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales history
- `GET /api/sales/:id` - Get single sale
- `GET /api/sales/summary/daily` - Daily summary

### Reports
- `GET /api/reports` - Dashboard report
- `GET /api/reports/range?startDate=...&endDate=...` - Date range report

### Users
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Settings
- `GET /api/settings` - Get shop settings
- `PUT /api/settings` - Update settings (Admin only)

### Billing
- `GET /api/billing/info` - Get billing info (Admin only)
- `POST /api/billing/subscribe` - Initiate subscription (Admin only)
- `POST /api/billing/verify` - Verify payment (Admin only)
- `POST /api/billing/cancel` - Cancel subscription (Admin only)

### MoMo
- `POST /api/momo/pay` - Initiate MoMo payment
- `GET /api/momo/status/:referenceId` - Check payment status
- `POST /api/momo/config` - Configure MoMo (Admin only)
- `GET /api/momo/config` - Get MoMo config (Admin only)

## Super Admin Endpoints
Require header: `x-super-admin-key: <your-super-admin-key>`

- `GET /admin/stats` - Platform statistics
- `GET /admin/tenants` - List all tenants
- `GET /admin/tenants/:id` - Get tenant details
- `PUT /admin/tenants/:id/status` - Update tenant status
- `GET /admin/payments` - List all payments

## Webhooks
- `POST /webhooks/paystack` - Paystack webhook (raw body, signature verified)
