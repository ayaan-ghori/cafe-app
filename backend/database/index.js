// database/index.js — SQLite schema + seed data
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "cafeos.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tables (
    id        INTEGER PRIMARY KEY,
    seats     INTEGER NOT NULL,
    status    TEXT NOT NULL DEFAULT 'available'
              CHECK(status IN ('available','occupied','reserved'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT UNIQUE NOT NULL,
    total_visits INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    tier        TEXT DEFAULT 'Bronze' CHECK(tier IN ('Bronze','Silver','Gold')),
    preferences TEXT DEFAULT '',
    last_visit  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone       TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    table_id    INTEGER REFERENCES tables(id),
    party_size  INTEGER NOT NULL,
    status      TEXT DEFAULT 'pending'
                CHECK(status IN ('pending','confirmed','cancelled')),
    requests    TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    item         TEXT NOT NULL,
    category     TEXT NOT NULL
                 CHECK(category IN ('Beverages','Food','Packaging','Cleaning')),
    stock        REAL NOT NULL DEFAULT 0,
    unit         TEXT NOT NULL,
    min_level    REAL NOT NULL DEFAULT 0,
    last_updated TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS staff (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    role       TEXT NOT NULL
               CHECK(role IN ('Barista','Chef','Waiter','Cashier','Manager')),
    phone      TEXT NOT NULL,
    shift      TEXT NOT NULL,
    salary     INTEGER NOT NULL,
    status     TEXT DEFAULT 'off-duty'
               CHECK(status IN ('on-duty','off-duty')),
    schedule   TEXT DEFAULT '[]',
    attendance TEXT DEFAULT '{"present":0,"absent":0,"late":0}'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id    INTEGER REFERENCES tables(id),
    customer    TEXT NOT NULL,
    status      TEXT DEFAULT 'active'
                CHECK(status IN ('active','paid')),
    payment_method TEXT DEFAULT '',
    subtotal    REAL DEFAULT 0,
    tax         REAL DEFAULT 0,
    total       REAL DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    paid_at     TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id  INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    qty       INTEGER NOT NULL DEFAULT 1,
    price     REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    description TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// ─── SEED (only if empty) ─────────────────────────────────────────────────────
const alreadySeeded = db.prepare("SELECT COUNT(*) as c FROM tables").get().c > 0;

if (!alreadySeeded) {
  console.log("🌱 Seeding database...");

  // Tables
  const insertTable = db.prepare("INSERT INTO tables (id,seats,status) VALUES (?,?,?)");
  const tableData = [
    [1,"occupied",4],[2,"available",2],[3,"reserved",6],[4,"occupied",4],
    [5,"available",2],[6,"available",8],[7,"occupied",4],[8,"reserved",2],
    [9,"available",6],[10,"occupied",4],[11,"available",2],[12,"reserved",4],
  ];
  tableData.forEach(([id,status,seats]) => insertTable.run(id,seats,status));

  // Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name,phone,total_visits,loyalty_points,tier,preferences,last_visit)
    VALUES (?,?,?,?,?,?,?)
  `);
  const customerData = [
    ["Aryan Mehta","9876543210",34,1240,"Gold","Strong coffee, no sugar","2026-03-26"],
    ["Priya Sharma","9123456789",18,620,"Silver","Oat milk lattes, vegan options","2026-03-24"],
    ["Rohan Verma","9988776655",7,210,"Bronze","Classic black coffee","2026-03-22"],
    ["Ananya Singh","9871234560",52,2180,"Gold","Double shot espresso, no milk","2026-03-26"],
    ["Dev Kapoor","9765432109",12,390,"Bronze","Iced drinks, sweet options","2026-03-20"],
    ["Zara Khan","9654321098",29,980,"Silver","Herbal teas, light snacks","2026-03-18"],
  ];
  customerData.forEach(c => insertCustomer.run(...c));

  // Customer order history
  const insertCustOrder = db.prepare("INSERT INTO customer_orders (customer_id,description) VALUES (?,?)");
  [
    [1,"Cappuccino + Avocado Toast"],[1,"Cold Brew + Tiramisu"],[1,"Latte + Croissant"],
    [2,"Oat Latte + Muffin"],[2,"Matcha Latte + Toast"],
    [3,"Americano + Croissant"],
    [4,"Espresso + Eggs Benedict"],[4,"Flat White + Pancakes"],[4,"Cold Brew + Avocado Toast"],
    [5,"Iced Caramel Latte + Blueberry Muffin"],
    [6,"Earl Grey + Croissant"],[6,"Chamomile + Toast"],
  ].forEach(r => insertCustOrder.run(...r));

  // Bookings
  const insertBooking = db.prepare(`
    INSERT INTO bookings (customer_name,phone,date,time,table_id,party_size,status,requests)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  [
    ["Aryan Mehta","9876543210","2026-03-26","12:00",3,4,"confirmed","Window seat preferred"],
    ["Priya Sharma","9123456789","2026-03-26","13:30",8,2,"confirmed",""],
    ["Dev Kapoor","9988776655","2026-03-26","19:00",12,5,"pending","Birthday cake please"],
    ["Meera Joshi","9871234560","2026-03-27","11:00",5,3,"confirmed","Vegan menu"],
    ["Kabir Nair","9765432109","2026-03-27","20:00",6,8,"pending","Anniversary dinner"],
    ["Zara Khan","9654321098","2026-03-25","15:00",2,2,"cancelled",""],
  ].forEach(b => insertBooking.run(...b));

  // Inventory
  const insertInv = db.prepare(`
    INSERT INTO inventory (item,category,stock,unit,min_level,last_updated)
    VALUES (?,?,?,?,?,?)
  `);
  [
    ["Coffee Beans (Arabica)","Beverages",5,"kg",10,"2026-03-25"],
    ["Whole Milk","Beverages",18,"L",20,"2026-03-26"],
    ["Oat Milk","Beverages",8,"L",5,"2026-03-26"],
    ["Croissants","Food",24,"pcs",10,"2026-03-26"],
    ["Sourdough Bread","Food",3,"loaves",5,"2026-03-25"],
    ["Avocado","Food",12,"pcs",10,"2026-03-26"],
    ["Takeaway Cups (M)","Packaging",180,"pcs",200,"2026-03-24"],
    ["Napkins","Packaging",500,"pcs",200,"2026-03-20"],
    ["Hand Sanitizer","Cleaning",4,"bottles",5,"2026-03-22"],
    ["Dish Soap","Cleaning",6,"bottles",3,"2026-03-21"],
    ["Earl Grey Tea","Beverages",200,"bags",100,"2026-03-23"],
    ["Pasta","Food",4,"kg",5,"2026-03-25"],
  ].forEach(i => insertInv.run(...i));

  // Staff
  const insertStaff = db.prepare(`
    INSERT INTO staff (name,role,phone,shift,salary,status,schedule,attendance)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  [
    ["Meera Joshi","Barista","9876541230","Morning (7AM–3PM)",28000,"on-duty",
     '["Mon","Tue","Wed","Thu","Fri"]','{"present":22,"absent":1,"late":2}'],
    ["Raj Kumar","Chef","9765432181","Morning (7AM–3PM)",35000,"on-duty",
     '["Mon","Tue","Wed","Fri","Sat"]','{"present":20,"absent":2,"late":3}'],
    ["Sneha Patel","Waiter","9654321072","Evening (3PM–11PM)",22000,"off-duty",
     '["Tue","Wed","Thu","Fri","Sat"]','{"present":23,"absent":0,"late":1}'],
    ["Aakash Gupta","Cashier","9543210963","Evening (3PM–11PM)",24000,"off-duty",
     '["Mon","Wed","Thu","Sat","Sun"]','{"present":21,"absent":2,"late":2}'],
    ["Tara Singh","Manager","9432109854","Full Day (10AM–7PM)",45000,"on-duty",
     '["Mon","Tue","Wed","Thu","Fri","Sat"]','{"present":24,"absent":0,"late":0}'],
    ["Vikram Rao","Barista","9321098745","Morning (7AM–3PM)",26000,"on-duty",
     '["Mon","Tue","Thu","Fri","Sun"]','{"present":19,"absent":3,"late":3}'],
  ].forEach(s => insertStaff.run(...s));

  // Active orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (table_id,customer,status,subtotal,tax,total)
    VALUES (?,?,?,?,?,?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id,name,qty,price) VALUES (?,?,?,?)
  `);

  const ordersData = [
    { table:1, customer:"Aryan Mehta",  items:[["Cappuccino",2,180],["Croissant",1,120],["Avocado Toast",1,220]] },
    { table:4, customer:"Priya Sharma", items:[["Oat Latte",1,200],["Blueberry Muffin",2,140]] },
    { table:7, customer:"Rohan Verma",  items:[["Cold Brew",1,190],["Pasta Arrabbiata",1,380],["Tiramisu",1,240]] },
    { table:10, customer:"Ananya Singh",items:[["Flat White",1,180],["Eggs Benedict",1,320]] },
  ];
  ordersData.forEach(o => {
    const sub = o.items.reduce((s,[,q,p])=>s+q*p,0);
    const tax = Math.round(sub * 0.10);
    const { lastInsertRowid } = insertOrder.run(o.table, o.customer, "active", sub, tax, sub+tax);
    o.items.forEach(([name,qty,price]) => insertOrderItem.run(lastInsertRowid, name, qty, price));
  });

  // Paid transactions
  const insertPaid = db.prepare(`
    INSERT INTO orders (table_id,customer,status,payment_method,subtotal,tax,total,paid_at)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  [
    [null,"Dev Kapoor","paid","UPI",527,53,580,"2026-03-26 10:23"],
    [null,"Meera Joshi","paid","Card",309,31,340,"2026-03-26 11:05"],
    [null,"Kabir Nair","paid","Cash",1127,113,1240,"2026-03-26 11:48"],
    [null,"Zara Khan","paid","UPI",382,38,420,"2026-03-26 12:30"],
  ].forEach(r => insertPaid.run(...r));

  console.log("✅ Database seeded successfully.");
}

module.exports = db;
