import { Suspense } from "react";
import { SearchResultsPage } from "@/components/SearchResultsPage";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {q ? `Results for "${q}"` : category ? `${category}` : "Search"}
      </h1>
      <Suspense fallback={null}>
        <SearchResultsPage query={q} category={category} />
      </Suspense>
    </div>
  );
}
