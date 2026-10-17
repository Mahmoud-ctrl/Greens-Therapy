"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Clock, LayoutDashboard, Leaf, Package, Settings, ShoppingBag, Users } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { ClinicAppointment, ProductOrder } from "@/types/clinic";

const dashboardItems = [
    { href: "/dashboard", label: "Overview", arLabel: "نظرة عامة", icon: LayoutDashboard },
    { href: "/dashboard/appointments", label: "Appointments", arLabel: "المواعيد", icon: CalendarCheck },
    { href: "/dashboard/schedule", label: "Schedule", arLabel: "الجدول", icon: Clock },
    { href: "/dashboard/orders", label: "Product orders", arLabel: "طلبات المنتجات", icon: ShoppingBag },
    { href: "/dashboard/patients", label: "Patients", arLabel: "المرضى", icon: Users },
    { href: "/dashboard/treatments", label: "Treatments", arLabel: "العلاجات", icon: Leaf },
    { href: "/dashboard/products", label: "Products", arLabel: "المنتجات", icon: Package },
    { href: "/dashboard/settings", label: "Settings", arLabel: "الإعدادات", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { locale } = useLocale();
    const { isLoaded, appointments, productOrders } = useClinicData();
    const [newBooking, setNewBooking] = useState<ClinicAppointment | null>(null);
    const [newOrder, setNewOrder] = useState<ProductOrder | null>(null);
    const previousIds = useRef<Set<string> | null>(null);
    const previousOrderIds = useRef<Set<string> | null>(null);
    const unreadCount = user?.role === "admin" ? appointments.filter((appointment) => !appointment.isRead).length : 0;
    const unreadOrderCount = user?.role === "admin" ? productOrders.filter((order) => !order.isRead).length : 0;

    useEffect(() => {
        if (!isLoaded) return;

        const currentIds = new Set(appointments.map((appointment) => appointment.id));
        const currentOrderIds = new Set(productOrders.map((order) => order.id));
        if (!previousIds.current || !previousOrderIds.current) {
            previousIds.current = currentIds;
            previousOrderIds.current = currentOrderIds;
            return;
        }

        const arrived = appointments.find((appointment) => !previousIds.current?.has(appointment.id));
        const arrivedOrder = productOrders.find((order) => !previousOrderIds.current?.has(order.id));
        previousIds.current = currentIds;
        previousOrderIds.current = currentOrderIds;

        if (arrived && user?.role === "admin") {
            setNewBooking(arrived);
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(locale === "ar" ? "موعد جديد" : "New appointment", {
                    body: `${arrived.patientName} - ${arrived.treatmentName} (${arrived.startTime})`,
                });
            }
        }
        if (arrivedOrder && user?.role === "admin") {
            setNewOrder(arrivedOrder);
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(locale === "ar" ? "طلب منتجات جديد" : "New product order", {
                    body: `${arrivedOrder.customerName} - $${arrivedOrder.total.toFixed(2)} - ${locale === "ar" ? "الدفع عند الاستلام" : "Cash on delivery"}`,
                });
            }
        }
    }, [appointments, isLoaded, locale, productOrders, user?.role]);

    const visibleItems = dashboardItems.filter((item) => user?.role === "admin" || item.href !== "/dashboard/orders");
    const badgeFor = (href: string) => href === "/dashboard/appointments" ? unreadCount : href === "/dashboard/orders" ? unreadOrderCount : 0;

    return (
        <div className="min-h-[calc(100vh-4.5rem)] bg-background text-foreground">
            <nav aria-label={locale === "ar" ? "أقسام لوحة التحكم" : "Dashboard sections"} className="border-b border-clinic-border bg-card lg:hidden">
                <div className="flex gap-1 overflow-x-auto px-4 py-2">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        const badge = badgeFor(item.href);
                        return (
                            <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ${isActive ? "bg-emerald-700 text-white" : "text-slate-600"}`}>
                                {locale === "ar" ? item.arLabel : item.label}
                                {badge > 0 ? <span className="rounded-full bg-honey-500 px-1.5 text-xs font-bold text-white">{badge}</span> : null}
                            </Link>
                        );
                    })}
                </div>
            </nav>
            <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:py-8 lg:px-8">
                <aside className="surface-card sticky top-24 hidden h-fit w-64 shrink-0 p-3 lg:block">
                    <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-honey-700">{locale === "ar" ? "إدارة العيادة" : "Clinic hub"}</p>
                    <div className="space-y-1">
                        {visibleItems.map((item) => {
                            const isActive = pathname === item.href;
                            const badge = badgeFor(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"}`}
                                >
                                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                                    <span>{locale === "ar" ? item.arLabel : item.label}</span>
                                    {badge > 0 ? <span className="ms-auto rounded-full bg-honey-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span> : null}
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                <main className="surface-card min-w-0 flex-1 p-5 sm:p-7">
                    {newOrder && user?.role === "admin" ? <div role="status" className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div><p className="font-semibold">{locale === "ar" ? "تم استلام طلب منتجات جديد" : "New product order received"}</p><p className="mt-1">{newOrder.customerName} · {newOrder.customerPhone} · ${newOrder.total.toFixed(2)} · {locale === "ar" ? "الدفع عند الاستلام" : "Cash on delivery"}</p></div><div className="flex shrink-0 items-center gap-3"><Link href="/dashboard/orders" onClick={() => setNewOrder(null)} className="font-semibold underline">{locale === "ar" ? "عرض الطلب" : "View order"}</Link><button type="button" aria-label={locale === "ar" ? "إغلاق التنبيه" : "Dismiss notification"} onClick={() => setNewOrder(null)} className="text-lg leading-none">×</button></div></div> : null}
                    {newBooking && user?.role === "admin" ? <div role="status" className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><div><p className="font-semibold">{locale === "ar" ? "تم استلام حجز جديد" : "New appointment received"}</p><p className="mt-1">{newBooking.patientName} · {newBooking.treatmentName} · {newBooking.date} · {newBooking.startTime}–{newBooking.endTime}</p></div><div className="flex shrink-0 items-center gap-3"><Link href="/dashboard/appointments" onClick={() => setNewBooking(null)} className="font-semibold underline">{locale === "ar" ? "عرض" : "View"}</Link><button type="button" aria-label={locale === "ar" ? "إغلاق التنبيه" : "Dismiss notification"} onClick={() => setNewBooking(null)} className="text-lg leading-none">×</button></div></div> : null}
                    {children}
                </main>
            </div>
        </div>
    );
}
