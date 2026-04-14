"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BuyNowButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  return (
    <Button variant="orange" size="xl" className="w-full" onClick={() => router.push(`/checkout/${quoteId}`)}>
      Buy Now
    </Button>
  );
}
