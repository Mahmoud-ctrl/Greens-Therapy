import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { ItemVisual } from "@/components/ui/item-visual";
import { formatCurrency, formatDuration } from "@/lib/i18n";
import type { Locale, Treatment } from "@/types/clinic";

export function TreatmentCard({ treatment, locale, showBooking }: { treatment: Treatment; locale: Locale; showBooking: boolean }) {
    const isArabic = locale === "ar";
    const name = isArabic ? treatment.arName : treatment.enName;
    const Arrow = isArabic ? ArrowLeft : ArrowRight;

    return (
        <article className="surface-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
            <ItemVisual image={treatment.image} alt={name} category={treatment.category} className="aspect-[16/10] w-full" />
            <div className="flex flex-1 flex-col p-6">
                {treatment.category ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-honey-700">{treatment.category}</p> : null}
                <h3 className="mt-2 text-2xl font-semibold text-emerald-950">{name}</h3>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-slate-600">
                    {isArabic ? treatment.arDescription : treatment.enDescription}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-clinic-border pt-4">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-lg font-semibold text-emerald-900">{formatCurrency(treatment.price, locale)}</span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                            <Clock size={15} aria-hidden="true" />
                            {formatDuration(treatment.duration, locale)}
                        </span>
                    </div>
                    {showBooking ? (
                        <Link href="/book" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition group-hover:gap-2.5">
                            {isArabic ? "احجز" : "Book"}
                            <Arrow size={16} aria-hidden="true" />
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
