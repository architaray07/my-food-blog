/**
 * Fetches a high-quality image for a restaurant review.
 *
 * Priority:
 *  1. Google Places API  — actual photos of the specific restaurant
 *  2. Unsplash           — beautiful food/cuisine photography as a fallback
 *  3. null               — caller falls back to a placeholder
 */

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  Bakery: "artisan bakery pastry bread",
  "Coffee Shop": "specialty coffee cafe latte",
  "Ice Cream": "ice cream gelato dessert",
  Bars: "cocktail bar drinks",
  Restaurants: "restaurant food dining",
};

// ── Google Places ────────────────────────────────────────────────────────────

async function fetchGooglePlacesImage(
  name: string,
  neighborhood: string,
  city: string
): Promise<string | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  try {
    // Step 1: Text search to find the place
    const query = encodeURIComponent(`${name} ${neighborhood} ${city}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${key}`
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    if (searchData.status !== "OK" || !searchData.results?.length) return null;

    const placeId = searchData.results[0]?.place_id;
    if (!placeId) return null;

    // Step 2: Get photo references from place details
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`
    );
    if (!detailsRes.ok) return null;

    const detailsData = await detailsRes.json();
    const photos = detailsData.result?.photos;
    if (!photos?.length) return null;

    const photoRef = photos[0].photo_reference;

    // Step 3: Follow the redirect to get the stable public CDN URL
    // Google Places photo URLs redirect to lh3.googleusercontent.com which is
    // publicly accessible without an API key — safe to store in the JSON.
    const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoRef}&key=${key}`;
    const photoRes = await fetch(photoApiUrl, { redirect: "manual" });
    const finalUrl = photoRes.headers.get("location");

    return finalUrl ?? null;
  } catch {
    return null;
  }
}

// ── Unsplash ─────────────────────────────────────────────────────────────────

async function fetchUnsplashImage(
  name: string,
  category: string,
  cuisine: string
): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const cuisineTerms = cuisine && cuisine !== "" ? cuisine : "";
  const categoryTerms = CATEGORY_SEARCH_TERMS[category] ?? "food restaurant";

  // Queries from most specific to most generic
  const queries: string[] = [
    cuisineTerms
      ? `${cuisineTerms} food restaurant dish`
      : `${name} food restaurant`,
    categoryTerms,
  ];

  for (const query of queries) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${key}` },
      });
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.results?.length) continue;

      // Pick from top 3 for variety
      const pick =
        data.results[Math.floor(Math.random() * Math.min(3, data.results.length))];
      // Raw URL + Unsplash CDN params for consistent sizing
      return `${pick.urls.raw}&w=1200&q=85&fit=crop&auto=format`;
    } catch {
      continue;
    }
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchRestaurantImage(
  name: string,
  neighborhood: string,
  city: string,
  category: string,
  cuisine: string
): Promise<string | null> {
  // 1. Google Places — real photos of the actual restaurant
  const googleImage = await fetchGooglePlacesImage(name, neighborhood, city);
  if (googleImage) return googleImage;

  // 2. Unsplash — beautiful food/cuisine photography
  const unsplashImage = await fetchUnsplashImage(name, category, cuisine);
  if (unsplashImage) return unsplashImage;

  return null;
}
