import type { ReactNode } from "react";

interface SectionShellProps {
    eyebrow?: string;
    title: string;
    description?: string;
    children: ReactNode;
    align?: "left" | "center";
}

export function SectionShell({
    eyebrow,
    title,
    description,
    children,
    align = "left",
}: SectionShellProps) {
    return (
        <section className="mx-auto w-full max-w-7xl border-t border-clinic-border px-4 py-12 sm:px-6 lg:px-8">
            <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
                {eyebrow ? (
                    <p className="mb-2 text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">{title}</h2>
                {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p> : null}
            </div>
            <div className="mt-7">{children}</div>
        </section>
    );
}
