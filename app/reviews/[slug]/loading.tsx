export default function Loading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="w-full h-[50vh] md:h-[60vh] bg-zinc-200 animate-pulse" />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Rating row skeleton */}
        <div className="flex gap-4 mb-8 pb-8 border-b border-zinc-200">
          <div className="w-20 h-16 bg-zinc-200 rounded-sm animate-pulse" />
          <div className="flex flex-col gap-2 justify-center">
            <div className="h-5 w-28 bg-zinc-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Pull quote skeleton */}
        <div className="border-l-4 border-zinc-200 pl-5 mb-8 space-y-2">
          <div className="h-5 bg-zinc-100 rounded animate-pulse" />
          <div className="h-5 w-3/4 bg-zinc-100 rounded animate-pulse" />
        </div>

        {/* Body paragraphs skeleton */}
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-zinc-100 rounded animate-pulse" />
              <div className="h-4 bg-zinc-100 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
