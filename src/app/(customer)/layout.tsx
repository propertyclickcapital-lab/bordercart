import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <TopNav />
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
