import { env } from "cloudflare:workers";
import { requireAdminApi } from "../../../lib/admin-auth";
import { CONTENT_LIMITS, DEFAULT_SITE_CONTENT, type SiteContent } from "../../../lib/content-defaults";

function parseContent(value?: string | null): SiteContent {
  if (!value) return DEFAULT_SITE_CONTENT;
  try { return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(value) }; } catch { return DEFAULT_SITE_CONTENT; }
}

function validateContent(input: unknown): SiteContent | null {
  if (!input || typeof input !== "object") return null;
  const result = { ...DEFAULT_SITE_CONTENT };
  for (const key of Object.keys(DEFAULT_SITE_CONTENT) as Array<keyof SiteContent>) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value !== "string") return null;
    const normalized = value.trim().slice(0, CONTENT_LIMITS[key]);
    if (key.endsWith("Url")) {
      try { const url = new URL(normalized); if (url.protocol !== "https:") return null; } catch { return null; }
    }
    result[key] = normalized;
  }
  return result;
}

export async function GET(request: Request) {
  const adminMode = new URL(request.url).searchParams.get("mode") === "admin";
  if (adminMode) {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;
    const rows = await env.DB.prepare("SELECT key, value, updated_at FROM site_settings WHERE key IN ('published_content', 'draft_content')").all<{ key: string; value: string; updated_at: string }>();
    const map = Object.fromEntries(rows.results.map((row) => [row.key, row]));
    return Response.json({ published: parseContent(map.published_content?.value), draft: parseContent(map.draft_content?.value || map.published_content?.value), publishedAt: map.published_content?.updated_at || null, draftAt: map.draft_content?.updated_at || null });
  }
  const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'published_content'").first<{ value: string }>();
  return Response.json({ content: parseContent(row?.value) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const payload = await request.json() as { action?: "save_draft" | "publish"; content?: unknown };
  const content = validateContent(payload.content);
  if (!content || !payload.action) return Response.json({ error: "Konten atau tautan tidak valid. Semua URL harus menggunakan https://" }, { status: 400 });
  const now = new Date().toISOString();
  const serialized = JSON.stringify(content);
  const key = payload.action === "publish" ? "published_content" : "draft_content";
  const statements = [env.DB.prepare("INSERT INTO site_settings(key, value, updated_at) VALUES(?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(key, serialized, now)];
  if (payload.action === "publish") statements.push(env.DB.prepare("INSERT INTO site_settings(key, value, updated_at) VALUES('draft_content', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(serialized, now));
  await env.DB.batch(statements);
  return Response.json({ ok: true, action: payload.action, updatedAt: now });
}
