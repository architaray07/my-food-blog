import { NextResponse } from "next/server";

// Maps Google Places types → our category values
function toCategory(types: string[]): string {
  if (types.includes("bakery")) return "Bakery";
  if (types.includes("cafe") || types.includes("coffee_shop")) return "Coffee Shop";
  if (types.includes("ice_cream_shop")) return "Ice Cream";
  if (types.includes("restaurant") || types.some((t) => t.endsWith("_restaurant"))) return "Restaurants";
  return "";
}

// Maps Google Places types → our cuisine values (Restaurants only)
function toCuisine(types: string[]): string {
  const map: Record<string, string> = {
    italian_restaurant: "Italian",
    chinese_restaurant: "Chinese",
    japanese_restaurant: "Japanese",
    korean_restaurant: "Korean",
    thai_restaurant: "Thai",
    vietnamese_restaurant: "Vietnamese",
    french_restaurant: "French",
    indian_restaurant: "Indian",
    mexican_restaurant: "Mexican",
    mediterranean_restaurant: "Mediterranean",
    american_restaurant: "American",
    middle_eastern_restaurant: "Middle Eastern",
  };
  for (const t of types) {
    if (map[t]) return map[t];
  }
  return "";
}

// Maps Google price_level (0–4) → our price range symbols
function toPriceRange(level: number | undefined): string {
  const map: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return level != null ? (map[level] ?? "") : "";
}

// "838 Divisadero St, San Francisco, CA 94117, USA" → "838 Divisadero St, San Francisco"
function formatAddress(full: string): string {
  const parts = full.split(", ");
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : full;
}

export async function POST(request: Request) {
  const { name, neighborhood, transcript } = await request.json();

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });
  }

  // Build query: name + neighborhood, and pull any extra location hints from transcript
  // (e.g. "Mission Rock location", "the one in the Richmond") to find the right branch
  const locationHint = extractLocationHint(transcript ?? "");
  const query = [name, locationHint || neighborhood, "San Francisco"]
    .filter(Boolean)
    .join(" ");

  try {
    // Step 1: text search
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`
    );
    const searchData = await searchRes.json();
    if (searchData.status !== "OK" || !searchData.results?.length) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const placeId: string = searchData.results[0].place_id;

    // Step 2: place details — address, name, price level, types
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,price_level,types&key=${key}`
    );
    const detailsData = await detailsRes.json();
    const d = detailsData.result ?? {};
    const types: string[] = d.types ?? searchData.results[0].types ?? [];

    const category = toCategory(types);

    return NextResponse.json({
      name: d.name ?? searchData.results[0].name ?? name,
      address: formatAddress(d.formatted_address ?? searchData.results[0].formatted_address ?? ""),
      category,
      cuisine: category === "Restaurants" ? toCuisine(types) : "",
      priceRange: toPriceRange(d.price_level ?? searchData.results[0].price_level),
    });
  } catch (err) {
    console.error("lookup-place error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

// Extract neighbourhood or street mentions from the transcript to help
// identify which branch the reviewer visited.
function extractLocationHint(transcript: string): string {
  // Named SF micro-locations that could distinguish branches
  const knownAreas = [
    "Mission Rock", "Civic Center", "Inner Richmond", "Outer Richmond",
    "Inner Sunset", "Outer Sunset", "North Beach", "the Mission",
    "Hayes Valley", "Castro", "Marina", "Noe Valley", "Dogpatch",
    "Potrero Hill", "SoMa", "Chinatown", "Japantown",
  ];
  for (const area of knownAreas) {
    if (transcript.toLowerCase().includes(area.toLowerCase())) return area;
  }
  return "";
}
