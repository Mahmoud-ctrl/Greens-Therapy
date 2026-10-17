"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { BookingFlow } from "@/components/booking/booking-flow";
import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/ui/section-shell";

export default function BookPage() {
    const { locale } = useLocale();
    const { user, isLoaded } = useAuth();
    const router = useRouter();
    const staffUser = user?.role === "admin" || user?.role === "receptionist";
    const isArabic = locale === "ar";

    useEffect(() => {
        if (isLoaded && staffUser) router.replace("/dashboard/appointments");
    }, [isLoaded, router, staffUser]);

    if (!isLoaded || staffUser) {
        return <div className="mx-auto flex min-h-[45vh] max-w-7xl items-center justify-center px-4 text-slate-500">{isArabic ? "جارٍ التحميل..." : "Loading..."}</div>;
    }

    return (
        <div>
            <PageHeader
                eyebrow={isArabic ? "حجز موعد" : "Book a session"}
                title={isArabic ? "احجز جلسة تناسب وقتك" : "Book a session that fits your day"}
                description={isArabic ? "اختر العلاج واليوم والوقت، وسنؤكد موعدك عبر واتساب." : "Choose your treatment, day and time, and we'll confirm on WhatsApp."}
            />
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {user ? <BookingFlow /> : (
                    <div className="surface-card mx-auto max-w-lg p-8 text-center sm:p-10">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-honey-50 text-honey-700">
                            <CalendarHeart size={26} strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <h2 className="mt-5 text-3xl font-semibold text-emerald-950">{isArabic ? "سجّل الدخول للحجز" : "Sign in to book"}</h2>
                        <p className="mt-2 text-slate-600">
                            {isArabic ? "نحتاج حساباً لنحفظ موعدك ونتواصل معك. يستغرق إنشاؤه أقل من دقيقة." : "We need an account to save your appointment and reach you. It takes under a minute."}
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link href="/register" className="btn-primary">{isArabic ? "إنشاء حساب" : "Create account"}</Link>
                            <Link href="/login" className="btn-secondary">{isArabic ? "تسجيل الدخول" : "Sign in"}</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
