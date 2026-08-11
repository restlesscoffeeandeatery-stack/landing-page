import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("menu/")) return new Response("Not found", { status: 404 });
  const object = await env.MENU_ASSETS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  return new Response(object.body, { headers });
}
