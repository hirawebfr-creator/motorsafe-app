import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#1a1a2e] text-white hover:bg-[#2d2d44] shadow-sm",
        primary: "bg-[#1a1a2e] text-white hover:bg-[#2d2d44] shadow-sm",
        secondary: "bg-white text-[#1a1a2e] border border-[#e5e5e5] hover:bg-[#f8f9fa] hover:border-[#d0d0d0]",
        ghost: "text-[#1a1a2e] hover:bg-[#f0f0f0]",
        destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        danger: "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        success: "bg-[#16a34a] text-white hover:bg-[#15803d]",
        outline: "border border-[#e5e5e5] bg-white hover:bg-[#f8f9fa] hover:border-[#d0d0d0]",
        link: "text-[#2563eb] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
