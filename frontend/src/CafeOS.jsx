// CafeOS.jsx — Full frontend wired to Express + SQLite backend
// Drop api.js alongside this file, then: npm install recharts lucide-react
import { useState, useEffect, useCallback } from "react";
import {
  Home, Calendar, Package, Users, User, CreditCard, BarChart2,
  Bell, Search, Plus, ChevronDown, X, Check, Clock, Coffee,
  AlertTriangle, ShoppingBag, Star, Phone, Printer, Utensils,
  Edit, RefreshCw, IndianRupee, ArrowUpRight, Leaf, Loader, Wifi, WifiOff
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { api } from "./api";
import { LogOut } from "lucide-react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  brown:"#6F4E37", brownLight:"#8B6347", tan:"#C8A97E",
  cream:"#FDF6EC", creamDark:"#F5E6D0",
  green:"#4CAF50", red:"#E57373", yellow:"#FFB74D",
  blue:"#64B5F6", sidebar:"#3D2B1F",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => `₹${Number(n).toLocaleString("en-IN")}`;
const getInvStatus = item => {
  const r = item.stock / item.min_level;
  return r <= 0.5 ? "Critical" : r < 1 ? "Low" : "OK";
};
const initials = name => name.split(" ").map(n=>n[0]).join("").toUpperCase();

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const IS = {
  width:"100%", padding:"10px 14px", borderRadius:10,
  border:`1.5px solid ${C.tan}`, background:"#fff",
  fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#333",
  outline:"none", boxSizing:"border-box",
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Spinner({ size=20 }) {
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}>
      <Loader size={size} color={C.tan} style={{animation:"spin 1s linear infinite"}}/>
    </div>
  );
}

