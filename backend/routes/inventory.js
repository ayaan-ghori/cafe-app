// routes/inventory.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// GET all inventory (optional category filter)
router.get("/", (req, res) => {
  const { category } = req.query;
  let sql = "SELECT * FROM inventory";
  const params = [];
  if (category && category !== "All") { sql += " WHERE category=?"; params.push(category); }
  sql += " ORDER BY category, item";
  const rows = db.prepare(sql).all(...params);

  // Compute status dynamically
  const withStatus = rows.map(r => ({
    ...r,
    status: r.stock / r.min_level <= 0.5 ? "Critical" : r.stock < r.min_level ? "Low" : "OK"
  }));
  res.json({ success: true, data: withStatus });
});

// GET low-stock items
router.get("/low-stock", (req, res) => {
  const rows = db.prepare("SELECT * FROM inventory").all();
  const low = rows.filter(r => r.stock < r.min_level).map(r => ({
    ...r,
    status: r.stock / r.min_level <= 0.5 ? "Critical" : "Low"
  }));
  res.json({ success: true, data: low });
});

// POST add item
router.post("/", (req, res) => {
  const { item, category, stock, unit, min_level } = req.body;
  if (!item || !category || stock === undefined || !unit || !min_level) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO inventory (item,category,stock,unit,min_level) VALUES (?,?,?,?,?)
  `).run(item, category, stock, unit, min_level);
  res.status(201).json({ success: true, data: db.prepare("SELECT * FROM inventory WHERE id=?").get(lastInsertRowid) });
});

// PUT update inventory item
router.put("/:id", (req, res) => {
  const { item, category, stock, unit, min_level } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const result = db.prepare(`
    UPDATE inventory SET item=?,category=?,stock=?,unit=?,min_level=?,last_updated=? WHERE id=?
  `).run(item, category, stock, unit, min_level, today, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM inventory WHERE id=?").get(req.params.id) });
});

// PATCH restock
router.patch("/:id/restock", (req, res) => {
  const { quantity } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const result = db.prepare(`
    UPDATE inventory SET stock=stock+?,last_updated=? WHERE id=?
  `).run(quantity, today, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
  res.json({ success: true, data: db.prepare("SELECT * FROM inventory WHERE id=?").get(req.params.id) });
});

// DELETE item
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM inventory WHERE id=?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
  res.json({ success: true, message: "Item deleted" });
});

module.exports = router;
