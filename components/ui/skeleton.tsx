import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/** Wraps skeleton content so screen readers hear one "loading" message instead of empty boxes. */
export function LoadingRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div role="status" aria-live="polite" aria-busy="true" className={className}>
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}

export function CardSkeleton({ variant }: { variant: "product" | "treatment" }) {
    return (
        <div className="surface-card overflow-hidden">
            <Skeleton className={`w-full rounded-none ${variant === "product" ? "aspect-[16/9] sm:aspect-square" : "aspect-[16/10]"}`} />
            <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex items-center justify-between pt-3">
                    <Skeleton className="h-6 w-14" />
                    <Skeleton className="h-9 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function ListRowSkeleton() {
    return (
        <div className="surface-card flex items-center justify-between gap-4 p-5">
            <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-56 max-w-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="overflow-hidden rounded-xl border border-clinic-border">
            <div className="flex gap-6 bg-slate-100 px-4 py-3.5">
                {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-3 flex-1 bg-slate-300/60" />)}
            </div>
            {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex items-center gap-6 border-t border-slate-200 px-4 py-4">
                    {Array.from({ length: columns }, (_, column) => <Skeleton key={column} className={`h-3.5 flex-1 ${column === 0 ? "max-w-40" : ""}`} />)}
                </div>
            ))}
        </div>
    );
}

export function PageTitleSkeleton() {
    return (
        <div className="space-y-3 border-b border-slate-200 pb-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-56" />
        </div>
    );
}

export function BookingSkeleton() {
    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-10">
                {[4, 8, 10].map((count, step) => (
                    <div key={step} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className={`grid gap-2 ${step === 0 ? "sm:grid-cols-2" : step === 1 ? "grid-cols-4 sm:grid-cols-8" : "grid-cols-3 sm:grid-cols-5"}`}>
                            {Array.from({ length: count }, (_, index) => <Skeleton key={index} className={step === 0 ? "h-20 rounded-2xl" : "h-12 rounded-xl"} />)}
                        </div>
                    </div>
                ))}
            </div>
            <div className="surface-card h-fit space-y-4 p-6">
                <Skeleton className="h-7 w-44" />
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex justify-between"><Skeleton className="h-3.5 w-16" /><Skeleton className="h-3.5 w-24" /></div>
                ))}
                <Skeleton className="h-12 w-full rounded-full" />
            </div>
        </div>
    );
}

export function DashboardFrameSkeleton({ label }: { label: string }) {
    return (
        <LoadingRegion label={label} className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:py-8 lg:px-8">
            <div className="surface-card hidden h-fit w-64 shrink-0 space-y-2 p-3 lg:block">
                <Skeleton className="mx-3 mb-3 mt-2 h-3 w-24" />
                {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-10 rounded-xl" />)}
            </div>
            <div className="surface-card min-w-0 flex-1 space-y-6 p-5 sm:p-7">
                <PageTitleSkeleton />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
                </div>
                <TableSkeleton rows={4} columns={4} />
            </div>
        </LoadingRegion>
    );
}
