"use client";

import { useEffect } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";

function DashboardOrdersContent() {
    const { locale } = useLocale();
    const { productOrders, markProductOrdersRead } = useClinicData();
    const isArabic = locale === "ar";

    useEffect(() => {
        markProductOrdersRead();
    }, [markProductOrdersRead]);

    return (
        <div className="space-y-5">
            <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-medium text-emerald-700">{isArabic ? "المتجر" : "Store"}</p>
                <h1 className="mt-1 text-2xl font-bold text-emerald-950">{isArabic ? "طلبات المنتجات" : "Product orders"}</h1>
            </div>
            {productOrders.length === 0 ? <p className="py-12 text-center text-slate-500">{isArabic ? "لا توجد طلبات بعد." : "No orders yet."}</p> : (
                <div className="space-y-4">
                    {productOrders.map((order) => (
                        <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                <div><h2 className="font-bold text-slate-900">{order.customerName}</h2><p className="mt-1 text-sm text-slate-600"><a href={`tel:${order.customerPhone}`} className="underline">{order.customerPhone}</a> · {order.deliveryAddress}</p></div>
                                <div className="text-end"><p className="text-lg font-bold text-emerald-950">${order.total.toFixed(2)}</p><p className="text-xs text-slate-500">{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div>
                            </div>
                            <ul className="divide-y divide-slate-100 text-sm">
                                {order.items.map((item) => <li key={item.productId} className="flex justify-between gap-4 py-2"><span>{isArabic ? item.productNameAr : item.productNameEn} × {item.quantity}</span><span>${(item.unitPrice * item.quantity).toFixed(2)}</span></li>)}
                            </ul>
                            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-sm"><span className="font-semibold text-emerald-800">{isArabic ? "الدفع نقداً عند الاستلام" : "Cash on delivery"}</span><span className="text-slate-600">{isArabic ? "طلب جديد" : order.status}</span></div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardOrdersPage() {
    return (
        <RequireAuth allowedRoles={["admin"]}>
            <DashboardOrdersContent />
        </RequireAuth>
    );
}