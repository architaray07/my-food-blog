import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewEditableBody from "../../components/ReviewEditableBody";
import EditableHeroImage from "../../components/EditableHeroImage";

// Always read from disk so image refreshes and edits show without restarting the server
export const dynamic = "force-dynamic";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const GRADE_STYLES: Record<string, string> = {
  "A+": "bg-emerald-700",
  "A":  "bg-emerald-600",
  "A-": "bg-emerald-500",
  "B+": "bg-yellow-500",
  "B":  "bg-yellow-400",
  "B-": "bg-yellow-300",
  "C+": "bg-orange-600",
  "C":  "bg-orange-500",
  "C-": "bg-orange-400",
  "D":  "bg-red-500",
};

const GRADE_TEXT: Record<string, string> = {
  "B+": "text-zinc-900", "B": "text-zinc-900", "B-": "text-zinc-900",
};

function isAList(grade: string): boolean {
  return grade === "A+" || grade === "A";
}

export default async function ReviewPage(props: PageProps<"/reviews/[slug]">) {
  const { slug } = await props.params;

  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const reviewsData = JSON.parse(await fs.readFile(reviewsPath, "utf-8"));
  const review = reviewsData.find((r: { slug: string }) => r.slug === slug);

  if (!review) notFound();

  return (
    <main>
      <EditableHeroImage
        slug={review.slug}
        imageUrl={review.imageUrl}
        name={review.name}
        category={review.category}
      />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Rating + meta row */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-zinc-200">
          {/* Grade circle */}
          <div
            className={`${GRADE_STYLES[review.rating] ?? "bg-zinc-500"} ${GRADE_TEXT[review.rating] ?? "text-white"} w-16 h-16 rounded-full flex items-center justify-center shrink-0`}
            aria-label={`Grade: ${review.rating}`}
          >
            <span className="text-xl font-black leading-none tracking-tight">
              {review.rating}
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

        {/* A-List banner — only for A+ and A */}
        {isAList(review.rating) && (
          <div className="flex items-center gap-2.5 mb-8 bg-zinc-900 text-white px-4 py-3 rounded-sm">
            <span className="text-amber-400 text-base">★</span>
            <span className="text-xs font-black uppercase tracking-[0.2em]">A-List</span>
            <span className="text-zinc-500 text-xs">—</span>
            <span className="text-xs text-zinc-400 font-medium">One of the best spots in San Francisco</span>
          </div>
        )}

        <ReviewEditableBody
          slug={review.slug}
          category={review.category}
          cuisine={review.cuisine ?? ""}
          rating={review.rating}
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
