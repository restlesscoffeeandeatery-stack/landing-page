import { env } from "cloudflare:workers";
import { DEFAULT_MENU_PAGES } from "../../../lib/menu-defaults";
import { requireAdminApi } from "../../../lib/admin-auth";

type MenuRow = { id: string; name: string; image_key: string | null; image_url: string | null; position: number };

function publicPage(row: MenuRow) {
  return { id: row.id, name: row.name, src: row.image_key ? `/api/menu/assets?key=${encodeURIComponent(row.image_key)}` : row.image_url, position: row.position };
}

export async function GET() {
  const result = await env.DB.prepare("SELECT id, name, image_key, image_url, position FROM menu_pages WHERE is_active = 1 ORDER BY position ASC").all<MenuRow>();
  const pages = result.results.map(publicPage);
  const setting = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'menu_pdf_key'").first<{ value: string }>();
  return Response.json({ pages: pages.length ? pages : DEFAULT_MENU_PAGES, pdfUrl: setting?.value ? `/api/menu/assets?key=${encodeURIComponent(setting.value)}` : "/menu/menu-restless-2026.pdf" });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const payload = await request.json() as { pages?: Array<{ id: string; name: string; position: number }> };
  if (!Array.isArray(payload.pages)) return Response.json({ error: "pages is required" }, { status: 400 });
  const statements = payload.pages.map((page, index) => env.DB.prepare("UPDATE menu_pages SET name = ?, position = ?, updated_at = ? WHERE id = ?").bind(page.name.trim() || `Halaman ${index + 1}`, index, new Date().toISOString(), page.id));
  if (statements.length) await env.DB.batch(statements);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const row = await env.DB.prepare("SELECT image_key FROM menu_pages WHERE id = ?").bind(id).first<{ image_key: string | null }>();
  if (row?.image_key) await env.MENU_ASSETS.delete(row.image_key);
  await env.DB.prepare("DELETE FROM menu_pages WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
