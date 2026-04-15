import ReviewCard from "./components/ReviewCard";
import { getReviews } from "./lib/db";

export const dynamic = "force-dynamic";

const CATEGORY_HEADINGS: Record<string, string> = {
  Restaurants: "The Best Restaurants",
  Bakery: "The Best Bakeries",
  "Coffee Shop": "The Best Coffee Shops",
  "Ice Cream": "The Best Ice Cream",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string }>;
}) {
  const { cuisine } = await searchParams;

  const reviewsData = await getReviews();

  const reviews = cuisine
    ? reviewsData.filter((r) => r.category === cuisine)
    : reviewsData;

  const heading = cuisine
    ? (CATEGORY_HEADINGS[cuisine] ?? `The Best ${cuisine}`)
    : "The Best Spots";

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Editorial header */}
      <div className="mb-10 border-b border-zinc-200 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C1440E] mb-2">
          San Francisco
        </p>
        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-4">
          {heading}
          <br />
          <span className="text-zinc-400">Worth Your Time</span>
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl">
          Honest reviews from someone who eats out too much and has opinions about it.
        </p>
      </div>

      {/* Review grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {reviews.map((review: any) => (
            <ReviewCard key={review.slug} review={review} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-zinc-400 text-lg font-medium">
            No reviews yet for this category.
          </p>
        </div>
      )}
    </main>
  );
}
