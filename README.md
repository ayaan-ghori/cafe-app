<div align="center">

# ☕ CaféOS

### A full-stack café management system

Bookings, inventory, staff, customers, billing and analytics in one warm, easy-to-use dashboard.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-8884D8)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Login](#demo-login)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

Many small cafés still run on paper notebooks, spreadsheets and WhatsApp groups. Orders get lost, stock runs out without warning, and bills are calculated by hand.

**CaféOS** replaces all of that with one system. A React frontend talks to a Node.js and Express REST API, and everything is stored in an SQLite database, so data is still there after a refresh or restart.

The design follows a cozy café theme: rich browns (`#6F4E37`, `#C8A97E`), cream (`#FDF6EC`), soft green (`#4CAF50`) and muted red (`#E57373`).

---

## Features

### 🔐 Login and Signup
- Animated "brewing" intro where a cup fills up before the app opens (plays once per session, skippable)
- Login and signup form styled like a café order ticket
- Password strength meter, show/hide password, and inline validation
- Role selection at signup (Manager, Barista, Cashier, Waiter, Chef)

### 🏠 Dashboard
- Stat cards for today's revenue, active tables, total orders and low-stock alerts
- Live table map with color-coded status (available, occupied, reserved)
- Active orders list and quick action buttons

### 🗓️ Bookings
- Create, edit, confirm and cancel reservations
- Filter by status (All, Confirmed, Pending, Cancelled)
- Modal form with customer name, phone, date, time, table, party size and special requests

### 🧂 Inventory
- Category tabs: Beverages, Food, Packaging, Cleaning
- Automatic status badges (OK, Low, Critical) based on stock against minimum level
- Warning banner listing every item that needs restocking

### 👨‍🍳 Staff
- Staff cards with role badge, shift timing and duty status
- One-click On Duty / Off Duty toggle
- Weekly schedule grid and monthly attendance summary (present, absent, late)

### 👤 Customers
- Debounced search by name or phone
- Loyalty tiers (Bronze, Silver, Gold) with a progress bar toward the next tier
- Expandable cards showing preferences and order history

### 💳 Billing
- Active orders on the left, itemized bill on the right
- Subtotal, CGST (5%), SGST (5%) and grand total
- Payment method selection (Cash, Card, UPI)
- Marking an order as paid frees its table and adds it to today's transactions

### 📊 Analytics
- Revenue trend chart
- Top 5 best-selling items
- New vs returning customer growth
- Peak hours heatmap (hour vs day of week)
- Staff performance table

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | CSS-in-JS (inline styles) and a small amount of plain CSS |
| Fonts | Playfair Display, DM Sans (Google Fonts) |
| Backend | Node.js, Express 4 |
| Database | SQLite via `better-sqlite3` |
| Dev tooling | Nodemon |

---

## Project Structure

```
cafeos/
├── backend/
│   ├── server.js              # Express entry point
│   ├── package.json
│   ├── database/
│   │   └── index.js           # SQLite schema and auto-seed
│   └── routes/
│       ├── tables.js
│       ├── bookings.js
│       ├── inventory.js
│       ├── staff.js
│       ├── customers.js
│       ├── orders.js
│       └── analytics.js
│
└── frontend/
    └── src/
        ├── App.jsx            # Shows AuthPage first, then CafeOS
        ├── AuthPage.jsx       # Intro animation, login and signup
        ├── CafeOS.jsx         # Main dashboard with all 7 tabs
        └── api.js             # API client (one function per endpoint)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **18 or higher**
- npm (comes with Node.js)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/cafeos.git
cd cafeos
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API runs at **http://localhost:5000**. On the first run the database file is created and filled with demo data automatically, so there is no separate seed step.

Check that it works: open http://localhost:5000/api/health

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm install recharts lucide-react
npm run dev
```

The app runs at **http://localhost:5173**.

> If you set the frontend up from scratch with `npm create vite@latest frontend -- --template react`, copy `App.jsx`, `AuthPage.jsx`, `CafeOS.jsx` and `api.js` into `frontend/src/`.

### Environment

| Setting | Default | Where to change |
|---------|---------|-----------------|
| Backend port | `5000` | `PORT` environment variable or `server.js` |
| API base URL | `http://localhost:5000/api` | `frontend/src/api.js` |
| Allowed CORS origins | `localhost:3000`, `localhost:5173` | `backend/server.js` |

---

## Demo Login

A demo account is created automatically:

| Field | Value |
|-------|-------|
| Email | `tara@cafeos.in` |
| Password | `cafe1234` |

You can also click **Use the demo account** on the login form, or create your own account from the **Create account** tab.

---

## API Reference

Base URL: `http://localhost:5000/api`

All responses use the shape `{ "success": true, "data": ... }`.

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tables` | List all tables |
| PATCH | `/tables/:id/status` | Update table status |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | List bookings (`?date=&status=`) |
| POST | `/bookings` | Create a booking |
| PUT | `/bookings/:id` | Update a booking |
| PATCH | `/bookings/:id/status` | Confirm or cancel |
| DELETE | `/bookings/:id` | Delete a booking |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List items (`?category=`) |
| GET | `/inventory/low-stock` | Items below minimum level |
| POST | `/inventory` | Add an item |
| PUT | `/inventory/:id` | Update an item |
| PATCH | `/inventory/:id/restock` | Add stock |
| DELETE | `/inventory/:id` | Delete an item |

### Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff` | List staff |
| GET | `/staff/:id` | Get one staff member |
| POST | `/staff` | Add staff |
| PUT | `/staff/:id` | Update staff |
| PATCH | `/staff/:id/status` | Toggle on-duty / off-duty |
| PATCH | `/staff/:id/attendance` | Record attendance |
| DELETE | `/staff/:id` | Remove staff |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (`?search=`) |
| GET | `/customers/:id` | Customer with order history |
| POST | `/customers` | Register a customer |
| PATCH | `/customers/:id/loyalty` | Add loyalty points |
| POST | `/customers/:id/orders` | Add to order history |

### Orders and Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/active` | Unpaid orders with items |
| GET | `/orders/transactions` | Today's paid orders |
| GET | `/orders/:id` | Get one order |
| POST | `/orders` | Create an order |
| PATCH | `/orders/:id/pay` | Mark as paid (`Cash`, `Card` or `UPI`) |
| DELETE | `/orders/:id` | Delete an order |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/summary` | Dashboard summary numbers |
| GET | `/analytics/revenue` | 7-day revenue trend |
| GET | `/analytics/top-items` | Best-selling items |
| GET | `/analytics/customer-growth` | New vs returning customers |
| GET | `/analytics/staff-performance` | Staff performance |
| GET | `/analytics/peak-hours` | Hour by day heatmap data |

---

## Database Schema

```
tables           id, seats, status
customers        id, name, phone, total_visits, loyalty_points, tier, preferences, last_visit
bookings         id, customer_name, phone, date, time, table_id → tables, party_size, status, requests
inventory        id, item, category, stock, unit, min_level, last_updated
staff            id, name, role, phone, shift, salary, status, schedule, attendance
orders           id, table_id → tables, customer, status, payment_method, subtotal, tax, total, created_at, paid_at
order_items      id, order_id → orders, name, qty, price
customer_orders  id, customer_id → customers, description, created_at
```

Foreign keys are enforced, and order items are deleted automatically when their order is deleted.

---

## Screenshots

> Add your screenshots to a `docs/screenshots/` folder and update the paths below.

| Dashboard | Bookings |
|-----------|----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Bookings](docs/screenshots/bookings.png) |

| Inventory | Billing |
|-----------|---------|
| ![Inventory](docs/screenshots/inventory.png) | ![Billing](docs/screenshots/billing.png) |

| Analytics | Login |
|-----------|-------|
| ![Analytics](docs/screenshots/analytics.png) | ![Login](docs/screenshots/login.png) |

---

## Known Limitations

This project is a working prototype. Please be aware of the following:

- **Authentication is frontend-only.** Accounts are stored in the browser's `localStorage` with SHA-256 hashed passwords. The backend API does not check logins, so any request to the API is accepted. Do not use this as-is for real user data.
- **Some analytics are sample data.** Customer growth, peak hours and staff performance return fixed demo values. Revenue and top items use the database once paid orders exist, and fall back to demo data otherwise.
- **Print Bill and Split Bill are UI-only.** The buttons are in place, but they don't print or split anything yet.
- **The booking date picker** on the Bookings tab is not connected to the API filter yet.
- **No real-time updates.** Data loads when a tab opens. Refresh to see changes made on another device.
- **SQLite is single-instance.** Fine for one café, but not meant for many terminals writing at once.

---

## Roadmap

- [ ] Real authentication: bcrypt password hashing and JWT sessions on the backend
- [ ] Role-based access (for example, baristas can't see Analytics)
- [ ] Live updates with WebSockets (Socket.io)
- [ ] PDF bills and email receipts
- [ ] Menu management module with fixed item prices
- [ ] Compute all analytics from real order history
- [ ] Docker setup and PostgreSQL option
- [ ] Customer mobile app (React Native)
- [ ] Multi-branch support

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

Made with ☕ and React

</div>
