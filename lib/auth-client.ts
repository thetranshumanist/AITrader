import { createAuthClient } from "better-auth/react";
import type { Session, User } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Custom hook for user data
export function useUser() {
  const session = useSession();
  return {
    user: session.data?.user,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
  };
}

// Helper functions for auth
export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session?.data?.user) {
    throw new Error("Authentication required");
  }
  return session.data.user;
}

export function hasRole(user: User | null | undefined, role: string): boolean {
  return (user as any)?.role === role;
}

export function hasAnyRole(user: User | null | undefined, roles: string[]): boolean {
  return roles.includes((user as any)?.role || "");
}

export function canAccessResource(user: User | null | undefined, resource: string): boolean {
  if (!user) return false;
  
  const rolePermissions: Record<string, string[]> = {
    admin: ["*"],
    trader: ["portfolio", "trades", "signals", "market-data"],
    user: ["portfolio", "trades", "signals", "market-data"],
    viewer: ["portfolio", "market-data"],
  };
  
  const permissions = rolePermissions[(user as any).role || "viewer"] || [];
  return permissions.includes("*") || permissions.includes(resource);
}