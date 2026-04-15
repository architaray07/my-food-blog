import { NextResponse } from "next/server";
import { getReviews, saveReviews, getAbout, saveAbout } from "../../lib/db";

/** Set a value at a dot-notation path, e.g. "facts.2.note" */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setByPath(obj: Record<string, any>, dotPath: string, value: any) {
  const keys = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { password, type, slug, field, value } = body;

  if (!process.env.EDIT_PASSWORD || password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (type === "review") {
    const reviews = await getReviews();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = reviews.findIndex((r: any) => r.slug === slug);
    if (idx === -1) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    reviews[idx][field] = value;
    await saveReviews(reviews);
    return NextResponse.json({ success: true });
  }

  if (type === "about") {
    const about = await getAbout();
    setByPath(about, field, value);
    await saveAbout(about);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
