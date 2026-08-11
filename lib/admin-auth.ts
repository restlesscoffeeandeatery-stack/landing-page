import { getChatGPTUser } from "../app/chatgpt-auth";

export const ADMIN_EMAIL = "rezkyrayhan00@gmail.com";

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return { ok: false as const, response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  if (user.email.toLowerCase() !== ADMIN_EMAIL) return { ok: false as const, response: Response.json({ error: "Admin access required" }, { status: 403 }) };
  return { ok: true as const, user };
}
