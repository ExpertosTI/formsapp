import { cookies } from "next/headers";

export const AUTH_COOKIE = "talentolink_admin";

export function getAdminCredentials() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD son requeridos en producción");
    }
    return { email: "admin@renace.tech", password: "dev-only" };
  }

  return { email, password };
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production" && token === "dev-session";
  return token === secret;
}

export function validateCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  return email === creds.email && password === creds.password;
}
