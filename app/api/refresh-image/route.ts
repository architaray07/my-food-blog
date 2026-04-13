import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { fetchRestaurantImage } from "../../lib/fetchRestaurantImage";

export async function POST(request: Request) {
  const body = await request.json();
  const { password, slug } = body;

  if (!process.env.EDIT_PASSWORD || password !== process.env.EDIT_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const reviews = JSON.parse(await fs.readFile(reviewsPath, "utf-8"));
  const idx = reviews.findIndex((r: { slug: string }) => r.slug === slug);

  if (idx === -1) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const review = reviews[idx];

  const imageUrl = await fetchRestaurantImage(
    review.name,
    review.neighborhood,
    review.city ?? "San Francisco",
    review.category,
    review.cuisine ?? ""
  );

  if (!imageUrl) {
    return NextResponse.json(
      { error: "No image found — check your GOOGLE_PLACES_API_KEY and UNSPLASH_ACCESS_KEY in .env.local" },
      { status: 404 }
    );
  }

  reviews[idx].imageUrl = imageUrl;
  await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2));

  return NextResponse.json({ success: true, imageUrl });
}
