"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { SectionShell } from "@/components/ui/section-shell";

export default function TreatmentsPage() {
    const { locale } = useLocale();
    const { user } = useAuth();
    const { treatments } = useClinicData();
    const isStaff = user?.role === "admin" || user?.role === "receptionist";

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionShell
                eyebrow={locale === "ar" ? "العلاجات" : "Treatments"}
                title={locale === "ar" ? "العلاجات الطبيعية" : "Natural treatments"}
                description={
                    locale === "ar"
                        ? "العلاجات التي أضافتها العيادة إلى القائمة."
                        : "Treatments added by the clinic."
                }
            >
                {treatments.length === 0 ? <p className="border-t border-slate-200 py-8 text-sm text-slate-500">{locale === "ar" ? "لا توجد علاجات متاحة حالياً." : "No treatments are currently available."}</p> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {treatments.map((treatment) => (
                        <div key={treatment.id} className="rounded-xl border border-clinic-border bg-white p-5">
                            {treatment.image ? <img src={treatment.image} alt={locale === "ar" ? treatment.arName : treatment.enName} className="mb-4 h-40 w-full rounded-lg object-cover" /> : null}
                            <div className="mb-4 flex items-center justify-between">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {treatment.category}
                                </span>
                                <span className="text-lg font-bold text-emerald-950">${treatment.price}</span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900">
                                {locale === "ar" ? treatment.arName : treatment.enName}
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                                {locale === "ar" ? treatment.arDescription : treatment.enDescription}
                            </p>

                            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                                <span>{locale === "ar" ? `${treatment.duration} دقيقة` : `${treatment.duration} min`}</span>
                                {!isStaff ? <Link href="/book" className="font-semibold text-emerald-700">
                                    {locale === "ar" ? "احجز الآن" : "Book now"}
                                </Link> : null}
                            </div>
                        </div>
                    ))}
                </div>}
            </SectionShell>
        </div>
    );
}
