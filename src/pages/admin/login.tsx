import { useState } from "react";
import { useRouter } from "next/router";

const ADMIN_USER = "admin";
const ADMIN_PASS = "ribafree2025";

export default function AdminLogin() {
  const router = useRouter();
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const handleLogin = () => {
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      localStorage.setItem("admin_authed", "true");
      router.push("/admin/dashboard");
    } else {
      setLoginErr("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-jakarta">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 mb-3">
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
              <path d="M17 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">RibaWarrior Score</p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={loginUser}
            onChange={(e) => setLoginUser(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white p-3 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white p-3 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}