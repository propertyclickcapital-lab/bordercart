export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 shimmer rounded" />
      <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}</div>
      <div className="h-96 shimmer rounded-lg" />
    </div>
  );
}
