// routes/bookings.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// GET all bookings (with optional date/status filter)
router.get("/", (req, res) => {
  const { date, status } = req.query;
  let sql = "SELECT * FROM bookings";
  const params = [];
  const conditions = [];
  if (date)   { conditions.push("date=?");   params.push(date); }
  if (status && status !== "All") { conditions.push("status=?"); params.push(status.toLowerCase()); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY date, time";
  res.json({ success: true, data: db.prepare(sql).all(...params) });
});

// POST create booking
router.post("/", (req, res) => {
  const { customer_name, phone, date, time, table_id, party_size, requests = "" } = req.body;
  if (!customer_name || !phone || !date || !time || !table_id || !party_size) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO bookings (customer_name,phone,date,time,table_id,party_size,requests)
    VALUES (?,?,?,?,?,?,?)
  `).run(customer_name, phone, date, time, table_id, party_size, requests);
  res.status(201).json({ success: true, data: db.prepare("SELECT * FROM bookings WHERE id=?").get(lastInsertRowid) });
});

// PUT update booking
router.put("/:id", (req, res) => {
  const { customer_name, phone, date, time, table_id, party_size, requests } = req.body;
  const result = db.prepare(`
    UPDATE bookings SET customer_name=?,phone=?,date=?,time=?,table_id=?,party_size=?,requests=?
    WHERE id=?
  `).run(customer_name, phone, date, time, table_id, party_size, requests, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Booking not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM bookings WHERE id=?").get(req.params.id) });
});

// PATCH update booking status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "confirmed", "cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
  const result = db.prepare("UPDATE bookings SET status=? WHERE id=?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Booking not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM bookings WHERE id=?").get(req.params.id) });
});

// DELETE booking
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM bookings WHERE id=?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Booking not found" });
  res.json({ success: true, message: "Booking deleted" });
});

module.exports = router;
