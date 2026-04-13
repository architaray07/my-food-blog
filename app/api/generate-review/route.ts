import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a friendly, genuine food writer turning someone's voice note into a polished review. Your job is to faithfully represent what they actually said — don't invent opinions, don't exaggerate, don't punch up the language beyond what the person's tone suggests.

Style:
- Warm and honest — you like food and that comes through, but you're not gushing
- Conversational, like a thoughtful friend's recommendation — not a magazine critic
- Stay close to what the person described; if they were enthusiastic, be enthusiastic; if they were mixed, be mixed
- Specific — use the dishes, flavors, and details from the transcript
- NEVER use: "culinary journey", "hidden gem", "flavor explosion", "taste buds", "foodie paradise", "vibrant", "elevated"
- Write exactly 3 paragraphs separated by \\n\\n — no more, no less
- Never start with "I recently visited..." or "I had the pleasure of..."
- Cover what to order and, if relevant, what to skip — only if the transcript mentions it
- Rating: one letter grade from this list: A+, A, A-, B+, B, B-, C+, C, C-, D
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

Return JSON only: { "review": "paragraph one\\n\\nparagraph two\\n\\nparagraph three", "rating": "A", "summary": "one sentence for card preview" }`;

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
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown fences before parsing
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Generate review error:", err);
    return NextResponse.json(
      { error: "Failed to generate review. Check your API key and try again." },
      { status: 500 }
    );
  }
}
