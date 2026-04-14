export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-60 shimmer rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
      </div>
    </div>
  );
}
