import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--blue)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] shadow-sm",
        orange: "bg-[var(--orange)] text-white hover:bg-[var(--orange-dark)] shadow-sm",
        ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--bg)]",
        outline: "border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--bg)]",
        secondary: "bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--border-soft)] border border-[var(--border)]",
        danger: "bg-[var(--danger)] text-white hover:bg-red-700",
        navy: "bg-[var(--navy)] text-white hover:bg-[var(--navy-2)]",
        success: "bg-[var(--success)] text-white hover:bg-green-700",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        xl: "h-14 px-8 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
