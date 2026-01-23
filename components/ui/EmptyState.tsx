import { cn } from "@/lib/cn";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="rounded-full bg-[#f3f4f6] p-4 mb-4">
        <Icon className="h-8 w-8 text-[#6b7280]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1a1a2e] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6b7280] max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
