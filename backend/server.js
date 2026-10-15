// server.js — CaféOS Backend Entry Point
const express = require("express");
const cors = require("cors");

// Initialize DB (creates + seeds if first run)
require("./database");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"], // React dev servers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toLocaleTimeString("en-IN");
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/tables",    require("./routes/tables"));
app.use("/api/bookings",  require("./routes/bookings"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/staff",     require("./routes/staff"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/orders",    require("./routes/orders"));
app.use("/api/analytics", require("./routes/analytics"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "CaféOS API running ☕",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ─── API REFERENCE ────────────────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    name: "CaféOS REST API",
    version: "1.0.0",
    endpoints: {
      tables:    "GET /api/tables | PATCH /api/tables/:id/status",
      bookings:  "GET POST /api/bookings | PUT PATCH DELETE /api/bookings/:id",
      inventory: "GET POST /api/inventory | GET /api/inventory/low-stock | PUT DELETE PATCH /api/inventory/:id",
      staff:     "GET POST /api/staff | PUT DELETE PATCH /api/staff/:id",
      customers: "GET POST /api/customers | GET /api/customers/:id | PATCH /api/customers/:id/loyalty",
      orders:    "GET /api/orders/active | GET /api/orders/transactions | POST /api/orders | PATCH /api/orders/:id/pay",
      analytics: "GET /api/analytics/summary | /revenue | /top-items | /customer-growth | /staff-performance | /peak-hours"
    }
  });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n☕ CaféOS API Server`);
  console.log(`   Running on  → http://localhost:${PORT}`);
  console.log(`   Health      → http://localhost:${PORT}/api/health`);
  console.log(`   API Index   → http://localhost:${PORT}/api\n`);
});
