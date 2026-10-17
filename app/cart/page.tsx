"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { clinicWhatsAppNumber } from "@/lib/clinic-contact";

export default function CartPage() {
    const { locale } = useLocale();
    const { isLoaded, products, cartItems, updateCartQuantity, removeFromCart, submitProductOrder } = useClinicData();
    const { user, isLoaded: isAuthLoaded } = useAuth();
    const router = useRouter();
    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const [customerNameDraft, setCustomerNameDraft] = useState<string | null>(null);
    const customerName = customerNameDraft ?? user?.name ?? "";
    const [customerPhone, setCustomerPhone] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null);
    const [whatsAppOrderUrl, setWhatsAppOrderUrl] = useState("");
    const [orderError, setOrderError] = useState("");
    const isArabic = locale === "ar";
    const cartProducts = cartItems.map((item) => ({
        item,
        product: products.find((product) => product.id === item.productId),
    }));
    const total = cartProducts.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.item.quantity, 0);

    useEffect(() => {
        if (isAuthLoaded && isStaff) router.replace("/dashboard");
    }, [isAuthLoaded, isStaff, router]);

    const confirmOrder = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setOrderError("");
        const order = submitProductOrder({ customerName, customerPhone, deliveryAddress });
        if (!order) {
            setOrderError(isArabic ? "تعذر تأكيد الطلب. تحقق من توفر المنتجات وحاول مرة أخرى." : "Could not confirm this order. Check product availability and try again.");
            return;
        }
        const message = [
            isArabic ? "طلب جديد من Greens Healing Therapy" : "New order for Greens Healing Therapy",
            `${isArabic ? "رقم الطلب" : "Order ID"}: ${order.id}`,
            `${isArabic ? "الاسم" : "Name"}: ${order.customerName}`,
            `${isArabic ? "الهاتف" : "Phone"}: ${order.customerPhone}`,
            `${isArabic ? "عنوان التوصيل" : "Delivery address"}: ${order.deliveryAddress}`,
            "",
            isArabic ? "المنتجات:" : "Products:",
            ...order.items.map((item) => `- ${isArabic ? item.productNameAr : item.productNameEn} x${item.quantity} = $${(item.unitPrice * item.quantity).toFixed(2)}`),
            `${isArabic ? "المجموع" : "Total"}: $${order.total.toFixed(2)}`,
            isArabic ? "طريقة الدفع: نقداً عند الاستلام" : "Payment: Cash on delivery",
        ].join("\n");
        const whatsappUrl = `https://wa.me/${clinicWhatsAppNumber}?text=${encodeURIComponent(message)}`;
        setWhatsAppOrderUrl(whatsappUrl);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setOrderPlacedId(order.id);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-clinic-border pb-5">
                <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{isArabic ? "المتجر" : "Shop"}</p><h1 className="mt-1 text-2xl font-bold text-emerald-950">{isArabic ? "سلة التسوق" : "Your cart"}</h1></div>
                <Link href="/products" className="text-sm font-semibold text-emerald-800">{isArabic ? "متابعة التسوق" : "Continue shopping"}</Link>
            </div>

            {!isAuthLoaded || isStaff ? <p className="py-12 text-center text-slate-500">{isArabic ? "جارٍ فتح لوحة العيادة..." : "Opening clinic dashboard..."}</p> : orderPlacedId ? (
                <div className="mx-auto max-w-xl border-y border-emerald-900/15 py-12 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-700" size={44} aria-hidden="true" />
                    <h2 className="mt-4 text-2xl font-bold text-emerald-950">{isArabic ? "تم تأكيد طلبك" : "Your order is confirmed"}</h2>
                    <p className="mt-2 text-slate-600">{isArabic ? "تم حفظ الطلب لإدارة العيادة. أكمل إرساله عبر واتساب وادفع نقداً عند الاستلام." : "Your order is saved for the clinic admin. Send the WhatsApp message to notify them, then pay cash on delivery."}</p>
                    <p className="mt-2 text-xs text-slate-500">{isArabic ? "رقم الطلب" : "Order ID"}: {orderPlacedId}</p>
                    {whatsAppOrderUrl ? <a href={whatsAppOrderUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-800 underline">{isArabic ? `فتح رسالة واتساب إلى ‎+${clinicWhatsAppNumber}` : `Open WhatsApp message to +${clinicWhatsAppNumber}`}</a> : null}
                    <Link href="/products" className="mt-6 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">{isArabic ? "متابعة التسوق" : "Continue shopping"}</Link>
                </div>
            ) : !isLoaded ? <p className="py-12 text-center text-slate-500">{isArabic ? "جارٍ تحميل السلة..." : "Loading cart..."}</p> : cartItems.length === 0 ? (
                <div className="rounded-xl border border-clinic-border bg-white px-5 py-14 text-center"><p className="text-slate-600">{isArabic ? "سلتك فارغة حالياً." : "Your cart is empty."}</p><Link href="/products" className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">{isArabic ? "استعرض المنتجات" : "Browse products"}</Link></div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                    <div className="divide-y divide-slate-200 border-y border-slate-200">
                        {cartProducts.map(({ item, product }) => product ? (
                            <article key={product.id} className="flex flex-wrap items-center gap-4 py-5">
                                {product.image ? <img src={product.image} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-emerald-50 text-3xl">🍯</div>}
                                <div className="min-w-36 flex-1"><h2 className="font-semibold text-slate-900">{isArabic ? product.arName : product.enName}</h2><p className="mt-1 text-sm text-slate-500">{product.weight} · ${product.price}</p></div>
                                <div className="flex items-center gap-2"><button type="button" aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"} onClick={() => updateCartQuantity(product.id, item.quantity - 1)} className="h-9 w-9 rounded-md border border-slate-300">−</button><span className="min-w-6 text-center">{item.quantity}</span><button type="button" aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"} disabled={item.quantity >= product.stock} onClick={() => updateCartQuantity(product.id, item.quantity + 1)} className="h-9 w-9 rounded-md border border-slate-300 disabled:opacity-40">+</button></div>
                                <div className="w-20 text-end font-semibold">${(product.price * item.quantity).toFixed(2)}</div>
                                <button type="button" onClick={() => removeFromCart(product.id)} className="text-sm text-red-700">{isArabic ? "إزالة" : "Remove"}</button>
                            </article>
                        ) : <div key={item.productId} className="flex items-center justify-between py-5 text-sm"><span>{isArabic ? "هذا المنتج لم يعد متاحاً." : "This product is no longer available."}</span><button type="button" onClick={() => removeFromCart(item.productId)} className="font-semibold text-red-700">{isArabic ? "إزالة" : "Remove"}</button></div>)}
                    </div>

                    <aside className="h-fit border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                        <h2 className="text-lg font-bold text-emerald-950">{isArabic ? "ملخص الطلب" : "Order summary"}</h2>
                        <div className="mt-5 flex justify-between border-b border-slate-200 pb-4 text-sm"><span>{isArabic ? "المجموع" : "Subtotal"}</span><span className="font-semibold">${total.toFixed(2)}</span></div>
                        <p className="mt-3 text-xs leading-5 text-slate-500">{isArabic ? "سيتم تأكيد رسوم التوصيل من إدارة العيادة." : "The clinic admin will confirm delivery charges."}</p>
                        <form onSubmit={confirmOrder} className="mt-5 space-y-3">
                            <label className="block space-y-1 text-sm font-medium text-slate-700">{isArabic ? "الاسم الكامل" : "Full name"}<input required autoComplete="name" value={customerName} onChange={(event) => setCustomerNameDraft(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                            <label className="block space-y-1 text-sm font-medium text-slate-700">{isArabic ? "رقم الهاتف" : "Phone number"}<input required type="tel" autoComplete="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                            <label className="block space-y-1 text-sm font-medium text-slate-700">{isArabic ? "عنوان التوصيل" : "Delivery address"}<textarea required autoComplete="street-address" rows={3} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2" /></label>
                            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">{isArabic ? "الدفع نقداً عند استلام الطلب." : "Pay cash when your order is delivered."}</div>
                            {orderError ? <p role="alert" className="text-sm text-red-700">{orderError}</p> : null}
                            <button type="submit" disabled={cartProducts.some((row) => !row.product)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={18} aria-hidden="true" />{isArabic ? "تأكيد الطلب" : "Confirm order"}</button>
                        </form>
                    </aside>
                </div>
            )}
        </div>
    );
}