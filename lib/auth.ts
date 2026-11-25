import "server-only";
import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
  profile: { id: string; full_name: string | null; role: string } | null;
  isAdmin: boolean;
}

/** Sesión actual del panel (o null si no hay usuario). */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
  return { supabase, user, profile, isAdmin: profile?.role === "admin" };
});

export class AuthError extends Error {}

/** Para Server Actions: exige usuario administrador. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new AuthError("Tu sesión expiró. Volvé a ingresar.");
  if (!ctx.isAdmin) throw new AuthError("Tu usuario no tiene permisos de administrador.");
  return ctx;
}
