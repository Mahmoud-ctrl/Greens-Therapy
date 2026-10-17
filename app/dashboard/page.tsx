"use client";

import Link from "next/link";

import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { LoadingRegion, PageTitleSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DashboardHomePage() {
    const { appointments, productOrders, products, treatments, isLoaded } = useClinicData();
    const { locale } = useLocale();
    const isArabic = locale === "ar";
    const upcomingAppointments = appointments
        .filter((appointment) => appointment.status !== "Cancelled")
        .sort((first, second) => `${first.date}T${first.startTime}`.localeCompare(`${second.date}T${second.startTime}`))
        .slice(0, 4);
    const metrics = [
        { label: isArabic ? "قيد الانتظار" : "Pending appointments", value: appointments.filter((item) => item.status === "Pending").length, tone: "bg-honey-50 border-honey-100" },
        { label: isArabic ? "مؤكدة" : "Confirmed appointments", value: appointments.filter((item) => item.status === "Confirmed").length, tone: "bg-emerald-50 border-emerald-200" },
        { label: isArabic ? "طلبات جديدة" : "New product orders", value: productOrders.filter((order) => order.status === "New").length, tone: "bg-[#f6efdf] border-clinic-border" },
        { label: isArabic ? "منتجات وعلاجات" : "Catalog items", value: products.length + treatments.length, tone: "bg-slate-100 border-slate-200" },
    ];

    if (!isLoaded) {
        return (
            <LoadingRegion label={isArabic ? "جارٍ تحميل لوحة التحكم..." : "Loading dashboard..."} className="space-y-6">
                <PageTitleSkeleton />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
                <div className="space-y-3 pt-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3"><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-3.5 w-32" /></div>)}</div>
            </LoadingRegion>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">{isArabic ? "نظرة عامة" : "Overview"}</div>
                    <h1 className="mt-2 text-2xl font-bold text-emerald-950">{isArabic ? "لوحة العيادة" : "Clinic dashboard"}</h1>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className={`rounded-2xl border p-5 ${metric.tone}`}>
                        <div className="text-sm text-slate-600">{metric.label}</div>
                        <div className="mt-2 font-display text-4xl font-semibold text-emerald-950">{metric.value}</div>
                    </div>
                ))}
            </div>

            <section className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-emerald-950">{isArabic ? "المواعيد" : "Appointments"}</h2><Link href="/dashboard/appointments" className="text-sm font-semibold text-emerald-800">{isArabic ? "عرض الكل" : "View all"}</Link></div>
                {upcomingAppointments.length ? <div className="mt-3 divide-y divide-slate-200">{upcomingAppointments.map((appointment) => <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><div className="font-semibold text-slate-900">{appointment.patientName}</div><div className="text-sm text-slate-500">{appointment.treatmentName}</div></div><div className="text-sm text-slate-600">{appointment.date} · {appointment.startTime}–{appointment.endTime}</div></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">{isArabic ? "لا توجد مواعيد مسجلة." : "No appointments recorded."}</p>}
            </section>

            <section className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-emerald-950">{isArabic ? "طلبات المنتجات" : "Product orders"}</h2><Link href="/dashboard/orders" className="text-sm font-semibold text-emerald-800">{isArabic ? "عرض الكل" : "View all"}</Link></div>
                {productOrders.length ? <div className="mt-3 divide-y divide-slate-200">{productOrders.slice(0, 4).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><div className="font-semibold text-slate-900">{order.customerName}</div><div className="text-sm text-slate-500">{order.items.reduce((count, item) => count + item.quantity, 0)} {isArabic ? "قطعة" : "items"} · {isArabic ? "الدفع عند الاستلام" : "Cash on delivery"}</div></div><div className="font-semibold text-emerald-950">${order.total.toFixed(2)}</div></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">{isArabic ? "لا توجد طلبات مسجلة." : "No product orders recorded."}</p>}
            </section>
        </div>
    );
}
