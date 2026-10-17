"use client";

import { useState } from "react";

import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";

function toDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekMonday(date: Date) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const daysSinceMonday = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - daysSinceMonday);
    return monday;
}

export default function DashboardSchedulePage() {
    const { appointments } = useClinicData();
    const { locale } = useLocale();
    const isArabic = locale === "ar";
    const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
    });
    const weekLabel = new Intl.DateTimeFormat(isArabic ? "ar" : "en", { month: "long", year: "numeric" }).format(weekStart);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clinic-border pb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{isArabic ? "العيادة" : "Clinic"}</p>
                    <h1 className="mt-1 text-2xl font-bold text-emerald-950">{isArabic ? "جدول المواعيد" : "Appointment schedule"}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setWeekStart((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7, 12))} className="rounded-lg border border-clinic-border bg-white px-3 py-2 text-sm font-semibold text-emerald-900" aria-label={isArabic ? "الأسبوع السابق" : "Previous week"}>‹</button>
                    <span className="min-w-36 text-center text-sm font-semibold text-slate-700">{weekLabel}</span>
                    <button type="button" onClick={() => setWeekStart((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7, 12))} className="rounded-lg border border-clinic-border bg-white px-3 py-2 text-sm font-semibold text-emerald-900" aria-label={isArabic ? "الأسبوع التالي" : "Next week"}>›</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="grid min-w-[840px] grid-cols-7 divide-x divide-clinic-border border-y border-clinic-border">
                    {days.map((day, index) => {
                        const key = toDateKey(day);
                        const dayAppointments = appointments
                            .filter((appointment) => appointment.date === key && appointment.status !== "Cancelled")
                            .sort((first, second) => first.startTime.localeCompare(second.startTime));
                        const dayLabel = new Intl.DateTimeFormat(isArabic ? "ar" : "en", { weekday: "short" }).format(day);
                        const dateLabel = new Intl.DateTimeFormat(isArabic ? "ar" : "en", { day: "numeric", month: "short" }).format(day);

                        return (
                            <section key={key} className="min-h-72 px-2 py-3 sm:px-3">
                                <div className="border-b border-clinic-border pb-3 text-center">
                                    <h2 className="text-xs font-semibold text-slate-600">{dayLabel}</h2>
                                    <p className={`mt-1 text-sm font-bold ${index === 0 && key === toDateKey(getWeekMonday(new Date())) ? "text-emerald-700" : "text-emerald-950"}`}>{dateLabel}</p>
                                </div>
                                {dayAppointments.length === 0 ? <p className="py-5 text-center text-xs text-slate-400">{isArabic ? "لا توجد مواعيد" : "No appointments"}</p> : <div className="divide-y divide-clinic-border">{dayAppointments.map((appointment) => <article key={appointment.id} className="py-3"><p className="text-xs font-bold text-emerald-800">{appointment.startTime}–{appointment.endTime}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-900">{appointment.patientName}</p><p className="mt-1 text-xs leading-4 text-slate-600">{appointment.treatmentName}</p><span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${appointment.status === "Confirmed" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{isArabic ? appointment.status === "Confirmed" ? "مؤكد" : "قيد الانتظار" : appointment.status}</span></article>)}</div>}
                            </section>
                        );
                    })}
                </div>
            </div>
            <p className="text-xs text-slate-500">{isArabic ? "يعرض الجدول المواعيد المحجوزة فقط." : "Only booked appointments are shown."}</p>
        </div>
    );
}