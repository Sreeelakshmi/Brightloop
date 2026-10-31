import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui-shared";

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      <ChartSkeleton height="h-[248px]" />
      <ChartSkeleton height="h-[248px]" />
      <ChartSkeleton height="h-[248px]" />
    </div>
  );
}

export function OverdueSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-36 bg-[#D3E3D3] rounded-[2px] animate-pulse" />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}

