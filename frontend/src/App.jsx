// src/App.jsx — shows AuthPage until the user signs in, then CaféOS
import { useState } from "react";
import AuthPage, { getSession, clearSession } from "./AuthPage";
import CafeOS from "./CafeOS";

export default function App() {
  const [user, setUser] = useState(getSession());

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <CafeOS
      user={user}
      onLogout={() => { clearSession(); setUser(null); }}
    />
  );
}
