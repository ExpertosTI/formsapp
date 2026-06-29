export function getAdminCredentials() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    return { email: "admin@renace.tech", password: "dev-only" };
  }

  return { email, password };
}

export function validateCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (!creds) return false;
  return email === creds.email && password === creds.password;
}
