# Fundsroom ERP + CRM Operations Portal

## 1. Project Title
**Fundsroom Mini ERP + CRM Operations Portal (`fundsroom-erp-crm`)**

---

## 2. Project Overview
**fundsroom-erp-crm** is a full-stack enterprise portal built for wholesale, distribution, and manufacturing businesses. The application integrates Customer Relationship Management (CRM), Product Catalog management, Inventory tracking with audit logs, and a complete Sales Delivery Challan processing flow featuring atomic database stock verification.

---

## 3. Business Problem
Wholesale and distribution businesses face operational friction due to:
- **Disjointed CRM & Order Processes**: Sales teams create orders without real-time inventory visibility, resulting in unfulfillable commitments.
- **Negative Stock & Inventory Errors**: Inaccurate stock tracking leads to negative inventory levels and unrecorded dispatches.
- **Price Instability**: Fluctuating supplier prices overwrite historic order amounts if historical snapshots are not captured.
- **Lack of Role-Based Audit Trails**: Stock adjustments and order confirmations lack strict authorization, leading to accountability gaps.

This project solves these challenges by providing a single operational platform where sales, warehouse, accounts, and management teams operate under strict role-based controls and atomic database transactions.

---

## 4. Key Features
- **Role-Based Access Control (RBAC)**: Enforced via JWT authentication and role authorization middleware across `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.
- **Customer CRM & Follow-ups**: Customer account management with status tracking (`LEAD`, `ACTIVE`, `INACTIVE`), customer types (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), and follow-up history logging.
- **Product Catalog & Stock Alerts**: SKU tracking, category management, unit prices, warehouse rack locations, and low-stock alert highlights.
- **Stock Movement Audit Log**: Immutable record of every stock movement (`IN` / `OUT`) linked to the initiating user and reason.
- **Atomic Sales Delivery Challan Workflow**:
  - Save order as `DRAFT` without altering physical inventory stock.
  - Snapshot pricing (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) captured at draft creation.
  - Confirmation executes an atomic Prisma `$transaction` checking stock availability across all requested items.
  - Rejects with `HTTP 400 Bad Request` if any item has insufficient stock, preventing partial updates or negative stock.
  - Automatically decrements stock and logs `OUT` stock movements upon successful confirmation.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with Bearer token request interceptor and 401 response interceptor)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with custom design tokens, modern responsive flex/grid layouts, badges, and modals

### Backend
- **Runtime**: Node.js v24
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma ORM v5
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing
- **Validation & Error Handling**: Custom `AppError` architecture with centralized Express error middleware

### Database
- **Primary Database Engine**: PostgreSQL (Neon / Supabase / Render PostgreSQL)
- **Local Dev Database**: SQLite (`dev.db`) configured via Prisma for zero-config local execution

---

## 6. System Architecture

```text
React Frontend (Vite + TypeScript)
        │
        ▼  (HTTP / REST APIs with JWT Bearer Header)
Express Backend Server (Node.js + TypeScript)
        │
        ▼  (Request Validation & Role Authorizer Middleware)
Modules / Controllers / Services (Auth, Customers, Products, Inventory, Challans)
        │
        ▼  (Prisma ORM Client & Database Transactions)
