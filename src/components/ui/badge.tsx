import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg)] text-[var(--ink-2)] border border-[var(--border)]",
        blue: "bg-[var(--blue-light)] text-[var(--blue-dark)] border border-[var(--blue)]/20",
        orange: "bg-[var(--orange-light)] text-[var(--orange-dark)] border border-[var(--orange)]/20",
        success: "bg-green-50 text-[var(--success)] border border-green-200",
        warning: "bg-amber-50 text-[var(--warning)] border border-amber-200",
        danger: "bg-red-50 text-[var(--danger)] border border-red-200",
        info: "bg-blue-50 text-[var(--blue-dark)] border border-blue-200",
        navy: "bg-[var(--navy)] text-white",
        gold: "bg-amber-50 text-amber-800 border border-amber-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
