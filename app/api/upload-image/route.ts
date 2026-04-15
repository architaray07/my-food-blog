import { NextResponse } from "next/server";
import { getReviews, saveReviews } from "../../lib/db";
import { uploadImage } from "../../lib/blob-storage";

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

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${Date.now()}-${slug}.${ext}`;
  const imageUrl = await uploadImage(Buffer.from(await file.arrayBuffer()), filename);

  const reviews = await getReviews();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx = reviews.findIndex((r: any) => r.slug === slug);
  if (idx === -1) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  reviews[idx].imageUrl = imageUrl;
  await saveReviews(reviews);

  return NextResponse.json({ success: true, imageUrl });
}