Database (PostgreSQL / SQLite)
```

---

## 7. Project Folder Structure

```text
fundsroom-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/             # Config loader & Prisma singleton
│   │   ├── middleware/         # Auth, Authorize, & Centralized Error Handlers
│   │   ├── modules/
│   │   │   ├── auth/           # Login & session check (/api/auth)
│   │   │   ├── customers/      # Customer CRM & follow-ups (/api/customers)
│   │   │   ├── products/       # Product catalog (/api/products)
│   │   │   ├── inventory/      # Stock movement audit logs (/api/stock-movements)
│   │   │   ├── challans/       # Sales challans & transaction logic (/api/challans)
│   │   │   └── dashboard/      # Summary stats & alert counters (/api/dashboard)
│   │   ├── types/
│   │   │   └── enums.ts        # Role, Customer, Movement, and Challan Enums
│   │   ├── utils/              # Standard responses, AppError classes, Challan counter
│   │   └── server.ts           # Express application server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema definition
│   │   ├── dev.db              # Local development database
│   │   └── seed.ts             # Seeder script
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Header, Sidebar, SummaryCard, Pagination, Modal, Badge, ProtectedRoute
│   │   ├── context/            # AuthContext (Token, User & Role verification)
│   │   ├── layouts/            # DashboardLayout shell
│   │   ├── pages/
│   │   │   ├── Login/          # LoginPage with demo quick-login buttons
│   │   │   ├── Dashboard/      # Executive metrics & low stock table
│   │   │   ├── Customers/      # Customer list & detail follow-up history
│   │   │   ├── Products/       # Product list & low-stock filter
│   │   │   ├── Inventory/      # Stock movement history log & manual adjustment
│   │   │   └── Challans/       # Challan list, Create draft, & Confirm stock view
│   │   ├── services/           # Axios API services (api, customer, product, inventory, challan, dashboard)
│   │   ├── routes/             # AppRoutes (Protected React Router routes)
│   │   ├── index.css           # Styling system & CSS variables
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── postman/
│   └── fundsroom-erp.postman_collection.json
├── README.md
└── .gitignore
```

---

## 8. Authentication and Role-Based Access
- **Authentication**: JWT-based authentication. Users log in via `POST /api/auth/login` to receive a signed JWT token containing user ID, email, name, and role.
- **Token Security**: Tokens are passed via `Authorization: Bearer <token>` headers. Passwords are hashed using `bcryptjs` (10 salt rounds) and excluded from API responses.
- **Role Authorization**: Express middleware (`authorize.middleware.ts`) verifies user roles against allowed roles per route.
- **Frontend Route Protection**: `ProtectedRoute.tsx` guards routes, automatically redirecting unauthenticated users to `/login` and rendering HTTP 403 pages for unauthorized role access.

---

## 9. User Roles and Permissions

| User Role | Dashboard | Customers CRM | Product Catalog | Stock Movements | Sales Challans |
|---|:---:|:---:|:---:|:---:|:---:|
| **ADMIN** | Full Access | Full Access | Full Access | Full Access | Full Access |
| **SALES** | Full Access | View, Create, Edit, Follow-up | View Only | View Only | Create Draft, Confirm, Cancel, View |
| **WAREHOUSE** | Full Access | View Only | Create, Edit, View | Add Stock IN/OUT, View Logs | View Only |
| **ACCOUNTS** | Full Access | View Only | View Only | View Only | View Only |

---

## 10. Customer CRM Module
- **Fields**: Customer Name, Mobile Number, Email, Business Name, GST Number (optional), Customer Type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), Address, Status (`LEAD`, `ACTIVE`, `INACTIVE`), Follow-up Date, Notes.
- **Features**: Search bar, status and type dropdown filters, paginated table, customer creation/edit modals, customer detail page with a chronological follow-up activity log and linked sales challans.

---

## 11. Product and Inventory Module
- **Fields**: Product Name, SKU / Item Code (unique), Category, Unit Price (INR), Current Stock, Minimum Stock Alert Threshold, Warehouse Rack Location.
- **Features**: Product search, category filtering, low-stock alert filter toggle, product creation (records initial stock movement if stock > 0), product editing (stock updates are enforced through stock movements to maintain audit integrity).

---

## 12. Stock Movement System
- **Tracking**: Logs Product ID, Quantity Changed, Movement Type (`IN` or `OUT`), Reason / Reference Note, Creator User ID, Timestamp.
- **Validation**: Manual stock dispatches (`OUT`) validate that `currentStock >= requestedQuantity`. Requests exceeding available stock are rejected with `HTTP 400 Bad Request`.

---

## 13. Sales Challan Module
- **Fields**: Challan Number (`CH-2026-XXXXXX`), Customer ID, Total Quantity, Status (`DRAFT`, `CONFIRMED`, `CANCELLED`), Created By User ID, Created At, Updated At.
- **Snapshot Line Items**: Each item stores `productId`, `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `quantity`. Price snapshots ensure historical invoice accuracy regardless of future product catalog edits.

---

## 14. Challan Stock Business Logic

### Draft State (`status: DRAFT`)
1. User selects customer and adds line items with quantities.
2. System generates sequential challan number (e.g. `CH-2026-000001`).
3. Product snapshot data is saved.
4. **Physical stock is NOT reduced during Draft state.**

### Confirmed State (`status: CONFIRMED`)
1. User requests confirmation via `POST /api/challans/:id/confirm`.
2. Backend opens an atomic Prisma `$transaction`.
3. System verifies status is currently `DRAFT`.
4. For every line item, the system checks `product.currentStock >= item.quantity`.
5. **Insufficient Stock Rejection**: If ANY product lacks sufficient stock, the entire transaction is aborted and returns:
   ```json
   {
     "success": false,
     "message": "Insufficient stock for Industrial Valve 2-inch"
   }
   ```
   No partial stock updates occur, and no stock movements are recorded.
