"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";

const SessionContext = createContext<SessionUser | null>(null);

/** Provides the signed-in user to client components (headers/shells).
    Fed once from the root layout so no client bundle imports server code. */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** The current signed-in user, or null in mock/signed-out mode. */
export function useSessionUser() {
  return useContext(SessionContext);
}
