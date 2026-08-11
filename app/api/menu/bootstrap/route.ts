import { env } from "cloudflare:workers";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { DEFAULT_MENU_PAGES } from "../../../../lib/menu-defaults";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM menu_pages").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return Response.json({ ok: true, created: 0 });
  const now = new Date().toISOString();
  await env.DB.batch(DEFAULT_MENU_PAGES.map((page) => env.DB.prepare("INSERT INTO menu_pages(id, name, image_key, image_url, position, is_active, created_at, updated_at) VALUES(?, ?, NULL, ?, ?, 1, ?, ?)").bind(page.id, page.name, page.src, page.position, now, now)));
  return Response.json({ ok: true, created: DEFAULT_MENU_PAGES.length });
}
