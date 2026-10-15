// routes/customers.js
const express = require("express");
const router = express.Router();
const db = require("../database");

const getTier = pts => pts >= 1500 ? "Gold" : pts >= 500 ? "Silver" : "Bronze";

// GET all customers (optional search)
router.get("/", (req, res) => {
  const { search } = req.query;
  let sql = "SELECT * FROM customers";
  const params = [];
  if (search) {
    sql += " WHERE name LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY loyalty_points DESC";
  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows });
});

// GET single customer with order history
router.get("/:id", (req, res) => {
  const customer = db.prepare("SELECT * FROM customers WHERE id=?").get(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
  const orders = db.prepare(
    "SELECT description, created_at FROM customer_orders WHERE customer_id=? ORDER BY created_at DESC"
  ).all(req.params.id);
  res.json({ success: true, data: { ...customer, orders: orders.map(o => o.description) } });
});

// POST create customer
router.post("/", (req, res) => {
  const { name, phone, preferences = "" } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: "Name and phone required" });
  try {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO customers (name,phone,preferences,last_visit) VALUES (?,?,?,date('now'))
    `).run(name, phone, preferences);
    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM customers WHERE id=?").get(lastInsertRowid) });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ success: false, message: "Phone already registered" });
    throw e;
  }
});

// PATCH add loyalty points (called when an order is completed)
router.patch("/:id/loyalty", (req, res) => {
  const { points } = req.body;
  const row = db.prepare("UPDATE customers SET loyalty_points=loyalty_points+?, total_visits=total_visits+1, last_visit=date('now'), tier=? WHERE id=?")
    .run(points, getTier((db.prepare("SELECT loyalty_points FROM customers WHERE id=?").get(req.params.id)?.loyalty_points||0)+points), req.params.id);
  if (row.changes === 0) return res.status(404).json({ success: false, message: "Customer not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM customers WHERE id=?").get(req.params.id) });
});

// POST add order history for customer
router.post("/:id/orders", (req, res) => {
  const { description } = req.body;
  db.prepare("INSERT INTO customer_orders (customer_id,description) VALUES (?,?)").run(req.params.id, description);
  res.status(201).json({ success: true, message: "Order history updated" });
});

module.exports = router;
