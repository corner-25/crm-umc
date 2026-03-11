"use client";
import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortDir = "asc" | "desc" | null;

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; dir: SortDir };
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({ children, sortKey, currentSort, onSort, className }: SortableTableHeadProps) {
  const isActive = currentSort.key === sortKey;
  const dir = isActive ? currentSort.dir : null;
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {!isActive && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
        {isActive && dir === "asc" && <ArrowUp className="h-3.5 w-3.5 text-foreground" />}
        {isActive && dir === "desc" && <ArrowDown className="h-3.5 w-3.5 text-foreground" />}
      </div>
    </TableHead>
  );
}
