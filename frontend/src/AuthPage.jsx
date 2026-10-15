// src/AuthPage.jsx — CaféOS intro + login/signup
// Intro: a cup fills while the system "brews", then the screen lifts away.
// Auth: the form is printed like an order ticket.
import { useState, useEffect } from "react";
import {
  Coffee, Mail, Lock, User, Users, Eye, EyeOff, Check, AlertCircle, Briefcase,
  SkipForward, Loader, LogIn, UserPlus, Calendar, Package, CreditCard, BarChart2,
} from "lucide-react";

// ─── STORAGE (frontend-only demo; swap for your /api/auth endpoints later) ───
const USERS_KEY = "cafeos_users";
const SESSION_KEY = "cafeos_session";
const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

export const getSession = () => read(SESSION_KEY, null);
export const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } };

async function hash(s) {
  if (!window.crypto?.subtle) return s;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const DEMO = { name: "Tara Singh", email: "tara@cafeos.in", role: "Manager", password: "cafe1234" };

async function loadUsers() {
  const users = read(USERS_KEY, []);
  if (!users.some(u => u.email === DEMO.email)) {
    users.push({ name: DEMO.name, email: DEMO.email, role: DEMO.role, hash: await hash(DEMO.password) });
    write(USERS_KEY, users);
  }
  return users;
}

const strength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const STRENGTH_LABEL = ["Too short", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLOR = ["#E57373", "#E57373", "#FFB74D", "#8BC34A", "#4CAF50"];

// ─── INTRO ────────────────────────────────────────────────────────────────────
const STAGES = [[0, "Grinding the beans"], [25, "Heating the water"], [50, "Pulling the shot"], [75, "Steaming the milk"], [100, "Ready to serve"]];

function Intro({ onDone }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const total = reduce ? 500 : 4200;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(100, ((now - t0) / total) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => setLeaving(true), 450);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  const stage = [...STAGES].reverse().find(([t]) => pct >= t)?.[1] ?? STAGES[0][1];

  return (
    <div className={"intro" + (leaving ? " leaving" : "")} role="status" aria-live="polite">
      <div className="intro-glow" />
      <svg viewBox="0 0 220 200" width="240" height="218" aria-hidden="true" style={{ position: "relative" }}>
        <defs>
          <clipPath id="cup-clip"><path d="M40 70H160V112C160 148 138 168 100 168C62 168 40 148 40 112Z" /></clipPath>
        </defs>
        {["M80 55C70 45 90 35 80 22", "M100 58C90 46 110 34 100 18", "M120 55C110 45 130 35 120 22"].map((d, i) => (
          <path key={i} d={d} className="steam" fill="none" stroke="#F5E6D0" strokeWidth="3" strokeLinecap="round"
            style={{ animationDelay: `${i * 0.35}s`, opacity: pct > 40 ? undefined : 0 }} />
        ))}
        <ellipse cx="100" cy="179" rx="82" ry="8" fill="#2E1D12" />
        <path d="M160 85H172C192 85 192 128 164 128H156" fill="none" stroke="#C8A97E" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 70H160V112C160 148 138 168 100 168C62 168 40 148 40 112Z" fill="#F5E6D0" fillOpacity=".07" />
        <g clipPath="url(#cup-clip)">
          <g style={{ transform: `translateY(${100 - pct * 0.9}px)` }}>
            <rect x="30" y="70" width="140" height="120" fill="#6F4E37" />
            <rect x="30" y="70" width="140" height="7" fill="#C8A97E" />
          </g>
        </g>
        <path d="M40 70H160V112C160 148 138 168 100 168C62 168 40 148 40 112Z" fill="none" stroke="#C8A97E" strokeWidth="4" strokeLinejoin="round" />
      </svg>

      <h1 className="intro-word" aria-label="CaféOS">
        {"CaféOS".split("").map((ch, i) => (
          <span key={i} className="letter" style={{ animationDelay: `${0.2 + i * 0.09}s` }}>{ch}</span>
        ))}
      </h1>
      <div className="intro-stage">
        <span>{stage}</span>
        <span className="intro-pct">{Math.round(pct)}%</span>
      </div>

      <button className="intro-skip" onClick={() => setLeaving(true)}>
        <SkipForward size={14} /> Skip intro
      </button>
    </div>
  );
}

// ─── FORM PIECES ──────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, error, right, ...props }) {
  return (
    <label className="fld">
      <span className="fld-l">{label}</span>
      <span className={"fld-w" + (error ? " err" : "")}>
        <Icon size={16} />
        <input {...props} />
        {right}
      </span>
      {error && <span className="fld-e"><AlertCircle size={12} />{error}</span>}
    </label>
  );
}

const SIDE_MODULES = [[Calendar, "Bookings"], [Package, "Inventory"], [Users, "Staff"], [User, "Customers"], [CreditCard, "Billing"], [BarChart2, "Analytics"]];

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem("cafeos_intro_seen"); } catch { return true; }
  });
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", role: "Manager", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const set = (k) => (e) => { setF(s => ({ ...s, [k]: e.target.value })); setErrors(x => ({ ...x, [k]: undefined })); setBanner(""); };
  const switchMode = (m) => { setMode(m); setErrors({}); setBanner(""); };
  const endIntro = () => { try { sessionStorage.setItem("cafeos_intro_seen", "1"); } catch { /* ignore */ } setShowIntro(false); };

  const finish = (u) => {
    const session = { name: u.name, email: u.email, role: u.role };
    write(SESSION_KEY, session);
    setOk(true);
    setTimeout(() => onAuth(session), 700);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBanner("");
    const email = f.email.trim().toLowerCase();
    const errs = {};
    if (mode === "signup" && f.name.trim().length < 2) errs.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter an email like name@cafe.in.";
    if (mode === "login" && !f.password) errs.password = "Enter your password.";
    if (mode === "signup" && f.password.length < 8) errs.password = "Use at least 8 characters.";
    if (mode === "signup" && f.confirm !== f.password) errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const users = await loadUsers();
    const h = await hash(f.password);

    if (mode === "login") {
      const u = users.find(x => x.email === email && x.hash === h);
      if (!u) { setBusy(false); return setBanner("That email and password don't match. Check both, or use the demo account."); }
      finish(u);
    } else {
      if (users.some(x => x.email === email)) { setBusy(false); return setBanner("An account with this email already exists. Switch to Sign in."); }
      const u = { name: f.name.trim(), email, role: f.role, hash: h };
      write(USERS_KEY, [...users, u]);
      finish(u);
    }
  };

  const useDemo = () => {
    setMode("login");
    setF(s => ({ ...s, email: DEMO.email, password: DEMO.password }));
    setErrors({}); setBanner("");
  };

  const sc = strength(f.password);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-root">
        <aside className="auth-side">
          <div className="side-brand"><span className="side-logo"><Coffee size={20} /></span>CaféOS</div>
          <div>
            <h2 className="side-head">Run the floor, the stockroom and the till from one screen.</h2>
            <p className="side-sub">Sign in with your staff account and pick up where the last shift left off.</p>
            <div className="side-mods">
              {SIDE_MODULES.map(([Icon, label]) => (
                <span key={label} className="side-pill"><Icon size={14} />{label}</span>
              ))}
            </div>
          </div>
          <p className="side-foot">Built for cafés that run on good coffee.</p>
        </aside>

        <main className="auth-main">
          <section className="ticket print" aria-label={mode === "login" ? "Sign in" : "Create account"}>
            <div className="tk-top">
              <span className="tk-brand"><Coffee size={18} />CaféOS</span>
              <span className="tk-date">{today}</span>
            </div>
            <div className="dash" />

            <div className="seg" role="tablist">
              <span className="seg-ind" style={{ transform: mode === "login" ? "translateX(0)" : "translateX(100%)" }} />
              <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")} type="button">
                <LogIn size={15} />Sign in
              </button>
              <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => switchMode("signup")} type="button">
                <UserPlus size={15} />Create account
              </button>
            </div>

            <h2 className="tk-h">{mode === "login" ? "Welcome back" : "Set up your staff login"}</h2>
            <p className="tk-s">{mode === "login" ? "Sign in to open today's shift." : "Takes under a minute. You can change your role later."}</p>

            {banner && <div className="banner" role="alert"><AlertCircle size={16} />{banner}</div>}

            <form onSubmit={submit} noValidate>
              {mode === "signup" && (
                <Field icon={User} label="Full name" value={f.name} onChange={set("name")} error={errors.name} placeholder="Tara Singh" autoComplete="name" />
              )}
              <Field icon={Mail} label="Email" type="email" value={f.email} onChange={set("email")} error={errors.email} placeholder="you@cafe.in" autoComplete="email" />

              {mode === "signup" && (
                <label className="fld">
                  <span className="fld-l">Role</span>
                  <span className="fld-w"><Briefcase size={16} />
                    <select value={f.role} onChange={set("role")}>
                      {["Manager", "Barista", "Cashier", "Waiter", "Chef"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </span>
                </label>
              )}

              <Field
                icon={Lock} label="Password" type={show ? "text" : "password"} value={f.password} onChange={set("password")}
                error={errors.password} placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                right={<button type="button" className="eye" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
              />

              {mode === "signup" && f.password && (
                <div className="meter" aria-live="polite">
                  <div className="meter-bars">
                    {[1, 2, 3, 4].map(i => <span key={i} style={{ background: i <= sc ? STRENGTH_COLOR[sc] : "#E8DCC8" }} />)}
                  </div>
                  <span style={{ color: STRENGTH_COLOR[sc] }}>{STRENGTH_LABEL[sc]}</span>
                </div>
              )}

              {mode === "signup" && (
                <Field icon={Lock} label="Confirm password" type={show ? "text" : "password"} value={f.confirm} onChange={set("confirm")} error={errors.confirm} placeholder="Repeat your password" autoComplete="new-password" />
              )}

              <button className="btn-primary" type="submit" disabled={busy || ok}>
                {ok ? <><Check size={16} />You're in</> : busy ? <><Loader size={16} className="spin" />{mode === "login" ? "Signing in…" : "Creating account…"}</> : mode === "login" ? <><LogIn size={16} />Sign in</> : <><UserPlus size={16} />Create account</>}
              </button>
            </form>

            {mode === "login" && (
              <button className="btn-ghost" type="button" onClick={useDemo}>
                <Coffee size={15} />Use the demo account
              </button>
            )}

            <div className="dash" style={{ marginTop: 22 }} />
            <p className="tk-thanks">Thank you for brewing with us</p>
            <div className="barcode" aria-hidden="true" />
          </section>
        </main>
      </div>

      {showIntro && <Intro onDone={endIntro} />}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
.auth-root,.intro{font-family:'DM Sans',sans-serif}
.auth-root *,.intro *{box-sizing:border-box}
.auth-root{min-height:100vh;display:grid;grid-template-columns:minmax(320px,5fr) 6fr;background:#EADFCB}
.auth-root button:focus-visible,.auth-root input:focus-visible,.auth-root select:focus-visible,.intro button:focus-visible{outline:2px solid #4CAF50;outline-offset:2px}

/* side */
.auth-side{background:#2B1B12;color:#F5E6D0;padding:44px 48px;display:flex;flex-direction:column;justify-content:space-between;gap:32px}
.side-brand{display:flex;align-items:center;gap:12px;font:700 22px 'Playfair Display',serif;color:#fff}
.side-logo{width:40px;height:40px;border-radius:12px;background:#C8A97E;color:#2B1B12;display:grid;place-items:center}
.side-head{font:700 40px/1.15 'Playfair Display',serif;color:#fff;margin:0 0 18px;max-width:14em}
.side-sub{font-size:16px;line-height:1.6;color:#CDB99F;max-width:30em;margin:0 0 28px}
.side-mods{display:flex;flex-wrap:wrap;gap:10px}
.side-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(200,169,126,.14);color:#E8D5B7;font-size:13px;font-weight:600}
.side-foot{font-size:13px;color:#8F7A63;margin:0}

/* main + ticket */
.auth-main{display:grid;place-items:center;padding:48px 24px}
.ticket{position:relative;width:100%;max-width:430px;background:#FDF6EC;padding:26px 30px 30px;border-radius:6px 6px 0 0;filter:drop-shadow(0 18px 28px rgba(60,35,15,.22))}
.ticket::after{content:"";position:absolute;left:0;right:0;bottom:-13px;height:14px;
  background:linear-gradient(135deg,#FDF6EC 25%,transparent 25%) -7px 0,linear-gradient(225deg,#FDF6EC 25%,transparent 25%) -7px 0;background-size:14px 14px}
.print{animation:print 1s .2s cubic-bezier(.2,.7,.2,1) both}
@keyframes print{from{clip-path:inset(-30px -30px 100% -30px);transform:translateY(-14px)}to{clip-path:inset(-30px -30px -30px -30px);transform:none}}
.tk-top{display:flex;justify-content:space-between;align-items:center;color:#6F4E37}
.tk-brand{display:inline-flex;align-items:center;gap:8px;font:700 18px 'Playfair Display',serif}
.tk-date{font-size:12px;color:#A08060}
.dash{border-top:2px dashed #D9C3A0;margin:16px 0}

.seg{position:relative;display:grid;grid-template-columns:1fr 1fr;background:#F0E3CE;border-radius:999px;padding:4px;margin-bottom:22px}
.seg-ind{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);background:#6F4E37;border-radius:999px;transition:transform .3s cubic-bezier(.5,0,.2,1)}
.seg button{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:7px;border:0;background:none;padding:10px 8px;border-radius:999px;font:600 13px 'DM Sans',sans-serif;color:#6F4E37;cursor:pointer;transition:color .25s}
.seg button.on{color:#fff}
.tk-h{font:700 26px 'Playfair Display',serif;color:#3D2B1F;margin:0 0 4px}
.tk-s{font-size:14px;color:#8B7355;margin:0 0 18px}
.banner{display:flex;gap:10px;align-items:flex-start;background:#FFEBEE;color:#B33A3A;border-radius:10px;padding:11px 13px;font-size:13px;line-height:1.45;margin-bottom:16px}
.banner svg{flex-shrink:0;margin-top:1px}

.fld{display:block;margin-bottom:16px}
.fld-l{display:block;font-size:12px;font-weight:700;color:#6F4E37;margin-bottom:4px}
.fld-w{display:flex;align-items:center;gap:10px;border-bottom:2px dashed #C8A97E;color:#A08060;padding:6px 2px;transition:border-color .2s,color .2s}
.fld-w:focus-within{border-bottom:2px solid #6F4E37;color:#6F4E37}
.fld-w.err{border-bottom:2px solid #E57373}
.fld-w input,.fld-w select{flex:1;min-width:0;border:0;background:transparent;outline:0;font:500 15px 'DM Sans',sans-serif;color:#2B1B12;padding:6px 0}
.fld-w input::placeholder{color:#BBA98F}
.fld-e{display:flex;align-items:center;gap:5px;font-size:12px;color:#C0504D;margin-top:5px}
.eye{border:0;background:none;color:inherit;cursor:pointer;display:grid;place-items:center;padding:4px;border-radius:6px}
.eye:hover{color:#6F4E37}
.meter{display:flex;align-items:center;gap:12px;margin:-6px 0 16px;font-size:12px;font-weight:600}
.meter-bars{display:flex;gap:4px;flex:1}
.meter-bars span{height:5px;flex:1;border-radius:3px;transition:background .25s}

.btn-primary,.btn-ghost{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font:600 15px 'DM Sans',sans-serif;cursor:pointer;transition:transform .18s,box-shadow .18s,background .18s}
.btn-primary{margin-top:6px;border:0;padding:13px 20px;background:#6F4E37;color:#fff}
.btn-primary:hover:not(:disabled){background:#5A3E2B;transform:translateY(-2px);box-shadow:0 8px 18px rgba(111,78,55,.3)}
.btn-primary:disabled{cursor:default;opacity:.85}
.btn-primary:disabled:has(.spin){cursor:wait}
.btn-ghost{margin-top:12px;padding:11px 20px;background:transparent;color:#6F4E37;border:1.5px solid #6F4E37}
.btn-ghost:hover{background:#6F4E37;color:#fff;transform:translateY(-2px)}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.tk-thanks{text-align:center;font:italic 600 14px 'Playfair Display',serif;color:#8B7355;margin:0 0 14px}
.barcode{height:34px;margin:0 auto;max-width:240px;
  background:repeating-linear-gradient(90deg,#3D2B1F 0 2px,transparent 2px 5px,#3D2B1F 5px 6px,transparent 6px 8px,#3D2B1F 8px 11px,transparent 11px 13px)}

/* intro */
.intro{position:fixed;inset:0;z-index:3000;background:#1E130C;display:flex;flex-direction:column;align-items:center;justify-content:center;
  transition:transform .95s cubic-bezier(.77,0,.18,1),border-radius .95s cubic-bezier(.77,0,.18,1);border-radius:0 0 0 0 / 0 0 0 0}
.intro.leaving{transform:translateY(-102%);border-radius:0 0 50% 50% / 0 0 120px 120px}
.intro-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(200,169,126,.22),transparent 65%)}
.intro-word{position:relative;margin:14px 0 6px;font:700 54px 'Playfair Display',serif;color:#FDF6EC;letter-spacing:.02em}
.letter{display:inline-block;opacity:0;animation:letter .6s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes letter{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.intro-stage{position:relative;display:flex;gap:14px;align-items:baseline;color:#CDB99F;font-size:15px;min-height:24px}
.intro-pct{font-variant-numeric:tabular-nums;color:#C8A97E;font-weight:700;min-width:3ch;text-align:right}
.intro-skip{position:absolute;right:24px;bottom:24px;display:inline-flex;align-items:center;gap:7px;background:transparent;border:1.5px solid rgba(200,169,126,.5);color:#E8D5B7;border-radius:999px;padding:8px 16px;font:600 13px 'DM Sans',sans-serif;cursor:pointer;transition:background .2s,color .2s}
.intro-skip:hover{background:#C8A97E;color:#1E130C}
.steam{stroke-dasharray:60;animation:steam 2.6s ease-in-out infinite;transition:opacity .8s}
@keyframes steam{0%{stroke-dashoffset:60;opacity:0}30%{opacity:.8}100%{stroke-dashoffset:-60;opacity:0}}

@media (max-width:900px){
  .auth-root{grid-template-columns:1fr}
  .auth-side{display:none}
  .auth-main{padding:32px 16px 56px}
  .intro-word{font-size:42px}
}
@media (prefers-reduced-motion:reduce){
  .print,.letter,.steam{animation:none}
  .letter{opacity:1}
  .intro,.intro.leaving,.seg-ind{transition-duration:.01s}
}
`;
