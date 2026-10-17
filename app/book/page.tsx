"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { BookingFlow } from "@/components/booking/booking-flow";
import { useLocale } from "@/components/providers/locale-provider";

export default function BookPage() {
    const { locale } = useLocale();
    const { user, isLoaded } = useAuth();
    const router = useRouter();
    const staffUser = user?.role === "admin" || user?.role === "receptionist";

    useEffect(() => {
        if (isLoaded && staffUser) router.replace("/dashboard/appointments");
    }, [isLoaded, router, staffUser]);

    if (!isLoaded || staffUser) {
        return <div className="mx-auto flex min-h-[45vh] max-w-7xl items-center justify-center px-4 text-slate-500">{locale === "ar" ? "جارٍ فتح قائمة المواعيد..." : "Opening appointments..."}</div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {locale === "ar" ? "حجز موعد" : "Appointment booking"}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-emerald-950 sm:text-4xl">
                    {locale === "ar" ? "احجز جلسة مناسبة لك" : "Book a session that fits your routine"}
                </h1>
            </div>
            <BookingFlow />
        </div>
    );
}
