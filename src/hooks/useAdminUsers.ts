import { useState, useEffect } from "react";
import { User } from "@/types/admin";
import { fetchAllUsers, deleteUser, updateUser } from "@/lib/adminActions";

export function useAdminUsers() {
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

  const fetchUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUser(id);
    if (success) {
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
    const success = await updateUser(editingId!, editData);
    if (success) {
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

  return {
    users, loading, editingId, editData, setEditData,
    search, setSearch, deleteConfirm, setDeleteConfirm, toast,
    fetchUsers, handleDelete, handleEdit, handleSave, filtered, setEditingId
  };
}