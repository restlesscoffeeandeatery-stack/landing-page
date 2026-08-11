import { env } from "cloudflare:workers";
import { requireAdminApi } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "pdf" ? "pdf" : "page";
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });

  if (kind === "pdf") {
    if (file.type !== "application/pdf") return Response.json({ error: "PDF required" }, { status: 400 });
    const key = `menu/menu-${Date.now()}.pdf`;
    await env.MENU_ASSETS.put(key, file.stream(), { httpMetadata: { contentType: file.type, contentDisposition: `inline; filename="${file.name.replaceAll('"', '')}"` } });
    const previous = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'menu_pdf_key'").first<{ value: string }>();
    await env.DB.prepare("INSERT INTO site_settings(key, value, updated_at) VALUES('menu_pdf_key', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(key, new Date().toISOString()).run();
    if (previous?.value) await env.MENU_ASSETS.delete(previous.value);
    return Response.json({ ok: true, pdfUrl: `/api/menu/assets?key=${encodeURIComponent(key)}` });
  }

  if (!file.type.startsWith("image/")) return Response.json({ error: "Image required" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "Maximum image size is 8 MB" }, { status: 400 });
  const id = crypto.randomUUID();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `menu/pages/${id}.${extension}`;
  await env.MENU_ASSETS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  const position = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM menu_pages").first<{ position: number }>();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO menu_pages(id, name, image_key, image_url, position, is_active, created_at, updated_at) VALUES(?, ?, ?, NULL, ?, 1, ?, ?)").bind(id, file.name.replace(/\.[^.]+$/, ""), key, position?.position ?? 0, now, now).run();
  return Response.json({ page: { id, name: file.name.replace(/\.[^.]+$/, ""), src: `/api/menu/assets?key=${encodeURIComponent(key)}`, position: position?.position ?? 0 } }, { status: 201 });
}
