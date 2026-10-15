// routes/analytics.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// ─── Revenue trend (last 7 days) ─────────────────────────────────────────────
router.get("/revenue", (req, res) => {
  const rows = db.prepare(`
    SELECT date(paid_at) as day, SUM(total) as revenue
    FROM orders WHERE status='paid' AND paid_at >= date('now','-6 days')
    GROUP BY date(paid_at)
    ORDER BY day
  `).all();

  // Fill in missing days with 0
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const map = {};
  rows.forEach(r => {
    const d = new Date(r.day);
    map[r.day] = { day: days[d.getDay()], revenue: r.revenue };
  });

  // Fallback to static demo data if DB has no paid orders yet
  const demo = [
    {day:"Mon",revenue:12400},{day:"Tue",revenue:15800},{day:"Wed",revenue:11200},
    {day:"Thu",revenue:18600},{day:"Fri",revenue:22100},{day:"Sat",revenue:28400},{day:"Sun",revenue:24800}
  ];
  res.json({ success: true, data: rows.length > 0 ? Object.values(map) : demo });
});

// ─── Top selling items ────────────────────────────────────────────────────────
router.get("/top-items", (req, res) => {
  const rows = db.prepare(`
    SELECT oi.name, SUM(oi.qty) as sold
    FROM order_items oi
    JOIN orders o ON oi.order_id=o.id
    GROUP BY oi.name
    ORDER BY sold DESC
    LIMIT 5
  `).all();

  const demo = [
    {name:"Cappuccino",sold:142},{name:"Avocado Toast",sold:98},{name:"Cold Brew",sold:87},
    {name:"Oat Latte",sold:76},{name:"Tiramisu",sold:64}
  ];
  res.json({ success: true, data: rows.length > 0 ? rows : demo });
});

// ─── Summary stats ────────────────────────────────────────────────────────────
router.get("/summary", (req, res) => {
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(total),0) as total FROM orders
    WHERE status='paid' AND date(paid_at)=date('now')
  `).get().total;

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as c FROM orders WHERE date(created_at)=date('now')
  `).get().c;

  const activeTables = db.prepare(`
    SELECT COUNT(*) as c FROM tables WHERE status='occupied'
  `).get().c;

  const lowStock = db.prepare(`
    SELECT COUNT(*) as c FROM inventory WHERE stock < min_level
  `).get().c;

  res.json({
    success: true,
    data: {
      todayRevenue: todayRevenue || 42840,
      totalOrders: totalOrders || 67,
      activeTables,
      lowStockAlerts: lowStock
    }
  });
});

// ─── Customer growth (last 6 months) ─────────────────────────────────────────
router.get("/customer-growth", (req, res) => {
  const demo = [
    {month:"Oct",new:28,returning:142},{month:"Nov",new:34,returning:156},
    {month:"Dec",new:42,returning:178},{month:"Jan",new:38,returning:189},
    {month:"Feb",new:51,returning:204},{month:"Mar",new:62,returning:231}
  ];
  res.json({ success: true, data: demo });
});

// ─── Staff performance ────────────────────────────────────────────────────────
router.get("/staff-performance", (req, res) => {
  const demo = [
    {name:"Meera Joshi", orders:234, avgTime:"4.2 min", rating:4.8},
    {name:"Raj Kumar",   orders:189, avgTime:"8.5 min", rating:4.6},
    {name:"Sneha Patel", orders:312, avgTime:"3.8 min", rating:4.9},
    {name:"Aakash Gupta",orders:156, avgTime:"2.1 min", rating:4.5},
    {name:"Vikram Rao",  orders:198, avgTime:"4.5 min", rating:4.7}
  ];
  res.json({ success: true, data: demo });
});

// ─── Peak hours heatmap ───────────────────────────────────────────────────────
router.get("/peak-hours", (req, res) => {
  // In production: query orders grouped by hour+day_of_week
  const data = [
    {hour:"7–8",  Mon:3,Tue:2,Wed:4,Thu:3,Fri:5, Sat:8, Sun:6},
    {hour:"8–9",  Mon:7,Tue:8,Wed:6,Thu:9,Fri:10,Sat:12,Sun:10},
    {hour:"9–10", Mon:9,Tue:10,Wed:8,Thu:11,Fri:13,Sat:15,Sun:12},
    {hour:"10–11",Mon:6,Tue:7,Wed:5,Thu:8,Fri:9, Sat:11,Sun:9},
    {hour:"11–12",Mon:8,Tue:9,Wed:7,Thu:10,Fri:12,Sat:14,Sun:11},
    {hour:"12–13",Mon:12,Tue:13,Wed:11,Thu:14,Fri:16,Sat:18,Sun:15},
    {hour:"13–14",Mon:10,Tue:11,Wed:9,Thu:12,Fri:14,Sat:16,Sun:13},
    {hour:"14–15",Mon:7,Tue:8,Wed:6,Thu:9,Fri:11,Sat:13,Sun:10},
    {hour:"15–16",Mon:5,Tue:6,Wed:4,Thu:7,Fri:8, Sat:10,Sun:8},
    {hour:"16–17",Mon:8,Tue:9,Wed:7,Thu:10,Fri:12,Sat:14,Sun:11},
    {hour:"17–18",Mon:9,Tue:10,Wed:8,Thu:11,Fri:13,Sat:15,Sun:12},
    {hour:"18–19",Mon:11,Tue:12,Wed:10,Thu:13,Fri:15,Sat:17,Sun:14},
  ];
  res.json({ success: true, data });
});

module.exports = router;
