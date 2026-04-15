import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// Vercel Hobby caps functions at 10s — bump to 60s so Claude has time to respond
export const maxDuration = 60;

/** Walk the string character by character to find the first balanced {...} block. */
function extractFirstJSON(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model response");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("No complete JSON object found in model response");
}

const SYSTEM_PROMPT = `You are a food writer turning someone's voice note into a polished blog-style review. Your job is to faithfully represent what they actually said — expand on their details, give them texture, but never invent opinions or experiences they didn't mention.

Style:
- Warm, direct, and confident — like a friend who eats out constantly and has real opinions
- Conversational but editorial — not a Yelp review, not a magazine puff piece
- Stay true to the person's actual sentiment. Enthusiastic transcript = enthusiastic review. Mixed = mixed.
- Specific — every dish, flavor, texture, and detail they mentioned should make it in
- NEVER use: "culinary journey", "hidden gem", "flavor explosion", "taste buds", "foodie paradise", "vibrant", "elevated", "delightful", "amazing" as a throwaway word
- Never start with "I recently visited..." or "I had the pleasure of..."

Structure — write exactly 3 paragraphs separated by \\n\\n:
- Paragraph 1 (4–6 sentences): Set the scene. What kind of place is it, where is it, what's the vibe, why does it have a reputation. Draw from anything contextual the person mentioned.
- Paragraph 2 (4–6 sentences): The food. Go through every specific dish, drink, or item they mentioned. Describe textures, flavors, what made it good or not. Be specific and generous with detail.
- Paragraph 3 (3–5 sentences): Practical take. Who should go, when, what to expect (lines, price, experience). End with a clear recommendation or final impression that matches their overall sentiment.

Each paragraph must be substantive — 4 sentences minimum. A short paragraph is a failure.

Rating: one letter grade:
  - A+ = exceptional, must-go destination
  - A  = excellent, highly recommend
  - A- = very good, worth a special trip
  - B+ = good, worth going
  - B  = solid, dependable
  - B- = decent, some reservations
  - C+ = mediocre, mixed experience
  - C  = below average
  - C- = poor
  - D  = avoid

Return JSON only: { "review": "paragraph one\\n\\nparagraph two\\n\\nparagraph three", "rating": "A", "summary": "one punchy sentence (max 15 words) for the card preview — the single best thing about this place" }`;

export async function POST(request: Request) {
  const body = await request.json();
  const { password, transcript, restaurantName, neighborhood, category, cuisine, priceRange } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Write a review for:
Restaurant: ${restaurantName}
Neighborhood: ${neighborhood}, San Francisco
Category: ${category}${cuisine ? `\nCuisine: ${cuisine}` : ""}
Price range: ${priceRange}

Voice note transcript:
"${transcript?.trim() || "(No transcript provided — write a short placeholder review based on the restaurant details only, noting that the reviewer's notes are not available)"}"

Return JSON only.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract the first complete JSON object by counting braces.
    // This correctly handles braces inside string values and ignores
    // any preamble or trailing commentary the model adds.
    const parsed = extractFirstJSON(text);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Generate review error:", err);
    return NextResponse.json(
      { error: "Failed to generate review. Check your API key and try again." },
      { status: 500 }
    );
  }
}