6. **Successful Confirmation**: If stock is sufficient for all items:
   - Stock is decremented for all line items (`currentStock - quantity`).
   - `OUT` `StockMovement` records are created with reason `Sales Challan Confirmation: CH-2026-XXXXXX`.
   - Challan status is updated to `CONFIRMED`.

---

## 15. Database Design

### Prisma Schema Models Overview

```text
User 1 ───< FollowUp N >─── 1 Customer
 User 1 ───< StockMovement N >─── 1 Product
 User 1 ───< Challan N >─── 1 Customer
             Challan 1 ───< ChallanItem N >─── 1 Product
```

1. **User**: `id` (PK), `email` (Unique), `password`, `name`, `role`, `createdAt`, `updatedAt`.
2. **Customer**: `id` (PK), `name`, `mobile`, `email`, `businessName`, `gstNumber`, `customerType`, `address`, `status`, `followUpDate`, `notes`, `createdAt`, `updatedAt`.
3. **FollowUp**: `id` (PK), `customerId` (FK -> Customer), `notes`, `followUpDate`, `createdById` (FK -> User), `createdAt`.
4. **Product**: `id` (PK), `name`, `sku` (Unique), `category`, `unitPrice`, `currentStock`, `minStockAlert`, `warehouseLocation`, `createdAt`, `updatedAt`.
5. **StockMovement**: `id` (PK), `productId` (FK -> Product), `quantity`, `movementType`, `reason`, `createdById` (FK -> User), `createdAt`.
6. **Challan**: `id` (PK), `challanNumber` (Unique), `customerId` (FK -> Customer), `totalQuantity`, `status`, `createdById` (FK -> User), `createdAt`, `updatedAt`.
7. **ChallanItem**: `id` (PK), `challanId` (FK -> Challan), `productId` (FK -> Product), `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `quantity`, `createdAt`.

---

## 16. API Documentation

| Method | Endpoint | Purpose | Authentication | Allowed Roles |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public | All |
| `GET` | `/api/auth/me` | Fetch active user profile | Bearer JWT | All |
| `GET` | `/api/health` | Service health check | Public | All |
| `GET` | `/api/dashboard/stats` | Summary statistics & alerts | Bearer JWT | All |
| `GET` | `/api/customers` | List customers (paginated, search, filter) | Bearer JWT | All |
| `GET` | `/api/customers/:id` | Get customer by ID & follow-ups | Bearer JWT | All |
| `POST` | `/api/customers` | Create new customer account | Bearer JWT | ADMIN, SALES |
| `PUT` | `/api/customers/:id` | Update customer details | Bearer JWT | ADMIN, SALES |
| `DELETE` | `/api/customers/:id` | Delete customer account | Bearer JWT | ADMIN, SALES |
| `POST` | `/api/customers/:id/followups` | Log CRM follow-up note | Bearer JWT | ADMIN, SALES |
| `GET` | `/api/products` | List product catalog (search, low stock filter) | Bearer JWT | All |
| `GET` | `/api/products/:id` | Get product details & stock movements | Bearer JWT | All |
| `POST` | `/api/products` | Create product record | Bearer JWT | ADMIN, WAREHOUSE |
| `PUT` | `/api/products/:id` | Update product details | Bearer JWT | ADMIN, WAREHOUSE |
| `GET` | `/api/stock-movements` | List stock movement audit logs | Bearer JWT | All |
| `POST` | `/api/stock-movements` | Add manual stock movement (IN/OUT) | Bearer JWT | ADMIN, WAREHOUSE |
| `GET` | `/api/challans` | List sales delivery challans | Bearer JWT | All |
| `GET` | `/api/challans/:id` | Get challan details & snapshot items | Bearer JWT | All |
| `POST` | `/api/challans` | Create Draft sales challan | Bearer JWT | ADMIN, SALES |
| `POST` | `/api/challans/:id/confirm` | Confirm challan & deduct stock atomically | Bearer JWT | ADMIN, SALES |
| `POST` | `/api/challans/:id/cancel` | Cancel draft sales challan | Bearer JWT | ADMIN, SALES |

---

## 17. API Authentication
Include the JWT token in HTTP request headers:
```text
Authorization: Bearer <your_jwt_token_here>
```

---

## 18. Environment Variables

### Backend Environment Variables (`backend/.env`)
- `PORT`: Port number for Express server (default: `5000`)
- `DATABASE_URL`: Connection URL for database (`file:./dev.db` for local SQLite, or PostgreSQL URL for production)
- `JWT_SECRET`: Secret key used to sign and verify JWT tokens
- `JWT_EXPIRES_IN`: Token validity period (e.g. `1d`)
- `FRONTEND_URL`: Client URL for CORS configuration (e.g. `http://localhost:5173`)

