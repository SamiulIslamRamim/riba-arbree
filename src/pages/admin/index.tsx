import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_USER = "admin";
const ADMIN_PASS = "ribafree2025"; // change this to whatever you want

type User = Record<string, string | null>;

const FIELDS = [
  "name","email","gender","age_band","employment","household","country",
  "pension","pension_sharia","pension_amt",
  "ins","ins_takaful","ins_amt",
  "sav","sav_cleanse","sav_amt",
  "stud","stud_interest","stud_amt",
  "mort","mort_islamic","mort_multi","mort_amt",
  "pl","pl_type","pl_amt",
  "cc","cc_pay_full","cc_amt",
  "car","car_islamic","car_amt",
  "od","bnpl","missed",
  "stocks","stocks_sharia","stocks_amt",
  "bonds","bonds_type","bonds_amt",
  "reit","reit_type","reit_amt",
  "crypto","crypto_core","crypto_risk","crypto_amt",
];

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<User>({});
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleLogin = () => {
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setAuthed(true);
      setLoginErr("");
    } else {
      setLoginErr("Invalid credentials.");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("User deleted.");
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id as string);
    setEditData({ ...user });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("users")
      .update(editData)
      .eq("id", editingId!);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? { ...editData } : u))
      );
      showToast("User updated.");
    }
    setEditingId(null);
  };

  const filtered = users.filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // --- LOGIN SCREEN ---
  if (!authed) {
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

  // --- ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-xs mt-0.5">RibaWarrior Score — User Data</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{users.length} users</span>
          <button
            onClick={() => setAuthed(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* Search + Refresh */}
        <div className="flex items-center gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm rounded-lg border border-slate-700 bg-slate-800 text-white p-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm">No users found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5"
              >
                {/* Row header */}
                <div className="flex flex-col md:flex-row items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-white text-base">{user.name || "—"}</p>
                    <p className="text-emerald-400 text-sm">{user.email || "—"}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {user.created_at ? new Date(user.created_at).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-2">
                    {editingId === user.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id as string)}
                          className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-red-300 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {FIELDS.filter((f) => f !== "name" && f !== "email").map((field) => (
                    <div key={field} className="bg-slate-800 rounded-lg p-2">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{field.replace(/_/g, " ")}</p>
                      {editingId === user.id ? (
                        <input
                          value={editData[field] ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          className="w-full bg-slate-700 rounded text-white text-xs p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <p className="text-white text-xs font-medium truncate">
                          {user[field] || <span className="text-slate-600">—</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete user?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}