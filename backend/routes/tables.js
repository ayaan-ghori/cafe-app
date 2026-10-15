// routes/tables.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// GET all tables
router.get("/", (req, res) => {
  const tables = db.prepare("SELECT * FROM tables ORDER BY id").all();
  res.json({ success: true, data: tables });
});

// PATCH update table status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const valid = ["available", "occupied", "reserved"];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const result = db.prepare("UPDATE tables SET status=? WHERE id=?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Table not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM tables WHERE id=?").get(req.params.id) });
});

module.exports = router;
