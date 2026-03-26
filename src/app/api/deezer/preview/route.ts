import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "cdns-preview-d.dzcdn.net",
  "cdns-preview-e.dzcdn.net",
  "cdns-preview-f.dzcdn.net",
  "cdnt-preview.dzcdn.net",
]);

function isAllowedPreviewUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") return false;
    // Check exact match or wildcard pattern
    if (ALLOWED_HOSTS.has(url.hostname)) return true;
    // Also allow any cdns-preview-*.dzcdn.net pattern
    return /^cdn[st]-preview(-[a-z0-9]+)?\.dzcdn\.net$/.test(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !isAllowedPreviewUrl(url)) {
    return new Response("Invalid preview URL", { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Failed to reach Deezer CDN: ${message}`, {
      status: 502,
    });
  }

  if (!response.ok) {
    return new Response(
      `Deezer CDN returned ${response.status}: ${response.statusText}`,
      { status: 502 },
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(arrayBuffer.byteLength),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
