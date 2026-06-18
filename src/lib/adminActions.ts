import { supabase } from "@/lib/supabaseClient";
import { User } from "@/types/admin";

export async function fetchAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from("users").delete().eq("id", id);
  return !error;
}

export async function updateUser(id: string, data: User): Promise<boolean> {
  const { error } = await supabase.from("users").update(data).eq("id", id);
  return !error;
}