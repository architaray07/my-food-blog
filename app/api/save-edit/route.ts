import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

/** Set a value at a dot-notation path, e.g. "facts.2.note" */
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
    const filePath = path.join(process.cwd(), "data", "reviews.json");
    const reviews = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const idx = reviews.findIndex((r: any) => r.slug === slug);
    if (idx === -1) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    reviews[idx][field] = value;
    await fs.writeFile(filePath, JSON.stringify(reviews, null, 2));
    return NextResponse.json({ success: true });
  }

  if (type === "about") {
    const filePath = path.join(process.cwd(), "data", "about.json");
    const about = JSON.parse(await fs.readFile(filePath, "utf-8"));
    setByPath(about, field, value);
    await fs.writeFile(filePath, JSON.stringify(about, null, 2));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
