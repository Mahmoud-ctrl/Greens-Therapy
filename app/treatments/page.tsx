"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { TreatmentCard } from "@/components/catalog/treatment-card";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CardSkeletons, EmptyState, PageHeader } from "@/components/ui/section-shell";

export default function TreatmentsPage() {
    const { locale } = useLocale();
    const { user } = useAuth();
    const { treatments, isLoaded } = useClinicData();
    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const isArabic = locale === "ar";
    const activeTreatments = treatments.filter((treatment) => treatment.active !== false);

    return (
        <div>
            <PageHeader
                eyebrow={isArabic ? "العلاجات" : "Treatments"}
                title={isArabic ? "علاجات طبيعية تقليدية" : "Traditional natural therapies"}
                description={isArabic
                    ? "جلسات حجامة وتدليك وإبر جافة وشفاء شامل، يقدمها معالج معتمد في أجواء هادئة."
                    : "Cupping, massage, dry needling and holistic sessions, delivered by a certified healer in a calm setting."}
            />
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {!isLoaded ? <CardSkeletons count={3} variant="treatment" label={isArabic ? "جارٍ تحميل العلاجات..." : "Loading treatments..."} /> : activeTreatments.length === 0 ? (
                    <EmptyState title={isArabic ? "العلاجات قادمة قريباً" : "Treatments coming soon"} description={isArabic ? "تواصل معنا عبر واتساب لمعرفة المزيد." : "Reach out on WhatsApp to learn more."} />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeTreatments.map((treatment) => (
                            <TreatmentCard key={treatment.id} treatment={treatment} locale={locale} showBooking={!isStaff} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
