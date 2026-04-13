import Image from "next/image";
import Link from "next/link";

interface Review {
  slug: string;
  name: string;
  category: string;
  cuisine?: string;
  neighborhood: string;
  priceRange: string;
  shortPreview: string;
  rating: string;
  date: string;
  imageUrl: string;
}

const GRADE_STYLES: Record<string, string> = {
  "A+": "bg-emerald-700 text-white",
  "A":  "bg-emerald-600 text-white",
  "A-": "bg-emerald-500 text-white",
  "B+": "bg-yellow-500 text-zinc-900",
  "B":  "bg-yellow-400 text-zinc-900",
  "B-": "bg-yellow-300 text-zinc-900",
  "C+": "bg-orange-600 text-white",
  "C":  "bg-orange-500 text-white",
  "C-": "bg-orange-400 text-white",
  "D":  "bg-red-500 text-white",
};

function isAList(grade: string): boolean {
  return grade === "A+" || grade === "A";
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <Link href={`/reviews/${review.slug}`} className="group block">
      <article className="flex flex-col h-full">
        {/* Photo */}
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-zinc-100">
          <Image
            src={review.imageUrl}
            alt={review.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={review.imageUrl.startsWith("/")}
          />
          {/* A-List badge — top left */}
          {isAList(review.rating) && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm">
              <span className="text-amber-400">★</span>
              <span>A-List</span>
            </div>
          )}
          {/* Grade badge — top right */}
          <div
            className={`absolute top-3 right-3 ${GRADE_STYLES[review.rating] ?? "bg-zinc-500 text-white"} text-sm font-black px-2.5 py-1 rounded-sm`}
          >
            {review.rating}
          </div>
        </div>

        {/* Content */}
        <div className="pt-3 pb-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
            <span>{review.cuisine || review.category}</span>
            <span>·</span>
            <span>{review.neighborhood}</span>
            <span>·</span>
            <span>{review.priceRange}</span>
          </div>

          <h2 className="text-xl font-black leading-tight mb-2 group-hover:text-[#C1440E] transition-colors">
            {review.name}
          </h2>

          <p className="text-sm text-zinc-600 leading-relaxed flex-1 line-clamp-3">
            {review.shortPreview}
          </p>

          <p className="mt-3 text-xs text-zinc-400 font-medium">
            {formatDate(review.date)}
          </p>
        </div>
      </article>
    </Link>
  );
}
