// routes/orders.js
const express = require("express");
const router = express.Router();
const db = require("../database");

const withItems = (order) => ({
  ...order,
  items: db.prepare("SELECT * FROM order_items WHERE order_id=?").all(order.id)
});

// GET active orders
router.get("/active", (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE status='active' ORDER BY created_at").all();
  res.json({ success: true, data: orders.map(withItems) });
});

// GET today's paid transactions
router.get("/transactions", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM orders WHERE status='paid' AND date(paid_at)=date('now')
    ORDER BY paid_at DESC
  `).all();
  res.json({ success: true, data: rows.map(o => ({
    id: o.id,
    customer: o.customer,
    amount: o.total,
    method: o.payment_method,
    time: o.paid_at ? new Date(o.paid_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"
  })) });
});

// GET single order
router.get("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, data: withItems(order) });
});

// POST create new order
router.post("/", (req, res) => {
  const { table_id, customer, items } = req.body;
  if (!table_id || !customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "table_id, customer, and items[] required" });
  }
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = Math.round(subtotal * 0.10);
  const total = subtotal + tax;

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO orders (table_id,customer,subtotal,tax,total) VALUES (?,?,?,?,?)
  `).run(table_id, customer, subtotal, tax, total);

  const insertItem = db.prepare("INSERT INTO order_items (order_id,name,qty,price) VALUES (?,?,?,?)");
  items.forEach(i => insertItem.run(lastInsertRowid, i.name, i.qty, i.price));

  // Mark table as occupied
  db.prepare("UPDATE tables SET status='occupied' WHERE id=?").run(table_id);

  res.status(201).json({ success: true, data: withItems(db.prepare("SELECT * FROM orders WHERE id=?").get(lastInsertRowid)) });
});

// PATCH mark as paid
router.patch("/:id/pay", (req, res) => {
  const { payment_method } = req.body;
  if (!["Cash","Card","UPI"].includes(payment_method)) {
    return res.status(400).json({ success: false, message: "Invalid payment method" });
  }
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  db.prepare(`
    UPDATE orders SET status='paid', payment_method=?, paid_at=datetime('now') WHERE id=?
  `).run(payment_method, req.params.id);

  // Free the table
  if (order.table_id) db.prepare("UPDATE tables SET status='available' WHERE id=?").run(order.table_id);

  res.json({ success: true, data: withItems(db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id)) });
});

// DELETE order
router.delete("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  db.prepare("DELETE FROM orders WHERE id=?").run(req.params.id);
  if (order.table_id) db.prepare("UPDATE tables SET status='available' WHERE id=?").run(order.table_id);
  res.json({ success: true, message: "Order deleted" });
});

module.exports = router;
