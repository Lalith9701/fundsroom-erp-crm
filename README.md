# Fundsroom ERP + CRM Operations Portal

> Mini ERP & CRM Operations Portal for Wholesale and Distribution Enterprises.

[![Frontend Deployment](https://img.shields.io/badge/Vercel-Deployment--Ready-000000?style=for-the-badge&logo=vercel)](https://fundsroom-erp-crm.vercel.app)
[![Backend Deployment](https://img.shields.io/badge/Render-Deployment--Ready-46E3B7?style=for-the-badge&logo=render)](https://fundsroom-erp-api.onrender.com)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon%2FSupabase-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech)

---

## 1. Project Overview
**fundsroom-erp-crm** is a full-stack, enterprise-grade Operations Portal designed for wholesale, distribution, and manufacturing businesses. It provides seamless end-to-end management across four core operational areas:
1. **Authentication & Role-Based Access Control** (ADMIN, SALES, WAREHOUSE, ACCOUNTS).
2. **Customer Relationship Management (CRM)** for tracking leads, active accounts, contact details, and follow-up activities.
3. **Product Catalog & Inventory Engine** with real-time stock balances, low-stock threshold alerts, and immutable IN/OUT movement logs.
4. **Sales Delivery Challan Workflow** featuring draft creation, product price snapshots, and atomic database transaction stock deduction upon confirmation.

---

## 2. Key Features
- **Role-Based Workflows**: Custom dashboard access and action permissions tailored to ADMIN, SALES, WAREHOUSE, and ACCOUNTS users.
- **CRM Follow-Up History**: Track ongoing discussions and schedule future contact dates per customer account.
- **Product & Rack Management**: Store product codes, categories, unit prices, minimum alert quantities, and warehouse rack locations.
- **Stock Movement Audit Trail**: Every stock change (IN/OUT) generates a traceable movement record linked to the operating user.
- **Atomic Sales Challan Confirmation**:
  - Save challans as `DRAFT` without altering inventory stock.
  - Confirming a challan verifies inventory availability across all requested line items inside a PostgreSQL `$transaction`.
  - Rejects with `HTTP 400` error if any product stock is insufficient, preventing partial or negative stock updates.
  - Captures product snapshots (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) to preserve historical pricing integrity.
- **Responsive Admin Portal UI**: Designed with modern CSS custom properties, stat summary metrics cards, interactive modals, paginated tables, search bars, and live status badges.

---

## 3. Tech Stack

### Frontend
- **Framework**: React (TypeScript)
- **Bundler**: Vite
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with request/response Bearer token interceptors
- **Icons**: Lucide React
- **Styling**: Custom CSS Design System (Variables, Glassmorphism, Grid/Flexbox)

### Backend
- **Runtime**: Node.js (TypeScript)
- **Web Server**: Express.js
- **Database ORM**: Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Middleware**: Centralized Error Handler, Request Validation, JWT Authenticator, Role Authorizer

### Database & Deployment
- **Database Engine**: PostgreSQL (Neon / Supabase / Render PostgreSQL)
- **Frontend Host**: Vercel
- **Backend Host**: Render

---

## 4. Architecture

```
                               ┌─────────────────────────────┐
                               │  Vercel Frontend (React TS) │
                               └──────────────┬──────────────┘
                                              │ HTTP / REST APIs
                                              ▼
                               ┌─────────────────────────────┐
                               │   Render Backend (Express)  │
                               └──────────────┬──────────────┘
                                              │ Prisma ORM
                                              ▼
                               ┌─────────────────────────────┐
                               │ PostgreSQL (Neon/Supabase)  │
                               └─────────────────────────────┘
```

---

## 5. Folder Structure

```
fundsroom-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment & Prisma client instances
│   │   ├── middleware/         # Auth, Authorize, Validation & Central Error Handlers
│   │   ├── modules/
│   │   │   ├── auth/           # Login & session verification
│   │   │   ├── customers/      # Customer CRM & follow-ups
│   │   │   ├── products/       # Product catalog
│   │   │   ├── inventory/      # Stock movement audit logs
│   │   │   ├── challans/       # Sales challans & atomic transaction logic
│   │   │   └── dashboard/      # Summary metrics & low-stock alerts
│   │   ├── utils/              # Response formatters, AppError classes, Challan counter
│   │   └── server.ts           # Express server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma       # Database models & enums
│   │   └── seed.ts             # Database seed script
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, Header, SummaryCard, Pagination, Modal, Badge
│   │   ├── context/            # AuthContext (Token, User & Role verification)
│   │   ├── layouts/            # DashboardLayout shell
│   │   ├── pages/
│   │   │   ├── Login/          # Quick-Login demo portal
│   │   │   ├── Dashboard/      # Summary stats & alert tables
│   │   │   ├── Customers/      # CRM list & detail follow-up timeline
│   │   │   ├── Products/       # Catalog & low-stock filter
│   │   │   ├── Inventory/      # Stock movement log & manual adjustment
│   │   │   └── Challans/       # List, Create draft, & Confirm stock flow
│   │   ├── services/           # Axios API modules
│   │   ├── routes/             # Protected app routes
│   │   └── App.tsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
│
├── postman/
│   └── fundsroom-erp.postman_collection.json
├── README.md
└── .gitignore
```

---

## 6. Database Design

```
   ┌───────────┐         1:N         ┌───────────────┐
   │   User    ├────────────────────►│   FollowUp    │
   └─────┬─────┘                     └───────▲───────┘
         │                                   │
         │ 1:N                               │ 1:N
         ▼                                   │
   ┌───────────┐ 1:N                 ┌───────┴───────┐
   │  Challan  ├────────────────────►│   Customer    │
   └─────┬─────┘                     └───────────────┘
         │
         │ 1:N
         ▼
   ┌───────────┐         N:1         ┌───────────────┐
   │ChallanItem├────────────────────►│    Product    │
   └───────────┘                     └───────▲───────┘
                                             │ 1:N
                                     ┌───────┴───────┐
                                     │ StockMovement │
                                     └───────────────┘
```

### Models Overview
- **User**: Stores email, hashed password, name, and `Role` (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- **Customer**: Customer profile, mobile, email, business name, GST number, `CustomerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), `CustomerStatus` (`LEAD`, `ACTIVE`, `INACTIVE`), address, and scheduled follow-up date.
- **FollowUp**: Logged notes, follow-up date, linked to Customer and creator User.
- **Product**: SKU code (unique), name, category, unit price, current stock, min stock alert threshold, warehouse location.
- **StockMovement**: Quantity change, `MovementType` (`IN`, `OUT`), reason, created by User, linked to Product.
- **Challan**: Auto-generated `challanNumber` (`CH-2026-XXXXXX`), customer relation, status (`DRAFT`, `CONFIRMED`, `CANCELLED`), total quantity, creator User.
- **ChallanItem**: Item row preserving **snapshot data**: `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, quantity, linked to Challan and Product.

---

## 7. API Documentation

### Response Standards

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Insufficient stock for Industrial Valve 2-inch",
  "errors": []
}
```

### Core API Endpoints

| Module | Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Authenticate email/password, return JWT | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch active user session details | Authenticated |
| **Customers** | `GET` | `/api/customers` | List customers (paginated, search, filter) | All Roles |
| **Customers** | `GET` | `/api/customers/:id` | Get customer by ID + follow-up history | All Roles |
| **Customers** | `POST` | `/api/customers` | Create new customer record | ADMIN, SALES |
| **Customers** | `PUT` | `/api/customers/:id` | Update customer record | ADMIN, SALES |
| **Customers** | `DELETE` | `/api/customers/:id` | Delete customer account | ADMIN, SALES |
| **Customers** | `POST` | `/api/customers/:id/followups` | Add follow-up note to customer | ADMIN, SALES |
| **Products** | `GET` | `/api/products` | List product catalog (search, low stock filter) | All Roles |
| **Products** | `GET` | `/api/products/:id` | Get product details + stock movements | All Roles |
| **Products** | `POST` | `/api/products` | Create product record | ADMIN, WAREHOUSE |
| **Products** | `PUT` | `/api/products/:id` | Update product information | ADMIN, WAREHOUSE |
| **Inventory** | `GET` | `/api/stock-movements` | List stock movement audit logs | All Roles |
| **Inventory** | `POST` | `/api/stock-movements` | Add manual stock movement (IN / OUT) | ADMIN, WAREHOUSE |
| **Challans** | `GET` | `/api/challans` | List sales delivery challans | All Roles |
| **Challans** | `GET` | `/api/challans/:id` | Get challan details + item snapshots | All Roles |
| **Challans** | `POST` | `/api/challans` | Create Draft sales challan | ADMIN, SALES |
| **Challans** | `POST` | `/api/challans/:id/confirm` | Confirm challan & deduct stock atomically | ADMIN, SALES |
| **Challans** | `POST` | `/api/challans/:id/cancel` | Cancel draft sales challan | ADMIN, SALES |
| **Dashboard** | `GET` | `/api/dashboard/stats` | Fetch executive summary metrics & alerts | All Roles |

---

## 8. Authentication & Security
- **Passwords**: Hashed using `bcryptjs` with salt rounds = 10. Passwords are never returned in API payloads.
- **JWT Authentication**: Secured with secret key `JWT_SECRET`, transmitted via `Authorization: Bearer <token>`.
- **Validation**: Strict validation of emails, enums, required fields, and non-negative numbers.

---

## 9. Role Permissions Matrix

| Permission / Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|
| View Dashboard & Metrics | ✅ | ✅ | ✅ | ✅ |
| View Customer Details | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Customers | ✅ | ✅ | ❌ | ❌ |
| Log CRM Follow-up Notes | ✅ | ✅ | ❌ | ❌ |
| View Products & Stock | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Products | ✅ | ❌ | ✅ | ❌ |
| View Inventory Log History | ✅ | ✅ | ✅ | ✅ |
| Record Stock IN/OUT Movements | ✅ | ❌ | ✅ | ❌ |
| View Sales Challans | ✅ | ✅ | ✅ | ✅ |
| Create Draft Sales Challan | ✅ | ✅ | ❌ | ❌ |
| Confirm Sales Challan (Deduct Stock) | ✅ | ✅ | ❌ | ❌ |

---

## 10. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://username:password@ep-host.region.aws.neon.tech/fundsroom_erp?sslmode=require"
JWT_SECRET="fundsroom_super_secret_jwt_key_2026_change_in_production"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 11. Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- Access to a PostgreSQL database (e.g., free tier on Neon.tech or local PostgreSQL server)

---

## 12. Database Setup & Migrations

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy `.env.example` to `.env` and set your `DATABASE_URL`:
```bash
cp .env.example .env
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Push schema to PostgreSQL database:
```bash
npx prisma db push
```

5. Seed database with initial users, products, customers, and stock:
```bash
npm run seed
```

---

## 13. How to Run Backend

```bash
cd backend
npm run dev
```
Backend API server starts at `http://localhost:5000`.

---

## 14. How to Run Frontend

```bash
cd frontend
npm run dev
```
Frontend React app starts at `http://localhost:5173`.

---

## 15. Test Credentials

All seed accounts use the password: **`Password123!`**

| Role | Email | Hashed Password in Seed |
|---|---|---|
| **ADMIN** | `admin@example.com` | `Password123!` |
| **SALES** | `sales@example.com` | `Password123!` |
| **WAREHOUSE** | `warehouse@example.com` | `Password123!` |
| **ACCOUNTS** | `accounts@example.com` | `Password123!` |

---

## 16. Postman Collection Usage

1. Open Postman.
2. Import file from `postman/fundsroom-erp.postman_collection.json`.
3. Execute **Auth -> Login (Admin)**. The test script automatically populates the `token` variable.
4. Execute any customer, product, inventory, or challan API requests.

---

## 17. Deployment Instructions

### Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Environment Variable:
   - `VITE_API_BASE_URL`: `https://fundsroom-erp-api.onrender.com/api`
5. Deploy!

### Backend Deployment (Render)
1. Create a **Web Service** on [Render](https://render.com).
2. Set Root Directory to `backend`.
3. Build Command: `npm install && npm run prisma:generate && npm run build`
4. Start Command: `npm run start`
5. Environment Variables:
   - `DATABASE_URL`: Connection string from Neon PostgreSQL.
   - `JWT_SECRET`: Secure random string.
   - `JWT_EXPIRES_IN`: `1d`
   - `PORT`: `10000` (Render default)

### Database Deployment (Neon / Supabase)
1. Create a project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the pooled PostgreSQL connection string into `DATABASE_URL`.

---

## 18. Live Deployment Placeholders
- **Frontend Application URL**: `https://fundsroom-erp-crm.vercel.app`
- **Backend API Base URL**: `https://fundsroom-erp-api.onrender.com/api`

---

## 19. Assumptions
- Stock movements logged during Challan Confirmation use movement reason `Sales Challan Confirmation: CH-2026-XXXXXX`.
- Product snapshots on Challan items freeze historical prices, preventing future product price edits from altering old invoice values.
- Deleting a customer with existing sales challans is blocked by referential integrity; setting customer status to `INACTIVE` is recommended.

---

## 20. Known Limitations
- Multi-currency support is not included; prices are standard INR (₹).
- PDF invoice generation and S3 file attachments can be added in future enhancement iterations.
