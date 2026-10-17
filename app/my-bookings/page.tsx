"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CalendarHeart, CheckCircle2, Clock, MessageCircle } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/ui/section-shell";
import { ListRowSkeleton, LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import type { ClinicAppointment } from "@/types/clinic";

const statusStyles: Record<ClinicAppointment["status"], string> = {
    Pending: "bg-honey-50 text-honey-700",
    Confirmed: "bg-emerald-50 text-emerald-800",
    Completed: "bg-slate-100 text-slate-600",
    Cancelled: "bg-red-50 text-red-700",
};

const statusLabels: Record<ClinicAppointment["status"], { ar: string; en: string }> = {
    Pending: { ar: "بانتظار الموافقة", en: "Awaiting approval" },
    Confirmed: { ar: "مؤكد", en: "Confirmed" },
    Completed: { ar: "مكتمل", en: "Completed" },
    Cancelled: { ar: "ملغى", en: "Cancelled" },
};

export default function MyBookingsPage() {
    const router = useRouter();
    const { locale } = useLocale();
    const { user, isLoaded: authLoaded } = useAuth();
    const { appointments, treatments, isLoaded } = useClinicData();
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingWhatsAppUrl, setBookingWhatsAppUrl] = useState("");
    const isArabic = locale === "ar";
    const isStaff = user?.role === "admin" || user?.role === "receptionist";

    useEffect(() => {
        if (authLoaded && isStaff) router.replace("/dashboard");
    }, [authLoaded, isStaff, router]);

    // Booking hands off a one-shot "saved" notice and the WhatsApp link through sessionStorage.
    useEffect(() => {
        if (window.sessionStorage.getItem("greens-healing-booking-confirmed") === "1") {
            window.sessionStorage.removeItem("greens-healing-booking-confirmed");
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Consume one-shot navigation state after hydration.
            setBookingConfirmed(true);
        }
        const whatsappUrl = window.sessionStorage.getItem("greens-healing-booking-whatsapp-url");
        if (whatsappUrl) {
            window.sessionStorage.removeItem("greens-healing-booking-whatsapp-url");
            setBookingWhatsAppUrl(whatsappUrl);
        }
    }, []);

    if (!authLoaded || isStaff) {
        return (
            <LoadingRegion label={isArabic ? "جارٍ التحميل..." : "Loading..."}>
                <div className="border-b border-clinic-border"><div className="mx-auto max-w-7xl space-y-4 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"><Skeleton className="h-3 w-24" /><Skeleton className="h-12 w-72 max-w-full" /></div></div>
                <div className="mx-auto max-w-4xl space-y-3 px-4 py-12 sm:px-6 lg:px-8">{Array.from({ length: 3 }, (_, index) => <ListRowSkeleton key={index} />)}</div>
            </LoadingRegion>
        );
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const byTime = (first: ClinicAppointment, second: ClinicAppointment) => `${first.date}T${first.startTime}`.localeCompare(`${second.date}T${second.startTime}`);
    const upcoming = appointments
        .filter((appointment) => appointment.date >= today && appointment.status !== "Cancelled" && appointment.status !== "Completed")
        .sort(byTime);
    const past = appointments.filter((appointment) => !upcoming.includes(appointment)).sort(byTime).reverse();

    return (
        <div>
            <PageHeader
                eyebrow={isArabic ? "حسابي" : "My account"}
                title={user ? (isArabic ? `أهلاً، ${user.name}` : `Hello, ${user.name}`) : (isArabic ? "حجوزاتي" : "My bookings")}
                description={isArabic ? "تابع مواعيدك وحالة كل حجز." : "Keep track of your appointments and their status."}
            />

            <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
                {bookingConfirmed ? (
                    <div role="status" className="surface-card flex flex-col gap-4 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
                            <div>
                                <p className="font-semibold text-emerald-950">{isArabic ? "تم حفظ طلب الموعد" : "Your appointment request is saved"}</p>
                                <p className="mt-1 text-sm text-emerald-900/80">{isArabic ? "أرسله عبر واتساب إلى العيادة للموافقة عليه." : "Send it to the clinic on WhatsApp so they can approve it."}</p>
                            </div>
                        </div>
                        {bookingWhatsAppUrl ? (
                            <a href={bookingWhatsAppUrl} target="_blank" rel="noreferrer" className="btn-primary shrink-0">
                                <MessageCircle size={18} aria-hidden="true" />
                                {isArabic ? "فتح واتساب" : "Open WhatsApp"}
                            </a>
                        ) : null}
                    </div>
                ) : null}

                {!user ? (
                    <div className="surface-card mx-auto max-w-lg p-8 text-center sm:p-10">
                        <h2 className="text-3xl font-semibold text-emerald-950">{isArabic ? "سجّل الدخول لعرض حجوزاتك" : "Sign in to see your bookings"}</h2>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link href="/login" className="btn-primary">{isArabic ? "تسجيل الدخول" : "Sign in"}</Link>
                            <Link href="/register" className="btn-secondary">{isArabic ? "إنشاء حساب" : "Create account"}</Link>
                        </div>
                    </div>
                ) : !isLoaded ? (
                    <LoadingRegion label={isArabic ? "جارٍ تحميل حجوزاتك..." : "Loading your bookings..."} className="space-y-6">
                        <div className="flex items-end justify-between gap-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-10 w-44 rounded-full" /></div>
                        <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <ListRowSkeleton key={index} />)}</div>
                    </LoadingRegion>
                ) : (
                    <>
                        <section>
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <h2 className="text-3xl font-semibold text-emerald-950">{isArabic ? "المواعيد القادمة" : "Upcoming appointments"}</h2>
                                <Link href="/book" className="btn-primary py-2.5">{isArabic ? "احجز موعداً جديداً" : "Book another session"}</Link>
                            </div>
                            {upcoming.length === 0 ? (
                                <div className="mt-6 rounded-3xl border border-dashed border-clinic-border bg-card/60 px-6 py-12 text-center">
                                    <CalendarHeart className="mx-auto text-honey-700" size={28} strokeWidth={1.5} aria-hidden="true" />
                                    <p className="mt-3 text-slate-600">{isArabic ? "لا توجد مواعيد قادمة." : "You have no upcoming appointments."}</p>
                                </div>
                            ) : (
                                <ul className="mt-6 space-y-3">
                                    {upcoming.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} treatments={treatments} isArabic={isArabic} />)}
                                </ul>
                            )}
                        </section>

                        {past.length > 0 ? (
                            <section>
                                <h2 className="text-2xl font-semibold text-emerald-950">{isArabic ? "المواعيد السابقة" : "Past appointments"}</h2>
                                <ul className="mt-5 space-y-3 opacity-80">
                                    {past.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} treatments={treatments} isArabic={isArabic} />)}
                                </ul>
                            </section>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

function AppointmentRow({ appointment, treatments, isArabic }: { appointment: ClinicAppointment; treatments: Array<{ id: string; arName: string }>; isArabic: boolean }) {
    const treatmentName = isArabic
        ? treatments.find((treatment) => treatment.id === appointment.treatmentId)?.arName ?? appointment.treatmentName
        : appointment.treatmentName;
    const dateLabel = new Intl.DateTimeFormat(isArabic ? "ar" : "en", { weekday: "long", day: "numeric", month: "long" })
        .format(new Date(`${appointment.date}T12:00:00`));

    return (
        <li className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
                <p className="text-lg font-semibold text-emerald-950">{treatmentName}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{dateLabel}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" /><span dir="ltr">{appointment.startTime}–{appointment.endTime}</span></span>
                </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}>
                {isArabic ? statusLabels[appointment.status].ar : statusLabels[appointment.status].en}
            </span>
        </li>
    );
}
