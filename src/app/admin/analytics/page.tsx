import { AnalyticsView } from "@/components/AnalyticsView";

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <AnalyticsView />
    </div>
  );
}
