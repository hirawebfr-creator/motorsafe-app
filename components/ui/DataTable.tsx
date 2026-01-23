"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";

// Types
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
  stickyHeader?: boolean;
}

function DataTableComponent<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucune donnée",
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ChevronsUpDown className="h-4 w-4 text-[#9ca3af]" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 text-[#1a1a2e]" />
      : <ChevronDown className="h-4 w-4 text-[#1a1a2e]" />;
  };

  return (
    <div className={cn("w-full overflow-auto rounded-lg border border-[#e5e5e5]", className)}>
      <table className="w-full border-collapse">
        <thead className={cn(
          "bg-[#f9fafb]",
          stickyHeader && "sticky top-0 z-10"
        )}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider border-b border-[#e5e5e5]",
                  col.sortable && "cursor-pointer hover:bg-[#f3f4f6] select-none",
                  col.width
                )}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#e5e5e5]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-[#6b7280]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Chargement...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#6b7280]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[#f9fafb]"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-[#1a1a2e]">
                    {col.render 
                      ? col.render(item, rowIndex) 
                      : (item[col.key] as React.ReactNode) ?? "-"
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Memoized version for performance - new API with columns/data
const DataTableNew = memo(DataTableComponent) as typeof DataTableComponent;

// Legacy wrapper components for backwards compatibility - used in existing code
interface LegacyDataTableProps {
  stickyHeader?: boolean;
  variant?: "card" | "plain";
  className?: string;
  children: React.ReactNode;
}

function DataTable({
  stickyHeader: _stickyHeader = false,
  variant = "card",
  className = "",
  children,
}: LegacyDataTableProps) {
  // stickyHeader is handled by DataTableHead, kept for API compatibility
  void _stickyHeader;
  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-lg border border-[#e5e5e5] bg-white shadow-sm overflow-hidden"
          : "",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">{children}</table>
      </div>
    </div>
  );
}

function DataTableHead({
  sticky = false,
  children,
}: {
  sticky?: boolean;
  children: React.ReactNode;
}) {
  return (
    <thead
      className={cn(
        "text-left bg-[#f9fafb]",
        sticky ? "sticky top-0 z-10 border-b border-[#e5e5e5] bg-[#f9fafb]/95 backdrop-blur" : ""
      )}
    >
      {children}
    </thead>
  );
}

export { DataTable, DataTableNew, DataTableHead };
