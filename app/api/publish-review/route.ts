import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { fetchRestaurantImage } from "../../lib/fetchRestaurantImage";

// NOTE: This route writes to data/reviews.json on the local filesystem.
// This works perfectly in development. On Vercel (production), the filesystem
// is read-only — migrate to Supabase when you're ready to deploy.

export async function POST(request: Request) {
  const formData = await request.formData();

  const password = formData.get("password") as string;
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = formData.get("name") as string;
  const neighborhood = formData.get("neighborhood") as string;
  const addressInput = (formData.get("address") as string | null)?.trim();
  const category = formData.get("category") as string;
  const cuisine = (formData.get("cuisine") as string | null) ?? "";
  const priceRange = formData.get("priceRange") as string;
  const review = formData.get("review") as string;
  const rating = formData.get("rating") as string;
  const summary = formData.get("summary") as string;

  // Date is set server-side at publish time so it's never affected by client timezone
  // or later edits. Format: YYYY-MM-DD in the server's local time.
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Build slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  // Handle photo: uploaded → Google Places → Unsplash → picsum placeholder
  const photo = formData.get("photo") as File | null;
  let imageUrl = `https://picsum.photos/seed/${baseSlug}/800/500`;

  if (photo && photo.size > 0) {
    try {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${slug}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    } catch {
      console.warn("Photo upload failed, falling back to auto-fetch");
    }
  }

  // No uploaded photo — try to find one automatically
  if (!imageUrl.startsWith("/uploads/")) {
    const fetched = await fetchRestaurantImage(
      name,
      neighborhood,
      "San Francisco",
      category,
      cuisine
    );
    if (fetched) imageUrl = fetched;
  }

  const newReview = {
    id: String(Date.now()),
    slug,
    name,
    category,
    cuisine,
    neighborhood,
    city: "San Francisco",
    priceRange,
    address: addressInput || `${neighborhood}, San Francisco, CA`,
    shortPreview: summary,
    fullReview: review,
    rating,
    date,
    imageUrl,
  };

  // Read → prepend → write
  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const existing = JSON.parse(await fs.readFile(reviewsPath, "utf-8"));
  existing.unshift(newReview);
  await fs.writeFile(reviewsPath, JSON.stringify(existing, null, 2));

  return NextResponse.json({ success: true, slug });
}
