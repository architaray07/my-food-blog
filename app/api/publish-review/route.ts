import { NextResponse } from "next/server";
import { fetchRestaurantImage } from "../../lib/fetchRestaurantImage";
import { getReviews, saveReviews } from "../../lib/db";
import { uploadImage } from "../../lib/blob-storage";

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
      imageUrl = await uploadImage(buffer, filename);
    } catch {
      console.warn("Photo upload failed, falling back to auto-fetch");
    }
  }

  // No uploaded photo — try to find one automatically
  if (!imageUrl.startsWith("/uploads/") && !imageUrl.includes("blob.vercel-storage.com")) {
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
  const existing = await getReviews();
  existing.unshift(newReview);
  await saveReviews(existing);

  return NextResponse.json({ success: true, slug });
}
