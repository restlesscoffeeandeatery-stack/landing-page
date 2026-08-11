import { env } from "cloudflare:workers";
import { requireAdminApi } from "../../../lib/admin-auth";

const ALLOWED_EVENTS = new Set(["page_viewed", "menu_viewed", "reservation_opened", "location_opened", "order_opened", "instagram_opened", "menu_pdf_downloaded"]);

export async function POST(request: Request) {
  const payload = await request.json() as { eventName?: string; anonymousId?: string; sessionId?: string; path?: string; referrer?: string; deviceType?: string };
  if (!payload.eventName || !ALLOWED_EVENTS.has(payload.eventName) || !payload.anonymousId || !payload.sessionId) return Response.json({ error: "Invalid event" }, { status: 400 });
  const now = new Date();
  let referrerHost: string | null = null;
  try { referrerHost = payload.referrer ? new URL(payload.referrer).hostname : null; } catch { referrerHost = null; }
  await env.DB.prepare("INSERT INTO site_events(event_name, anonymous_id, session_id, path, referrer_host, device_type, occurred_at, occurred_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(payload.eventName, payload.anonymousId.slice(0, 80), payload.sessionId.slice(0, 80), (payload.path || "/").slice(0, 200), referrerHost, (payload.deviceType || "unknown").slice(0, 20), now.toISOString(), now.toISOString().slice(0, 10)).run();
  return Response.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get("days") || 30)));
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const [totals, daily, events, devices, referrers] = await Promise.all([
    env.DB.prepare("SELECT COUNT(CASE WHEN event_name = 'page_viewed' THEN 1 END) AS page_views, COUNT(DISTINCT CASE WHEN event_name = 'page_viewed' THEN anonymous_id END) AS visitors, COUNT(DISTINCT CASE WHEN event_name = 'page_viewed' THEN session_id END) AS sessions, COUNT(CASE WHEN event_name != 'page_viewed' THEN 1 END) AS interactions FROM site_events WHERE occurred_date >= ?").bind(since).first(),
    env.DB.prepare("SELECT occurred_date AS date, COUNT(*) AS views, COUNT(DISTINCT anonymous_id) AS visitors FROM site_events WHERE event_name = 'page_viewed' AND occurred_date >= ? GROUP BY occurred_date ORDER BY occurred_date ASC").bind(since).all(),
    env.DB.prepare("SELECT event_name AS name, COUNT(*) AS count FROM site_events WHERE occurred_date >= ? GROUP BY event_name ORDER BY count DESC").bind(since).all(),
    env.DB.prepare("SELECT device_type AS name, COUNT(DISTINCT anonymous_id) AS count FROM site_events WHERE event_name = 'page_viewed' AND occurred_date >= ? GROUP BY device_type ORDER BY count DESC").bind(since).all(),
    env.DB.prepare("SELECT COALESCE(referrer_host, 'Direct') AS name, COUNT(*) AS count FROM site_events WHERE event_name = 'page_viewed' AND occurred_date >= ? GROUP BY referrer_host ORDER BY count DESC LIMIT 6").bind(since).all(),
  ]);
  return Response.json({ days, totals, daily: daily.results, events: events.results, devices: devices.results, referrers: referrers.results, definition: "Pengunjung unik dihitung dari anonymous ID per browser; traffic internal belum dikecualikan." });
}
