// routes/staff.js
const express = require("express");
const router = express.Router();
const db = require("../database");

const parse = (staff) => ({
  ...staff,
  schedule: JSON.parse(staff.schedule || "[]"),
  attendance: JSON.parse(staff.attendance || '{"present":0,"absent":0,"late":0}')
});

// GET all staff
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM staff ORDER BY name").all();
  res.json({ success: true, data: rows.map(parse) });
});

// GET single staff
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM staff WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
  res.json({ success: true, data: parse(row) });
});

// POST add staff
router.post("/", (req, res) => {
  const { name, role, phone, shift, salary, schedule = [], status = "off-duty" } = req.body;
  if (!name || !role || !phone || !shift || !salary) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO staff (name,role,phone,shift,salary,status,schedule)
    VALUES (?,?,?,?,?,?,?)
  `).run(name, role, phone, shift, salary, status, JSON.stringify(schedule));
  const row = db.prepare("SELECT * FROM staff WHERE id=?").get(lastInsertRowid);
  res.status(201).json({ success: true, data: parse(row) });
});

// PUT update staff
router.put("/:id", (req, res) => {
  const { name, role, phone, shift, salary, status, schedule } = req.body;
  const result = db.prepare(`
    UPDATE staff SET name=?,role=?,phone=?,shift=?,salary=?,status=?,schedule=? WHERE id=?
  `).run(name, role, phone, shift, salary, status, JSON.stringify(schedule || []), req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Staff not found" });
  res.json({ success: true, data: parse(db.prepare("SELECT * FROM staff WHERE id=?").get(req.params.id)) });
});

// PATCH toggle duty status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["on-duty","off-duty"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  db.prepare("UPDATE staff SET status=? WHERE id=?").run(status, req.params.id);
  res.json({ success: true, data: parse(db.prepare("SELECT * FROM staff WHERE id=?").get(req.params.id)) });
});

// PATCH update attendance
router.patch("/:id/attendance", (req, res) => {
  const { type } = req.body; // "present"|"absent"|"late"
  const row = db.prepare("SELECT attendance FROM staff WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: "Staff not found" });
  const att = JSON.parse(row.attendance);
  att[type] = (att[type] || 0) + 1;
  db.prepare("UPDATE staff SET attendance=? WHERE id=?").run(JSON.stringify(att), req.params.id);
  res.json({ success: true, data: att });
});

// DELETE staff
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM staff WHERE id=?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Staff not found" });
  res.json({ success: true, message: "Staff member removed" });
});

module.exports = router;
