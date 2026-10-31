import * as React from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  /** Hide this column on mobile (< sm breakpoint) */
  hideOnMobile?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
  className?: string;
  /** When true, alternating rows get a light sage tint (#E4EEE4/30) */
  zebra?: boolean;
  /**
   * When true the table collapses to a stacked card list on mobile (<sm).
   * Each card shows all columns vertically as label-value pairs.
   */
  mobileCards?: boolean;
}

/**
 * DataTable Component
 * Telemetry-styled data table with sortable headers, server-side pagination,
 * light sage column headers, loading skeleton, empty states, zebra rows,
 * and optional mobile card view (Step 10 responsive pass).
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  loading = false,
  emptyTitle = "No Telemetry Records",
  emptyDescription = "There are no records matching your query criteria.",
  sortColumn = null,
  sortDirection = null,
  onSort,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  className,
  zebra = false,
  mobileCards = false,
}: DataTableProps<T>) {
  const handleHeaderClick = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    let nextDirection: SortDirection = "asc";
    if (sortColumn === column.key) {
      if (sortDirection === "asc") nextDirection = "desc";
      else if (sortDirection === "desc") nextDirection = null;
      else nextDirection = "asc";
    }

    onSort(column.key, nextDirection);
  };

  const getRowKey = (row: T, index: number): string => {
    if (typeof keyField === "function") return keyField(row);
    if (row && row[keyField] !== undefined) return String(row[keyField]);
    return String(index);
  };

  const totalPages =
    pagination ? Math.ceil(pagination.total / pagination.pageSize) || 1 : 1;
  const currentPage = pagination?.page || 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getCellValue = (col: TableColumn<T>, row: T, index: number) => {
    if (col.render) return col.render(row, index);
    if (row[col.key] !== undefined) return String(row[col.key]);
    return "—";
  };

  return (
    <div
      className={cn(
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden flex flex-col shadow-none",
        className
      )}
    >
      {/* ── Mobile card view ─────────────────────────────────────────── */}
      {mobileCards && (
        <div className="sm:hidden">
          {loading ? (
            <TableSkeleton rows={pagination?.pageSize || 5} cols={2} />
          ) : data.length === 0 ? (
            <div className="p-8">
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            <div className="divide-y divide-[#B9CBB9]/60">
              {data.map((row, index) => (
                <div
                  key={getRowKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "p-4 space-y-2",
                    onRowClick && "cursor-pointer active:bg-[#E4EEE4]/60"
                  )}
                >
                  {columns
                    .filter((c) => !c.hideOnMobile)
                    .map((col) => (
                      <div
                        key={col.key}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono shrink-0 pt-0.5">
                          {col.header}
                        </span>
                        <span className="text-xs text-[#2B302B] font-medium text-right">
                          {getCellValue(col, row, index)}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Desktop/tablet table ──────────────────────────────────────── */}
      <div className={cn("overflow-x-auto w-full", mobileCards && "hidden sm:block")}>
        <table className="w-full text-left border-collapse">
          {/* Table Header: Light Sage #D3E3D3 */}
          <thead>
            <tr className="bg-[#D3E3D3] border-b-[1.5px] border-[#B9CBB9]">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => handleHeaderClick(col)}
                    className={cn(
                      "px-3.5 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono select-none",
                      alignClass,
                      col.sortable &&
                        "cursor-pointer hover:bg-[#c4d7c4] transition-colors",
                      col.className
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#8A968A] shrink-0">
                          {isSorted && sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-[#2B302B]" />
                          ) : isSorted && sortDirection === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-[#2B302B]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#B9CBB9]/60">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <TableSkeleton
                    rows={pagination?.pageSize || 5}
                    cols={columns.length}
                  />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = getRowKey(row, index);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors hover:bg-[#E4EEE4]/50",
                      zebra && index % 2 === 1
                        ? "bg-[#E4EEE4]/30"
                        : "bg-white",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-3.5 py-3 text-xs text-[#2B302B] tabular-nums font-medium",
                            alignClass,
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row, index)
                            : row[col.key] !== undefined
                            ? String(row[col.key])
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="bg-[#E4EEE4]/40 border-t border-[#B9CBB9] px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Record range */}
          <div className="text-[#8A968A] text-[11px] font-mono">
            Showing{" "}
            <span className="font-semibold text-[#2B302B] font-mono">
              {pagination.total === 0
                ? 0
                : (currentPage - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[#2B302B] font-mono">
              {Math.min(currentPage * pagination.pageSize, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#2B302B] font-mono">
              {pagination.total}
            </span>{" "}
            records
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1 select-none">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-7 px-2 border border-[#B9CBB9] rounded-[2px] bg-white text-[#2B302B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#D3E3D3]/60 transition-colors flex items-center justify-center text-xs focus-visible:outline-[#F57B4A] focus-visible:outline-2"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-xs text-[#8A968A] font-mono"
                  >
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    "h-7 min-w-[28px] px-2 text-xs font-mono font-semibold rounded-[2px] border transition-colors focus-visible:outline-[#F57B4A] focus-visible:outline-2",
                    isActive
                      ? "bg-[#2B302B] text-white border-[#2B302B]"
                      : "bg-white text-[#2B302B] border-[#B9CBB9] hover:bg-[#D3E3D3]/60"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-7 px-2 border border-[#B9CBB9] rounded-[2px] bg-white text-[#2B302B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#D3E3D3]/60 transition-colors flex items-center justify-center text-xs focus-visible:outline-[#F57B4A] focus-visible:outline-2"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
