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
  rating: number;
  date: string;
  imageUrl: string;
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "bg-emerald-500";
  if (rating >= 4.0) return "bg-blue-500";
  if (rating >= 3.5) return "bg-amber-500";
  return "bg-red-500";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
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
          />
          {/* Rating badge */}
          <div
            className={`absolute top-3 right-3 ${getRatingColor(review.rating)} text-white text-sm font-black px-2.5 py-1 rounded-sm`}
          >
            {review.rating.toFixed(1)}
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