### Frontend Environment Variables (`frontend/.env`)
- `VITE_API_BASE_URL`: Base API endpoint URL (e.g. `http://localhost:5000/api`)

---

## 19. Local Development Setup

### Prerequisites
- Node.js v18 or v20 or v24
- npm or pnpm

### Clone Repository
```bash
git clone https://github.com/Lalith9701/fundsroom-erp-crm.git
cd fundsroom-erp-crm
```

---

## 20. Database Setup
The repository contains a pre-configured local database setup (`backend/prisma/dev.db`) for immediate execution.

To recreate or sync the database:
```bash
cd backend
npx prisma db push
```

---

## 21. Prisma Migration and Seed Instructions
Run the seed script to populate test users, products, customers, stock movements, and sample challans:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

---

## 22. How to Run Backend

```bash
cd backend
npm run dev
```
Backend API starts at: `http://localhost:5000`

---

## 23. How to Run Frontend

Open a second terminal window:

```bash
cd frontend
npm run dev
```
Frontend React App starts at: `http://localhost:5173`

---

## 24. Postman Collection
A Postman collection JSON is included in the project:
- Path: `postman/fundsroom-erp.postman_collection.json`
- Variables: Includes `baseUrl` (`http://localhost:5000/api`) and `token`.
- Automated Script: Logging in via **Auth -> Login (Admin)** populates the `token` variable automatically.

---

## 25. Test Credentials

All seed demo accounts use the password: **`Password123!`**

| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@example.com` | `Password123!` |
| **SALES** | `sales@example.com` | `Password123!` |
| **WAREHOUSE** | `warehouse@example.com` | `Password123!` |
| **ACCOUNTS** | `accounts@example.com` | `Password123!` |

---

## 26. Deployment Instructions

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Framework Preset to `Vite`.
4. Set Environment Variable `VITE_API_BASE_URL` to your production backend API URL.

### Backend (Render)
1. Create a Web Service on [Render](https://render.com).
2. Set Root Directory to `backend`.
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `npm run start`
5. Configure Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`.

### Database (Neon / Supabase)
1. Create a project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the PostgreSQL connection string to `DATABASE_URL` in backend configuration.
3. Update `backend/prisma/schema.prisma` datasource provider to `postgresql`.

---

## 27. Frontend URL
`http://localhost:5173` (Local environment; ready for deployment)

## 28. Backend API URL
`http://localhost:5000/api` (Local environment; ready for deployment)

## 29. API Health Check URL
`http://localhost:5000/api/health` (Local environment)

---

## 30. Assumptions
- Challan confirmations use reason code `Sales Challan Confirmation: CH-2026-XXXXXX`.
- Product snapshots on Challan items freeze price data at draft creation time.
- Deleting a customer linked to existing sales challans is restricted to preserve database referential integrity.

---

## 31. Known Limitations
- Standard currency is INR (₹); multi-currency conversion is not included.
- PDF invoice generation and S3 file upload integrations can be added as future enhancements.

---

## 32. Testing / Verification

The following verification tests were performed and confirmed working:

- [x] **API Health Check**: Verified `GET /api/health` returns `{"success": true, "message": "Fundsroom ERP + CRM API is online and operational"}`.
- [x] **Authentication**: Verified JWT login for all 4 seed users (`admin@example.com`, `sales@example.com`, `warehouse@example.com`, `accounts@example.com`).
- [x] **Role Access Control**: Verified WAREHOUSE user receives `HTTP 403 Forbidden` when attempting to create sales challans; verified SALES user receives `HTTP 403 Forbidden` when attempting to create products.
- [x] **Customer CRM**: Tested creating customer, editing customer details, and logging follow-up notes.
- [x] **Product & Inventory**: Tested product creation, editing, and stock IN/OUT manual movement entries.
- [x] **Draft Challan Creation**: Verified creating a challan saves status as `DRAFT`, captures product snapshot pricing, and leaves product stock levels untouched.
- [x] **Confirmed Challan Stock Deduction**: Verified confirming a draft challan decrements product stock and logs `OUT` stock movement records.
- [x] **Insufficient Stock Validation**: Verified requesting a challan confirmation with quantity exceeding product stock returns `HTTP 400 Bad Request` with message `Insufficient stock for <Product Name>`, leaving inventory levels unmodified.

---

## 33. Future Improvements
- Automated PDF invoice export for confirmed sales challans.
- Multi-warehouse location inventory transfers.
- Email notifications for low-stock threshold triggers.
