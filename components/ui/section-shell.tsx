import type { ReactNode } from "react";

interface SectionShellProps {
    eyebrow?: string;
    title: string;
    description?: string;
    children: ReactNode;
    align?: "left" | "center";
    action?: ReactNode;
}

export function SectionShell({
    eyebrow,
    title,
    description,
    children,
    align = "left",
    action,
}: SectionShellProps) {
    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "flex flex-wrap items-end justify-between gap-6"}>
                <div className="max-w-2xl">
                    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                    <h2 className="mt-3 text-4xl font-semibold text-emerald-950 sm:text-5xl">{title}</h2>
                    {description ? <p className="mt-4 text-base leading-8 text-slate-600">{description}</p> : null}
                </div>
                {action}
            </div>
            <div className="mt-10">{children}</div>
        </section>
    );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
    return (
        <header className="relative overflow-hidden border-b border-clinic-border">
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 end-0 h-80 w-80 rounded-full bg-honey-100/50 blur-3xl" />
            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
                <p className="eyebrow">{eyebrow}</p>
                <h1 className="mt-4 max-w-3xl text-5xl font-semibold text-emerald-950 sm:text-6xl">{title}</h1>
                {description ? <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{description}</p> : null}
            </div>
        </header>
    );
}

export function CardSkeletons({ count }: { count: number }) {
    return (
        <div className={`grid gap-6 sm:grid-cols-2 ${count === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-3xl bg-slate-100" />
            ))}
        </div>
    );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-clinic-border bg-card/60 px-6 py-14 text-center">
            <p className="font-display text-2xl font-semibold text-emerald-950">{title}</p>
            {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">{description}</p> : null}
        </div>
    );
}