function Toast({ msg, type="success" }) {
  if (!msg) return null;
  const bg = type==="error"?C.red:C.green;
  return (
    <div style={{position:"fixed",bottom:24,right:24,background:bg,color:"#fff",borderRadius:12,padding:"12px 20px",zIndex:2000,fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.2)",animation:"fadeUp .2s ease-out"}}>
      {msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return [toast, show];
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(5px)"}}/>
      <div style={{position:"relative",background:C.cream,borderRadius:20,padding:28,width:"90%",maxWidth:500,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.25)",animation:"fadeUp .22s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.brown}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><X size={20} color={C.brown}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FF({ label, ...props }) {
  const el = props.as==="select"
    ? <select style={IS} {...props}>{props.children}</select>
    : props.as==="textarea"
    ? <textarea style={{...IS,minHeight:76,resize:"vertical"}} {...props}/>
    : <input style={IS} {...props}/>;
  return (
    <div style={{marginBottom:15}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:C.brown,marginBottom:5,fontFamily:"'DM Sans',sans-serif",letterSpacing:.8}}>{label}</label>
      {el}
    </div>
  );
}

function PillBtn({ children, icon, onClick, variant="primary", size="md", disabled=false }) {
  const bg = variant==="primary"?C.brown:variant==="success"?C.green:variant==="danger"?C.red:variant==="outline"?"transparent":"#fff";
  const col = variant==="outline"?C.brown:"#fff";
  const bdr = variant==="outline"?`1.5px solid ${C.brown}`:"none";
  const pad = size==="sm"?"5px 13px":"9px 20px";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{display:"inline-flex",alignItems:"center",gap:6,background:disabled?"#ddd":bg,color:disabled?"#aaa":col,border:bdr,borderRadius:999,padding:pad,fontSize:size==="sm"?12:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s",opacity:disabled?.6:1,whiteSpace:"nowrap"}}>
      {icon&&<span style={{display:"flex"}}>{icon}</span>}
      {children}
    </button>
  );
}

function Badge({ status }) {
  const MAP = {
    confirmed:["#E8F5E9","#2E7D32","✓ Confirmed"],
    pending:  ["#FFF3E0","#E65100","⏳ Pending"],
    cancelled:["#FFEBEE","#C62828","✕ Cancelled"],
    preparing:["#FFF3E0","#E65100","🔥 Preparing"],
    ready:    ["#E3F2FD","#1565C0","✓ Ready"],
    served:   ["#E8F5E9","#2E7D32","✓ Served"],
    "on-duty":["#E8F5E9","#2E7D32","● On Duty"],
    "off-duty":["#F3F4F6","#6B7280","○ Off Duty"],
    OK:       ["#E8F5E9","#2E7D32","✓ OK"],
    Low:      ["#FFF3E0","#E65100","▲ Low"],
    Critical: ["#FFEBEE","#C62828","⚠ Critical"],
    Gold:     ["#FFF8E1","#F57F17","🥇 Gold"],
    Silver:   ["#F5F5F5","#616161","🥈 Silver"],
    Bronze:   ["#FBE9E7","#BF360C","🥉 Bronze"],
    active:   ["#E3F2FD","#1565C0","● Active"],
    paid:     ["#E8F5E9","#2E7D32","✓ Paid"],
  };
  const [bg,col,lbl] = MAP[status]||["#eee","#555",status];
  return <span style={{background:bg,color:col,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{lbl}</span>;
}

function Card({ children, style={}, hover=true }) {
  const [raised,setRaised] = useState(false);
  return (
    <div onMouseEnter={()=>hover&&setRaised(true)} onMouseLeave={()=>hover&&setRaised(false)}
      style={{background:"#fff",borderRadius:16,padding:20,boxShadow:raised?"0 10px 28px rgba(0,0,0,.10)":"0 2px 12px rgba(0,0,0,.06)",transition:"all .2s",transform:raised?"translateY(-2px)":"none",...style}}>
      {children}
    </div>
  );
}

// ─── API STATUS INDICATOR ─────────────────────────────────────────────────────
function ApiStatus() {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then(r=>r.json()).then(()=>setOk(true)).catch(()=>setOk(false));
  }, []);
  if (ok === null) return null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:ok?C.green:C.red,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
      {ok?<Wifi size={13}/>:<WifiOff size={13}/>}
      {ok?"API Connected":"API Offline — using demo data"}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardTab({ setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTables(), api.getActiveOrders()])
      .then(([s,t,o]) => { setSummary(s); setTables(t); setOrders(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tableColor = s => s==="available"?C.green:s==="occupied"?C.red:"#FFB74D";

  const stats = summary ? [
    {label:"Today's Revenue", value:fmt(summary.todayRevenue), icon:<IndianRupee size={22}/>, color:C.green, sub:"+12% from yesterday"},
    {label:"Active Tables",   value:`${summary.activeTables} / ${tables.length}`, icon:<Utensils size={22}/>, color:C.tan, sub:`${tables.filter(t=>t.status==="reserved").length} reserved`},
    {label:"Total Orders",    value:String(summary.totalOrders), icon:<ShoppingBag size={22}/>, color:C.blue, sub:"today"},
    {label:"Low Stock Alerts",value:`${summary.lowStockAlerts} items`, icon:<AlertTriangle size={22}/>, color:C.red, sub:"needs reorder"},
  ] : [];

  if (loading) return <Spinner/>;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18,marginBottom:24}}>
        {stats.map((s,i)=>(
          <Card key={i} style={{display:"flex",alignItems:"center",gap:18,padding:"20px 22px"}}>
            <div style={{background:s.color+"22",borderRadius:14,padding:13,color:s.color,flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontSize:12,color:"#999",fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:24,fontWeight:700,color:"#1a1a1a",fontFamily:"'Playfair Display',serif"}}>{s.value}</div>
              <div style={{fontSize:11,color:"#bbb",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3}}>
                <ArrowUpRight size={11}/>{s.sub}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
        {/* Table Map */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.brown}}>Live Table Map</h3>
            <div style={{display:"flex",gap:12,fontSize:11,fontFamily:"'DM Sans',sans-serif",color:"#888"}}>
              {[["Available",C.green],["Occupied",C.red],["Reserved","#FFB74D"]].map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {tables.map(t=>{
              const col = tableColor(t.status);
              return (
                <div key={t.id} style={{background:col+"18",border:`2px solid ${col}40`,borderRadius:12,padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all .18s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=col+"30";e.currentTarget.style.transform="scale(1.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=col+"18";e.currentTarget.style.transform="";}}>
                  <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"'DM Sans',sans-serif"}}>T-{t.id}</div>
                  <div style={{fontSize:10,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{t.seats}p</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.brown,marginBottom:14}}>Active Orders</h3>
          {orders.length===0
            ? <div style={{textAlign:"center",color:"#ccc",padding:20,fontFamily:"'DM Sans',sans-serif"}}>No active orders ☕</div>
            : orders.map(o=>(
              <div key={o.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:C.cream,borderRadius:12,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:11}}>
                  <div style={{background:C.brown+"22",borderRadius:10,padding:8,flexShrink:0}}>
                    <Coffee size={15} color={C.brown}/>
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{o.customer}</div>
                    <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>Table {o.table_id} · {o.items?.length} items</div>
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.brown,fontFamily:"'DM Sans',sans-serif"}}>{fmt(o.total)}</span>
              </div>
            ))
          }
        </Card>
      </div>

      <Card style={{padding:"20px 24px"}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.brown,marginBottom:14}}>Quick Actions</h3>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <PillBtn icon={<Plus size={15}/>} onClick={()=>setActiveTab("bookings")}>New Booking</PillBtn>
          <PillBtn icon={<ShoppingBag size={15}/>} onClick={()=>setActiveTab("billing")} variant="outline">Add Order</PillBtn>
          <PillBtn icon={<BarChart2 size={15}/>} onClick={()=>setActiveTab("analytics")} variant="outline">View Reports</PillBtn>
          <PillBtn icon={<RefreshCw size={15}/>} variant="outline" onClick={()=>window.location.reload()}>Refresh</PillBtn>
        </div>
      </Card>
    </div>
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
function BookingsTab() {
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [form, setForm] = useState({customer_name:"",phone:"",date:"",time:"",table_id:"",party_size:"",requests:""});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getBookings(), api.getTables()])
      .then(([b,t]) => { setBookings(b); setTables(t); })
      .catch(() => showToast("Failed to load bookings","error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const fp = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const filtered = filter==="All" ? bookings : bookings.filter(b=>b.status===filter.toLowerCase());

  const openEdit = b => {
    setEditTarget(b);
    setForm({customer_name:b.customer_name,phone:b.phone,date:b.date,time:b.time,table_id:b.table_id,party_size:b.party_size,requests:b.requests});
    setShowModal(true);
  };

  const saveBooking = async () => {
    setSaving(true);
    try {
      if (editTarget) await api.updateBooking(editTarget.id, form);
      else await api.createBooking(form);
      showToast(editTarget ? "Booking updated ✓" : "Booking created ✓");
      setShowModal(false); setEditTarget(null); load();
    } catch(e) { showToast(e.message,"error"); }
    setSaving(false);
  };

  const changeStatus = async (id, status) => {
    try { await api.setBookingStatus(id, status); showToast(`Booking ${status}`); load(); }
    catch(e) { showToast(e.message,"error"); }
  };

  if (loading) return <Spinner/>;

  return (
    <div>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["All","Confirmed","Pending","Cancelled"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 18px",borderRadius:999,border:`1.5px solid ${filter===f?C.brown:"#ddd"}`,background:filter===f?C.brown:"#fff",color:filter===f?"#fff":"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s"}}>{f}</button>
          ))}
        </div>
        <PillBtn icon={<Plus size={15}/>} onClick={()=>{setEditTarget(null);setForm({customer_name:"",phone:"",date:"",time:"",table_id:"",party_size:"",requests:""});setShowModal(true);}}>New Booking</PillBtn>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:"#bbb"}}>
          <Coffee size={52} color="#e0d4c8" style={{margin:"0 auto 16px",display:"block"}}/>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8,color:"#ccc"}}>No bookings yet today ☕</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Add one using the button above.</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {filtered.map(b=>(
            <Card key={b.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{b.customer_name}</div>
                  <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif",marginTop:2}}><Phone size={10}/> {b.phone}</div>
                </div>
                <Badge status={b.status}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[[<Calendar size={13}/>,b.date],[<Clock size={13}/>,b.time],[<Utensils size={13}/>,`Table ${b.table_id}`],[<Users size={13}/>,`${b.party_size} guests`]].map(([ic,v],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#666",fontFamily:"'DM Sans',sans-serif"}}>
                    <span style={{color:C.tan}}>{ic}</span>{v}
                  </div>
                ))}
              </div>
              {b.requests&&<div style={{background:C.cream,borderRadius:8,padding:"8px 12px",fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>💬 {b.requests}</div>}
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {b.status!=="confirmed"&&<PillBtn size="sm" icon={<Check size={12}/>} variant="success" onClick={()=>changeStatus(b.id,"confirmed")}>Confirm</PillBtn>}
                <PillBtn size="sm" icon={<Edit size={12}/>} variant="outline" onClick={()=>openEdit(b)}>Edit</PillBtn>
                {b.status!=="cancelled"&&<PillBtn size="sm" icon={<X size={12}/>} variant="danger" onClick={()=>changeStatus(b.id,"cancelled")}>Cancel</PillBtn>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={()=>{setShowModal(false);setEditTarget(null);}} title={editTarget?"Edit Booking":"New Booking"}>
        <FF label="CUSTOMER NAME" value={form.customer_name} onChange={fp("customer_name")} placeholder="Full Name"/>
        <FF label="PHONE" value={form.phone} onChange={fp("phone")} placeholder="10-digit number"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="DATE" type="date" value={form.date} onChange={fp("date")}/>
          <FF label="TIME" type="time" value={form.time} onChange={fp("time")}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="TABLE" as="select" value={form.table_id} onChange={fp("table_id")}>
            <option value="">Select Table</option>
            {tables.filter(t=>t.status!=="occupied").map(t=><option key={t.id} value={t.id}>Table {t.id} ({t.seats} seats)</option>)}
          </FF>
          <FF label="PARTY SIZE" type="number" min="1" value={form.party_size} onChange={fp("party_size")}/>
        </div>
        <FF label="SPECIAL REQUESTS" as="textarea" value={form.requests} onChange={fp("requests")} placeholder="Any special requirements…"/>
        <PillBtn onClick={saveBooking} disabled={saving}>{saving?"Saving…":"Save Booking"}</PillBtn>
      </Modal>
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function InventoryTab() {
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [lowItems, setLowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [form, setForm] = useState({item:"",category:"Beverages",stock:"",unit:"",min_level:""});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getInventory(catFilter), api.getLowStock()])
      .then(([inv,low]) => { setItems(inv); setLowItems(low); })
      .catch(() => showToast("Failed to load inventory","error"))
      .finally(() => setLoading(false));
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  const fp = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const cats = ["All","Beverages","Food","Packaging","Cleaning"];

  const addItem = async () => {
    setSaving(true);
    try {
      await api.addInventoryItem({...form, stock:+form.stock, min_level:+form.min_level});
      showToast("Item added ✓"); setShowModal(false); load();
    } catch(e) { showToast(e.message,"error"); }
    setSaving(false);
  };

  if (loading) return <Spinner/>;

  return (
    <div>
      <Toast msg={toast?.msg} type={toast?.type}/>
      {lowItems.length>0&&(
        <div style={{background:"#FFF3E0",border:"1.5px solid #FFB74D",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <AlertTriangle size={17} color="#E65100"/>
          <span style={{fontSize:13,color:"#E65100",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            {lowItems.length} items need restocking: {lowItems.map(i=>i.item).join(" · ")}
          </span>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{padding:"7px 16px",borderRadius:999,border:`1.5px solid ${catFilter===c?C.brown:"#ddd"}`,background:catFilter===c?C.brown:"#fff",color:catFilter===c?"#fff":"#666",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s"}}>{c}</button>
          ))}
        </div>
        <PillBtn icon={<Plus size={15}/>} onClick={()=>setShowModal(true)}>Add Item</PillBtn>
      </div>

      <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif",minWidth:640}}>
            <thead>
              <tr style={{background:C.brown+"12"}}>
                {["Item","Category","Stock","Unit","Min Level","Status","Last Updated"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"12px 16px",fontSize:11,fontWeight:700,color:C.brown,letterSpacing:.6}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item=>{
                const st = item.status || getInvStatus(item);
                return (
                  <tr key={item.id} style={{borderTop:"1px solid #f5f0eb",background:st==="Critical"?"#FFF5F5":st==="Low"?"#FFFBF0":"transparent",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F9F5F0"}
                    onMouseLeave={e=>e.currentTarget.style.background=st==="Critical"?"#FFF5F5":st==="Low"?"#FFFBF0":"transparent"}>
                    <td style={{padding:"12px 16px",fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{item.item}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#888"}}>{item.category}</td>
                    <td style={{padding:"12px 16px",fontSize:15,fontWeight:700,color:st==="Critical"?C.red:st==="Low"?"#E65100":"#1a1a1a"}}>{item.stock}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#999"}}>{item.unit}</td>
                    <td style={{padding:"12px 16px",fontSize:13,color:"#bbb"}}>{item.min_level}</td>
                    <td style={{padding:"12px 16px"}}><Badge status={st}/></td>
                    <td style={{padding:"12px 16px",fontSize:12,color:"#ccc"}}>{item.last_updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Add Inventory Item">
        <FF label="ITEM NAME" value={form.item} onChange={fp("item")} placeholder="e.g., Coffee Beans"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="CATEGORY" as="select" value={form.category} onChange={fp("category")}>
            {cats.slice(1).map(c=><option key={c}>{c}</option>)}
          </FF>
          <FF label="UNIT" value={form.unit} onChange={fp("unit")} placeholder="e.g., kg, pcs"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="CURRENT STOCK" type="number" value={form.stock} onChange={fp("stock")}/>
          <FF label="MIN LEVEL" type="number" value={form.min_level} onChange={fp("min_level")}/>
        </div>
        <PillBtn onClick={addItem} disabled={saving}>{saving?"Adding…":"Add Item"}</PillBtn>
      </Modal>
    </div>
  );
}

// ─── STAFF ────────────────────────────────────────────────────────────────────
function StaffTab() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [form, setForm] = useState({name:"",role:"Barista",phone:"",shift:"Morning (7AM–3PM)",salary:""});

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const roleStyle = { Barista:["#E3F2FD","#1565C0"],Chef:["#FFF3E0","#E65100"],Waiter:["#F3E5F5","#6A1B9A"],Cashier:["#E8F5E9","#2E7D32"],Manager:["#FBE9E7","#BF360C"] };

  const load = () => {
    setLoading(true);
    api.getStaff()
      .then(setStaffList)
      .catch(()=>showToast("Failed to load staff","error"))
      .finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const fp = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const addStaff = async () => {
    setSaving(true);
    try {
      await api.addStaff({...form, salary:+form.salary, schedule:["Mon","Tue","Wed","Thu","Fri"]});
      showToast("Staff added ✓"); setShowModal(false); load();
    } catch(e) { showToast(e.message,"error"); }
    setSaving(false);
  };

  const toggleStatus = async (s) => {
    const next = s.status==="on-duty"?"off-duty":"on-duty";
    try { await api.setStaffStatus(s.id, next); showToast(`${s.name} marked ${next}`); load(); }
    catch(e) { showToast(e.message,"error"); }
  };

  if (loading) return <Spinner/>;

  return (
    <div>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.brown}}>Staff</h2>
        <PillBtn icon={<Plus size={15}/>} onClick={()=>setShowModal(true)}>Add Staff</PillBtn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:24}}>
        {staffList.map(s=>{
          const [rbg,rcol] = roleStyle[s.role]||["#eee","#555"];
          return (
            <Card key={s.id}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:50,height:50,borderRadius:"50%",background:C.brown+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.brown,flexShrink:0}}>{initials(s.name)}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{s.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                    <span style={{background:rbg,color:rcol,padding:"2px 9px",borderRadius:999,fontSize:11,fontWeight:700}}>{s.role}</span>
                    <Badge status={s.status}/>
                  </div>
                </div>
              </div>
              <div style={{fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif",marginBottom:14,display:"flex",gap:16}}>
                <span style={{display:"flex",alignItems:"center",gap:5}}><Clock size={11} color={C.tan}/>{s.shift.split(" ")[1]||s.shift}</span>
                <span style={{display:"flex",alignItems:"center",gap:5}}><Phone size={11} color={C.tan}/>{s.phone}</span>
              </div>
              <div style={{background:C.cream,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                <div style={{fontSize:10,color:"#bbb",fontFamily:"'DM Sans',sans-serif",marginBottom:8,letterSpacing:.8,fontWeight:700}}>THIS MONTH</div>
                <div style={{display:"flex",gap:20}}>
                  {[["✅","Present",s.attendance?.present||0],["❌","Absent",s.attendance?.absent||0],["⏰","Late",s.attendance?.late||0]].map(([ic,lbl,val])=>(
                    <div key={lbl} style={{textAlign:"center"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{val}</div>
                      <div style={{fontSize:10,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <PillBtn size="sm" variant={s.status==="on-duty"?"danger":"success"} onClick={()=>toggleStatus(s)}>
                {s.status==="on-duty"?"Mark Off Duty":"Mark On Duty"}
              </PillBtn>
            </Card>
          );
        })}
      </div>

      <Card hover={false} style={{padding:24,overflowX:"auto"}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Weekly Schedule</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif",minWidth:520}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"9px 16px",fontSize:11,fontWeight:700,color:C.brown,letterSpacing:.6}}>Staff</th>
              {days.map(d=><th key={d} style={{padding:"9px 10px",fontSize:11,fontWeight:700,color:C.brown,textAlign:"center"}}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {staffList.map(s=>(
              <tr key={s.id} style={{borderTop:"1px solid #f5f0eb"}}>
                <td style={{padding:"11px 16px",fontSize:13,fontWeight:600,color:"#333"}}>{s.name}</td>
                {days.map(d=>(
                  <td key={d} style={{padding:"9px 10px",textAlign:"center"}}>
                    {(s.schedule||[]).includes(d)
                      ?<span style={{background:C.green+"22",color:C.green,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>✓</span>
                      :<span style={{color:"#ddd",fontSize:13}}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Add Staff Member">
        <FF label="FULL NAME" value={form.name} onChange={fp("name")} placeholder="Staff Name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="ROLE" as="select" value={form.role} onChange={fp("role")}>
            {["Barista","Chef","Waiter","Cashier","Manager"].map(r=><option key={r}>{r}</option>)}
          </FF>
          <FF label="PHONE" value={form.phone} onChange={fp("phone")} placeholder="10-digit number"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="SHIFT" as="select" value={form.shift} onChange={fp("shift")}>
            {["Morning (7AM–3PM)","Evening (3PM–11PM)","Full Day (10AM–7PM)"].map(s=><option key={s}>{s}</option>)}
          </FF>
          <FF label="SALARY (₹)" type="number" value={form.salary} onChange={fp("salary")}/>
        </div>
        <PillBtn onClick={addStaff} disabled={saving}>{saving?"Adding…":"Add Staff Member"}</PillBtn>
      </Modal>
    </div>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
function CustomersTab() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedData, setExpandedData] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getCustomers(search)
      .then(setCustomers)
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const expand = async (id) => {
    if (expanded===id) { setExpanded(null); return; }
    setExpanded(id);
    if (!expandedData[id]) {
      const d = await api.getCustomer(id).catch(()=>null);
      if (d) setExpandedData(x=>({...x,[id]:d}));
    }
  };

  const tierRange = { Bronze:[0,500], Silver:[500,1500], Gold:[1500,3000] };

  if (loading) return <Spinner/>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.brown}}>Customers</h2>
        <div style={{position:"relative"}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#bbb"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone…" style={{...IS,width:260,paddingLeft:34,padding:"9px 14px 9px 34px"}}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {customers.map(c=>{
          const isEx = expanded===c.id;
          const [mn,mx] = tierRange[c.tier]||[0,500];
          const prog = Math.min(100,((c.loyalty_points-mn)/(mx-mn))*100);
          const barCol = c.tier==="Gold"?"#FFB74D":c.tier==="Silver"?"#9E9E9E":"#A1887F";
          const detail = expandedData[c.id];
          return (
            <Card key={c.id} style={{cursor:"pointer"}}>
              <div onClick={()=>expand(c.id)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:C.tan+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C.brown,flexShrink:0}}>{initials(c.name)}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{c.name}</div>
                      <div style={{fontSize:12,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{c.phone}</div>
                    </div>
                  </div>
                  <Badge status={c.tier}/>
                </div>
                <div style={{display:"flex",gap:18,marginBottom:14}}>
                  {[["Visits",c.total_visits],["Points",c.loyalty_points]].map(([l,v])=>(
                    <div key={l}>
                      <div style={{fontSize:17,fontWeight:700,color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>{v}</div>
                      <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>Last visit</div>
                    <div style={{fontSize:12,fontWeight:600,color:"#555",fontFamily:"'DM Sans',sans-serif"}}>{c.last_visit||"—"}</div>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#bbb",fontFamily:"'DM Sans',sans-serif",marginBottom:5}}>
                    <span>Loyalty Progress</span><span>{c.loyalty_points} / {mx} pts</span>
                  </div>
                  <div style={{height:7,background:"#f0ece8",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${prog}%`,background:barCol,borderRadius:999,transition:"width .5s"}}/>
                  </div>
                </div>
              </div>
              {isEx&&detail&&(
                <div style={{borderTop:"1px solid #f0ece8",paddingTop:14,marginTop:14,animation:"fadeUp .2s ease-out"}}>
                  {detail.preferences&&(
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:C.brown,fontFamily:"'DM Sans',sans-serif",marginBottom:6,letterSpacing:.7}}>PREFERENCES</div>
                      <div style={{fontSize:13,color:"#666",fontFamily:"'DM Sans',sans-serif",marginBottom:12,display:"flex",alignItems:"flex-start",gap:6}}>
                        <Leaf size={13} color={C.green} style={{marginTop:2,flexShrink:0}}/>{detail.preferences}
                      </div>
                    </>
                  )}
                  {detail.orders?.length>0&&(
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:C.brown,fontFamily:"'DM Sans',sans-serif",marginBottom:8,letterSpacing:.7}}>RECENT ORDERS</div>
                      {detail.orders.map((o,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#777",fontFamily:"'DM Sans',sans-serif",marginBottom:5}}>
                          <Coffee size={12} color={C.tan}/>{o}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── BILLING ──────────────────────────────────────────────────────────────────
function BillingTab() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sel, setSel] = useState(null);
  const [payMethod, setPayMethod] = useState("UPI");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [toast, showToast] = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([api.getActiveOrders(), api.getTransactions()])
      .then(([orders, txn]) => { setActiveOrders(orders); setTransactions(txn); if(orders.length>0) setSel(orders[0]); })
      .catch(()=>showToast("Failed to load billing data","error"))
      .finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const subtotal = sel?.items?.reduce((s,i)=>s+i.price*i.qty, 0)||0;
  const cgst = Math.round(subtotal*.05);
  const sgst = Math.round(subtotal*.05);
  const total = subtotal+cgst+sgst;

  const markPaid = async () => {
    setPaying(true);
    try {
      await api.markPaid(sel.id, payMethod);
      showToast("Bill marked as paid ✓");
      load();
      setSel(null);
    } catch(e) { showToast(e.message,"error"); }
    setPaying(false);
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}>
      <Toast msg={toast?.msg} type={toast?.type}/>
      <div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:14}}>Active Orders</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {activeOrders.length===0
            ? <div style={{textAlign:"center",padding:24,color:"#bbb",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>All orders settled ✓</div>
            : activeOrders.map(o=>{
              const isActive = sel?.id===o.id;
              return (
                <div key={o.id} onClick={()=>setSel(o)} style={{background:isActive?C.brown:"#fff",borderRadius:14,padding:16,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,.06)",transition:"all .18s",border:`2px solid ${isActive?C.brown:"transparent"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:14,color:isActive?"#fff":"#1a1a1a",fontFamily:"'DM Sans',sans-serif"}}>Table {o.table_id}</span>
                    <span style={{fontWeight:700,fontSize:14,color:isActive?"#fff":C.brown,fontFamily:"'DM Sans',sans-serif"}}>{fmt(o.total)}</span>
                  </div>
                  <div style={{fontSize:12,color:isActive?"rgba(255,255,255,.6)":"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{o.customer} · {o.items?.length} items</div>
                </div>
              );
            })
          }
        </div>

        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:C.brown,marginBottom:10}}>Today's Transactions</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {transactions.map((t,i)=>(
            <div key={i} style={{background:C.cream,borderRadius:10,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{t.customer}</div>
                <div style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{t.method} · {t.time}</div>
              </div>
              <div style={{fontWeight:700,fontSize:13,color:C.green,fontFamily:"'DM Sans',sans-serif"}}>{fmt(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {sel ? (
        <div style={{background:"#fff",borderRadius:16,padding:28,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
            <div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.brown}}>Bill — Table {sel.table_id}</h3>
              <div style={{fontSize:13,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>{sel.customer} · #{sel.id}</div>
            </div>
          </div>

          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${C.cream}`}}>
                {["Item","Qty","Price","Total"].map(h=>(
                  <th key={h} style={{textAlign:h==="Item"?"left":"right",padding:"8px 0",fontSize:11,fontWeight:700,color:C.brown,fontFamily:"'DM Sans',sans-serif",letterSpacing:.6}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sel.items?.map((item,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #f8f5f2"}}>
                  <td style={{padding:"12px 0",fontSize:14,color:"#333",fontFamily:"'DM Sans',sans-serif"}}>{item.name}</td>
                  <td style={{padding:"12px 0",fontSize:14,color:"#aaa",textAlign:"right",fontFamily:"'DM Sans',sans-serif"}}>{item.qty}</td>
                  <td style={{padding:"12px 0",fontSize:14,color:"#aaa",textAlign:"right",fontFamily:"'DM Sans',sans-serif"}}>{fmt(item.price)}</td>
                  <td style={{padding:"12px 0",fontSize:14,fontWeight:600,color:"#333",textAlign:"right",fontFamily:"'DM Sans',sans-serif"}}>{fmt(item.price*item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{background:C.cream,borderRadius:12,padding:"16px 20px",marginBottom:20}}>
            {[["Subtotal",fmt(subtotal)],["CGST (5%)",fmt(cgst)],["SGST (5%)",fmt(sgst)]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"#888",fontFamily:"'DM Sans',sans-serif"}}><span>{l}</span><span>{v}</span></div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",borderTop:`2px solid ${C.tan}55`,paddingTop:10,fontSize:19,fontWeight:700,color:C.brown,fontFamily:"'Playfair Display',serif"}}>
              <span>Grand Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.brown,fontFamily:"'DM Sans',sans-serif",marginBottom:10,letterSpacing:.7}}>PAYMENT METHOD</div>
            <div style={{display:"flex",gap:10}}>
              {[["Cash","💵"],["Card","💳"],["UPI","📱"]].map(([m,ic])=>(
                <button key={m} onClick={()=>setPayMethod(m)} style={{padding:"10px 22px",borderRadius:999,border:`2px solid ${payMethod===m?C.brown:"#ddd"}`,background:payMethod===m?C.brown:"#fff",color:payMethod===m?"#fff":"#666",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s"}}>
                  {ic} {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <PillBtn icon={<Check size={15}/>} variant="success" onClick={markPaid} disabled={paying}>{paying?"Processing…":"Mark as Paid"}</PillBtn>
            <PillBtn icon={<Printer size={15}/>} variant="outline">Print Bill</PillBtn>
            <PillBtn icon={<Users size={15}/>} variant="outline">Split Bill</PillBtn>
          </div>
        </div>
      ) : (
        <div style={{background:"#fff",borderRadius:16,padding:60,boxShadow:"0 2px 12px rgba(0,0,0,.06)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <CreditCard size={52} color="#e8ddd4" style={{marginBottom:16}}/>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#ccc",marginBottom:8}}>No Order Selected</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ddd"}}>Select an active order to view bill</div>
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [range, setRange] = useState("This Week");
  const [data, setData] = useState({ revenue:[], topItems:[], growth:[], peakHours:[], staffPerf:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRevenue(), api.getTopItems(), api.getCustomerGrowth(),
      api.getPeakHours(), api.getStaffPerf()
    ]).then(([revenue, topItems, growth, peakHours, staffPerf]) => {
      setData({ revenue, topItems, growth, peakHours, staffPerf });
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [range]);

  const heatCol = v => {
    if(v>=15) return {bg:C.brown,txt:"#fff"};
    if(v>=12) return {bg:C.brownLight,txt:"#fff"};
    if(v>=9)  return {bg:C.tan,txt:"#fff"};
    if(v>=6)  return {bg:"#E8D5B7",txt:"#5a3825"};
    return {bg:"#F5EDE0",txt:"#8a6040"};
  };

  if (loading) return <Spinner/>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.brown}}>Analytics</h2>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {["Today","This Week","This Month","Custom"].map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{padding:"7px 15px",borderRadius:999,border:`1.5px solid ${range===r?C.brown:"#ddd"}`,background:range===r?C.brown:"#fff",color:range===r?"#fff":"#666",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s"}}>{r}</button>
          ))}
        </div>
      </div>

      <Card hover={false} style={{padding:24,marginBottom:18}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data.revenue} margin={{top:5,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.brown} stopOpacity={.28}/>
                <stop offset="95%" stopColor={C.brown} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8"/>
            <XAxis dataKey="day" tick={{fontSize:12,fontFamily:"'DM Sans',sans-serif",fill:"#aaa"}}/>
            <YAxis tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fill:"#aaa"}}/>
            <Tooltip contentStyle={{borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:12,border:`1px solid ${C.tan}55`}} formatter={v=>[`₹${Number(v).toLocaleString()}`,"Revenue"]}/>
            <Area type="monotone" dataKey="revenue" stroke={C.brown} strokeWidth={2.5} fill="url(#rg)" dot={{fill:C.brown,r:4,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <Card hover={false} style={{padding:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topItems} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fill:"#aaa"}}/>
              <YAxis type="category" dataKey="name" width={100} tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fill:"#666"}}/>
              <Tooltip contentStyle={{borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:12}}/>
              <Bar dataKey="sold" fill={C.tan} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card hover={false} style={{padding:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Customer Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.growth} margin={{top:0,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8"/>
              <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fill:"#aaa"}}/>
              <YAxis tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif",fill:"#aaa"}}/>
              <Tooltip contentStyle={{borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:12}}/>
              <Legend wrapperStyle={{fontFamily:"'DM Sans',sans-serif",fontSize:11}}/>
              <Bar dataKey="new" fill={C.green} name="New" radius={[4,4,0,0]}/>
              <Bar dataKey="returning" fill={C.tan} name="Returning" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card hover={false} style={{padding:24,marginBottom:18,overflowX:"auto"}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Peak Hours Heatmap</h3>
        <table style={{borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif",minWidth:520}}>
          <thead>
            <tr>
              <th style={{padding:"6px 14px",fontSize:11,fontWeight:700,color:C.brown,textAlign:"left"}}>Hour</th>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                <th key={d} style={{padding:"6px 10px",fontSize:11,fontWeight:700,color:C.brown,textAlign:"center"}}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.peakHours.map(row=>(
              <tr key={row.hour}>
                <td style={{padding:"4px 14px",fontSize:12,color:"#999",fontWeight:600,whiteSpace:"nowrap"}}>{row.hour}</td>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{
                  const {bg,txt}=heatCol(row[d]);
                  return (
                    <td key={d} style={{padding:3,textAlign:"center"}}>
                      <div style={{background:bg,width:44,height:30,borderRadius:7,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:11,fontWeight:700,color:txt}}>{row[d]}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display:"flex",gap:6,alignItems:"center",marginTop:14}}>
          <span style={{fontSize:11,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>Quiet</span>
          {["#F5EDE0","#E8D5B7","#C8A97E","#8B6347","#6F4E37"].map(c=>(
            <div key={c} style={{width:24,height:14,background:c,borderRadius:4}}/>
          ))}
          <span style={{fontSize:11,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>Busy</span>
        </div>
      </Card>

      <Card hover={false} style={{padding:24}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.brown,marginBottom:16}}>Staff Performance</h3>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif",minWidth:480}}>
            <thead>
              <tr style={{background:C.brown+"10"}}>
                {["Staff","Orders","Avg Time","Rating"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:11,fontWeight:700,color:C.brown,letterSpacing:.6}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.staffPerf.map(s=>(
                <tr key={s.name} style={{borderTop:"1px solid #f5f0eb",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#F9F5F0"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={{padding:"12px 16px",fontSize:14,fontWeight:600,color:"#333"}}>{s.name}</td>
                  <td style={{padding:"12px 16px",fontSize:14,color:"#555"}}>{s.orders}</td>
                  <td style={{padding:"12px 16px",fontSize:14,color:"#555"}}>{s.avgTime}</td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <Star size={14} color="#FFB74D" fill="#FFB74D"/>
                      <span style={{fontSize:14,fontWeight:700,color:"#333"}}>{s.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",label:"Dashboard",icon:Home},
  {id:"bookings", label:"Bookings", icon:Calendar},
  {id:"inventory",label:"Inventory",icon:Package},
  {id:"staff",    label:"Staff",    icon:Users},
  {id:"customers",label:"Customers",icon:User},
  {id:"billing",  label:"Billing",  icon:CreditCard},
  {id:"analytics",label:"Analytics",icon:BarChart2},
];

function Sidebar({ active, setActive }) {
  const [hov, setHov] = useState(null);
  return (
    <div style={{width:220,background:C.sidebar,minHeight:"100vh",display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,bottom:0,zIndex:100}}>
      <div style={{padding:"26px 20px 22px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:C.tan,borderRadius:12,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Coffee size={20} color={C.sidebar}/>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif"}}>CaféOS</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:1.2,fontFamily:"'DM Sans',sans-serif"}}>MANAGEMENT SYSTEM</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"14px 10px"}}>
        {NAV.map(({id,label,icon:Icon})=>{
          const isAct = active===id;
          const isHov = hov===id;
          return (
            <button key={id} onClick={()=>setActive(id)}
              onMouseEnter={()=>setHov(id)} onMouseLeave={()=>setHov(null)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderRadius:12,border:"none",background:isAct?"rgba(200,169,126,.18)":isHov?"rgba(255,255,255,.06)":"transparent",color:isAct?C.tan:isHov?"rgba(255,255,255,.85)":"rgba(255,255,255,.45)",cursor:"pointer",marginBottom:3,transition:"all .18s",textAlign:"left",fontSize:13,fontWeight:isAct?600:400,fontFamily:"'DM Sans',sans-serif"}}>
              <Icon size={17}/>
              {label}
              {isAct&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.tan}}/>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"14px 20px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,.2)",textAlign:"center",fontFamily:"'DM Sans',sans-serif",letterSpacing:.5}}>© 2026 CaféOS v2.1</div>
      </div>
    </div>
  );
}


function TopNav({ active, user, onLogout }) {
  const label = NAV.find(n => n.id === active)?.label || "Dashboard";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 220,
      right: 0,
      height: 64,
      background: "#fff",
      borderBottom: "1px solid #f0e8df",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      zIndex: 99,
      boxShadow: "0 2px 8px rgba(0,0,0,.04)"
    }}>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: C.brown
        }}>
          {label}
        </div>
        <ApiStatus />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#ccc"
            }}
          />
          <input
            placeholder="Quick search…"
            style={{
              background: "#F9F5F0",
              border: "none",
              borderRadius: 20,
              padding: "8px 14px 8px 32px",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              width: 180,
              outline: "none",
              color: "#666"
            }}
          />
        </div>

        <div style={{ position: "relative", cursor: "pointer", padding: 4 }}>
          <Bell size={19} color={C.brown} />
          <div style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            background: C.red,
            borderRadius: "50%",
            border: "2px solid #fff"
          }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: C.brown,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#333",
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.3
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: 10,
              color: "#bbb",
              fontFamily: "'DM Sans', sans-serif"
            }}>
              {user?.role}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6
            }}
          >
            <LogOut size={17} color={C.brown} />
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CafeOS({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTab = () => {
    switch(activeTab) {
      case "dashboard":  return <DashboardTab setActiveTab={setActiveTab}/>;
      case "bookings":   return <BookingsTab/>;
      case "inventory":  return <InventoryTab/>;
      case "staff":      return <StaffTab/>;
      case "customers":  return <CustomersTab/>;
      case "billing":    return <BillingTab/>;
      case "analytics":  return <AnalyticsTab/>;
      default:           return <DashboardTab setActiveTab={setActiveTab}/>;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes tabIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f0e8df}
        ::-webkit-scrollbar-thumb{background:#C8A97E;border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:#6F4E37}
      `}</style>
      <Sidebar active={activeTab} setActive={setActiveTab}/>
      <TopNav active={activeTab} user={user} onLogout={onLogout}/>
      
      <main style={{
        marginLeft: 220,
        paddingTop: 64,
        width: "calc(100% - 220px)",
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#F9F4EF"
      }}>

        <div key={activeTab} style={{padding:"26px 28px",animation:"tabIn .25s ease-out", width: "100%", boxSizing: "border-box"}}>
          {renderTab()}
        </div>
      </main>
    </>
  );
}
