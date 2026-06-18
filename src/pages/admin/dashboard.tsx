import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FIELDS } from "@/lib/adminConstants";
import { useAdminUsers } from "@/hooks/useAdminUsers";

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("admin_authed") !== "true") {
      router.replace("/admin/login");
    } else {
      setAuthed(true);
    }
  }, []);

  const {
    users, loading, editingId, editData, setEditData,
    search, setSearch, deleteConfirm, setDeleteConfirm, toast,
    fetchUsers, handleDelete, handleEdit, handleSave, filtered, setEditingId 
  } = useAdminUsers();

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed]);

  const handleSignOut = () => {
    localStorage.removeItem("admin_authed");
    router.push("/admin/login");
  };

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-jakarta">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-xs mt-0.5">RibaWarrior Score — User Data</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{users.length} users</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6">
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
              <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-white text-base">{user.name || "—"}</p>
                    <p className="text-emerald-400 text-sm">{user.email || "—"}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {user.created_at ? new Date(user.created_at).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingId === user.id ? (
                      <>
                        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm font-semibold">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(user)} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold">Edit</button>
                        <button onClick={() => setDeleteConfirm(user.id as string)} className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-red-300 text-sm font-semibold">Delete</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {FIELDS.filter((f) => f !== "name" && f !== "email").map((field) => (
                    <div key={field} className="bg-slate-800 rounded-lg p-2">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{field.replace(/_/g, " ")}</p>
                      {editingId === user.id ? (
                        <input
                          value={editData[field] ?? ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, [field]: e.target.value }))}
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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete user?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">Yes, delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg bg-slate-700 font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}