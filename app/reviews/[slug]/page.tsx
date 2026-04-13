import { promises as fs } from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewEditableBody from "../../components/ReviewEditableBody";

// Always read from disk so image refreshes and edits show without restarting the server
export const dynamic = "force-dynamic";

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "bg-emerald-500";
  if (rating >= 4.0) return "bg-blue-500";
  if (rating >= 3.5) return "bg-amber-500";
  return "bg-red-500";
}

export default async function ReviewPage(props: PageProps<"/reviews/[slug]">) {
  const { slug } = await props.params;

  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const reviewsData = JSON.parse(await fs.readFile(reviewsPath, "utf-8"));
  const review = reviewsData.find((r: { slug: string }) => r.slug === slug);

  if (!review) notFound();

  return (
    <main>
      {/* Hero image */}
      <div className="relative w-full h-[50vh] md:h-[60vh] bg-zinc-900">
        <Image
          src={review.imageUrl}
          alt={`Photo for ${review.name} restaurant review`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Header content on image */}
        <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
            <Link href="/" className="hover:text-white transition-colors">
              Reviews
            </Link>
            <span>›</span>
            <span>{review.category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
            {review.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Rating + meta row */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-zinc-200">
          {/* Rating circle */}
          <div
            className={`${getRatingColor(review.rating)} text-white w-16 h-16 rounded-full flex items-center justify-center shrink-0`}
            aria-label={`Rating: ${review.rating} out of 5`}
          >
            <span className="text-2xl font-black leading-none">
              {review.rating.toFixed(1)}
            </span>
          </div>

          {/* All meta on one line */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Neighborhood</p>
              <p className="font-semibold text-sm">{review.neighborhood}</p>
            </div>
            {review.cuisine && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Cuisine</p>
                <p className="font-semibold text-sm">{review.cuisine}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Price</p>
              <p className="font-semibold text-sm">{review.priceRange}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Address</p>
              <p className="font-semibold text-sm">{review.address}</p>
            </div>
          </div>
        </div>

        <ReviewEditableBody
          slug={review.slug}
          shortPreview={review.shortPreview}
          fullReview={review.fullReview}
        />

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#C1440E] hover:text-zinc-900 transition-colors"
          >
            ← All Reviews
          </Link>
        </div>
      </div>
    </main>
  );
}
