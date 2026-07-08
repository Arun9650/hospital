import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: string;
};

/** Current signed-in user id, or undefined (mock mode / signed out). */
export async function getUserId(): Promise<string | undefined> {
  if (!isSupabaseConfigured) return undefined;
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

/** Full session user for headers/shells, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      name: (meta.full_name as string) || user.email || "Member",
      email: user.email ?? "",
      initials: (meta.initials as string) || (user.email ?? "AH").slice(0, 2).toUpperCase(),
      color: (meta.avatar_color as string) || "#0070d1",
      role: (meta.role as string) || "patient",
    };
  } catch {
    return null;
  }
}
