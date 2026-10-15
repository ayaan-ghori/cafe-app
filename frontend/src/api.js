// src/api.js — Centralised API client for CaféOS
const BASE = "http://localhost:5000/api";

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data;
};

export const api = {
  // Tables
  getTables:         ()          => req("GET",  "/tables"),
  setTableStatus:    (id, status)=> req("PATCH",`/tables/${id}/status`, { status }),

  // Bookings
  getBookings:       (params={}) => req("GET",  `/bookings?${new URLSearchParams(params)}`),
  createBooking:     (data)      => req("POST", "/bookings", data),
  updateBooking:     (id, data)  => req("PUT",  `/bookings/${id}`, data),
  setBookingStatus:  (id, status)=> req("PATCH",`/bookings/${id}/status`, { status }),
  deleteBooking:     (id)        => req("DELETE",`/bookings/${id}`),

  // Inventory
  getInventory:      (cat)       => req("GET",  `/inventory${cat && cat!=="All" ? `?category=${cat}` : ""}`),
  getLowStock:       ()          => req("GET",  "/inventory/low-stock"),
  addInventoryItem:  (data)      => req("POST", "/inventory", data),
  updateInventory:   (id, data)  => req("PUT",  `/inventory/${id}`, data),
  restock:           (id, qty)   => req("PATCH",`/inventory/${id}/restock`, { quantity: qty }),
  deleteInventory:   (id)        => req("DELETE",`/inventory/${id}`),

  // Staff
  getStaff:          ()          => req("GET",  "/staff"),
  addStaff:          (data)      => req("POST", "/staff", data),
  updateStaff:       (id, data)  => req("PUT",  `/staff/${id}`, data),
  setStaffStatus:    (id, status)=> req("PATCH",`/staff/${id}/status`, { status }),
  deleteStaff:       (id)        => req("DELETE",`/staff/${id}`),

  // Customers
  getCustomers:      (search="") => req("GET",  `/customers${search ? `?search=${search}` : ""}`),
  getCustomer:       (id)        => req("GET",  `/customers/${id}`),
  createCustomer:    (data)      => req("POST", "/customers", data),

  // Orders / Billing
  getActiveOrders:   ()          => req("GET",  "/orders/active"),
  getTransactions:   ()          => req("GET",  "/orders/transactions"),
  createOrder:       (data)      => req("POST", "/orders", data),
  markPaid:          (id, method)=> req("PATCH",`/orders/${id}/pay`, { payment_method: method }),

  // Analytics
  getSummary:        ()          => req("GET",  "/analytics/summary"),
  getRevenue:        ()          => req("GET",  "/analytics/revenue"),
  getTopItems:       ()          => req("GET",  "/analytics/top-items"),
  getCustomerGrowth: ()          => req("GET",  "/analytics/customer-growth"),
  getStaffPerf:      ()          => req("GET",  "/analytics/staff-performance"),
  getPeakHours:      ()          => req("GET",  "/analytics/peak-hours"),
};
