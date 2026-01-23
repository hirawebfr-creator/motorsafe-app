import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#1a1a2e] text-white",
        secondary: "bg-[#f3f4f6] text-[#374151]",
        success: "bg-[#dcfce7] text-[#166534]",
        warning: "bg-[#fef3c7] text-[#92400e]",
        danger: "bg-[#fee2e2] text-[#991b1b]",
        info: "bg-[#dbeafe] text-[#1e40af]",
        outline: "border border-[#e5e5e5] text-[#374151] bg-transparent",
        neutral: "bg-[#f3f4f6] text-[#6b7280]",
        accent: "bg-[#ede9fe] text-[#6d28d9]",
        // Status variants pour interventions
        draft: "bg-[#f3f4f6] text-[#6b7280]",
        pending: "bg-[#fef3c7] text-[#92400e]",
        in_progress: "bg-[#dbeafe] text-[#1e40af]",
        completed: "bg-[#dcfce7] text-[#166534]",
        cancelled: "bg-[#fee2e2] text-[#991b1b]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

