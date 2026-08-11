import { requireChatGPTUser } from "../chatgpt-auth";
import { ADMIN_EMAIL } from "../../lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowed = user.email.toLowerCase() === ADMIN_EMAIL;
  if (!allowed) return <main style={{ padding: 40, fontFamily: "sans-serif" }}><h1>Akses tidak diizinkan</h1><p>Akun {user.email} bukan admin Restless.</p><a href="/">Kembali ke situs</a></main>;
  return <AdminDashboard userName={user.displayName} />;
}
