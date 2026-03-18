import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !url.match(/^https:\/\/cdn[st]-preview/)) {
    return new Response("Invalid preview URL", { status: 400 });
  }

  const response = await fetch(url);

  if (!response.ok) {
    return new Response("Failed to fetch preview", { status: response.status });
  }

  const arrayBuffer = await response.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
