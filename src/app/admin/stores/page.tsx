import { StoresView } from "@/components/StoresView";

export default async function AdminStoresPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stores</h1>
      <StoresView />
    </div>
  );
}
