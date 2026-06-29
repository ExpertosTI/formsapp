import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./auth-constants";

export { AUTH_COOKIE } from "./auth-constants";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production" && token === "dev-session";
  return token === secret;
}
