import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { query } = (await request.json()) as { query: string };

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Unsplash not configured — add NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to .env.local" },
      { status: 503 }
    );
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Unsplash search failed" }, { status: res.status });
  }

  const data = await res.json() as {
    results: Array<{
      id: string;
      urls: { small: string; raw: string };
      alt_description: string | null;
      description: string | null;
      user: { name: string };
    }>;
  };

  const results = data.results.map((r) => ({
    id: r.id,
    thumb: r.urls.small,
    full: `${r.urls.raw}&w=1200&q=85&fit=crop&auto=format`,
    description: r.alt_description ?? r.description ?? "",
    author: r.user.name,
  }));

  return NextResponse.json({ results });
}
