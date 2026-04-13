import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string;
  const file = formData.get("file") as File | null;

  if (!process.env.EDIT_PASSWORD || password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!file || !slug) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate that it's actually an image
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${Date.now()}-${slug}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const imageUrl = `/uploads/${filename}`;

  // Update reviews.json
  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const reviews = JSON.parse(await fs.readFile(reviewsPath, "utf-8"));
  const idx = reviews.findIndex((r: { slug: string }) => r.slug === slug);
  if (idx === -1) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  reviews[idx].imageUrl = imageUrl;
  await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2));

  return NextResponse.json({ success: true, imageUrl });
}
