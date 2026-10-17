"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, ExternalLink, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { ItemVisual } from "@/components/ui/item-visual";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageHeader } from "@/components/ui/section-shell";
import { clinicWhatsAppNumber } from "@/lib/clinic-contact";
import { formatCurrency } from "@/lib/i18n";
import type { ProductOrder } from "@/types/clinic";
import { toGoogleMapsUrl } from "@/lib/location";

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
    const [locationUrl, setLocationUrl] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null);
    const [whatsAppOrderUrl, setWhatsAppOrderUrl] = useState("");
    const [orderError, setOrderError] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const isArabic = locale === "ar";
    const cartProducts = cartItems.map((item) => ({
        item,
        product: products.find((product) => product.id === item.productId),
    }));
    const total = cartProducts.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.item.quantity, 0);

    useEffect(() => {
        if (isAuthLoaded && isStaff) router.replace("/dashboard");
    }, [isAuthLoaded, isStaff, router]);

    const shareLocation = () => {
        setLocationError("");
        // Browsers only expose geolocation on HTTPS (or localhost).
        if (!window.isSecureContext || !("geolocation" in navigator)) {
            setLocationError(isArabic ? "مشاركة الموقع غير مدعومة في هذا المتصفح. الصق رابط خرائط Google بدلاً من ذلك." : "Location sharing isn't available in this browser. Paste a Google Maps link instead.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocationUrl(`https://www.google.com/maps?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
                setIsLocating(false);
            },
            (positionError) => {
                setIsLocating(false);
                setLocationError(positionError.code === positionError.PERMISSION_DENIED
                    ? isArabic ? "تم رفض الإذن بالوصول إلى الموقع. فعّله من إعدادات المتصفح أو الصق رابط الموقع." : "Location permission was denied. Allow it in your browser settings, or paste a map link."
                    : positionError.code === positionError.TIMEOUT
                        ? isArabic ? "استغرق تحديد الموقع وقتاً طويلاً. حاول مرة أخرى." : "Finding your location took too long. Please try again."
                        : isArabic ? "تعذر تحديد موقعك. حاول مرة أخرى أو الصق رابط الموقع." : "Couldn't find your location. Try again, or paste a map link.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        );
    };

    const confirmOrder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setOrderError("");
        setIsPlacingOrder(true);
        let order: ProductOrder;
        try {
            order = await submitProductOrder({ customerName, customerPhone, deliveryAddress, locationUrl: toGoogleMapsUrl(locationUrl) });
        } catch (cause) {
            const reason = cause instanceof Error ? cause.message : "";
            setOrderError(isArabic
                ? `تعذر تأكيد الطلب. ${reason ? `(${reason}) ` : ""}تحقق من توفر المنتجات وحاول مرة أخرى.`
                : `Could not place this order.${reason ? ` ${reason}` : ""} Check product availability and try again.`);
            return;
        } finally {
            setIsPlacingOrder(false);
        }
        const message = [
            isArabic ? "طلب جديد من Greens Healing Therapy" : "New order for Greens Healing Therapy",
            `${isArabic ? "رقم الطلب" : "Order ID"}: ${order.id}`,
            `${isArabic ? "الاسم" : "Name"}: ${order.customerName}`,
            `${isArabic ? "الهاتف" : "Phone"}: ${order.customerPhone}`,
            `${isArabic ? "عنوان التوصيل" : "Delivery address"}: ${order.deliveryAddress}`,
            ...(order.locationUrl ? [`${isArabic ? "الموقع على الخريطة" : "Map location"}: ${order.locationUrl}`] : []),
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
        <div>
            <PageHeader eyebrow={isArabic ? "المتجر" : "Shop"} title={isArabic ? "سلة التسوق" : "Your cart"} />

            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {!isAuthLoaded || isStaff ? <p className="py-12 text-center text-slate-500">{isArabic ? "جارٍ فتح لوحة العيادة..." : "Opening clinic dashboard..."}</p> : orderPlacedId ? (
                    <div className="surface-card mx-auto max-w-xl p-10 text-center">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={32} strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <h2 className="mt-5 text-3xl font-semibold text-emerald-950">{isArabic ? "تم تأكيد طلبك" : "Your order is confirmed"}</h2>
                        <p className="mt-3 leading-7 text-slate-600">{isArabic ? "تم حفظ الطلب لإدارة العيادة. أكمل إرساله عبر واتساب وادفع نقداً عند الاستلام." : "Your order is saved for the clinic. Send the WhatsApp message to notify them, then pay cash on delivery."}</p>
                        <p className="mt-2 text-xs text-slate-500">{isArabic ? "رقم الطلب" : "Order ID"}: <span dir="ltr">{orderPlacedId}</span></p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            {whatsAppOrderUrl ? <a href={whatsAppOrderUrl} target="_blank" rel="noreferrer" className="btn-primary"><MessageCircle size={18} aria-hidden="true" />{isArabic ? "إرسال عبر واتساب" : "Send on WhatsApp"}</a> : null}
                            <Link href="/products" className="btn-secondary">{isArabic ? "متابعة التسوق" : "Continue shopping"}</Link>
                        </div>
                    </div>
                ) : !isLoaded ? <p className="py-12 text-center text-slate-500">{isArabic ? "جارٍ تحميل السلة..." : "Loading cart..."}</p> : cartItems.length === 0 ? (
                    <div className="surface-card mx-auto max-w-lg px-6 py-14 text-center">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-honey-50 text-honey-700">
                            <ShoppingBag size={28} strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <h2 className="mt-5 text-3xl font-semibold text-emerald-950">{isArabic ? "سلتك فارغة" : "Your cart is empty"}</h2>
                        <p className="mt-2 text-slate-600">{isArabic ? "اكتشف عسلنا ومنتجاتنا الطبيعية." : "Discover our honey and natural products."}</p>
                        <Link href="/products" className="btn-primary mt-7">{isArabic ? "استعرض المنتجات" : "Browse products"}</Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        <div className="surface-card divide-y divide-clinic-border px-5 sm:px-6">
                            {cartProducts.map(({ item, product }) => product ? (
                                <article key={product.id} className="flex flex-wrap items-center gap-4 py-5">
                                    <ItemVisual image={product.image} alt="" category={product.category} className="h-20 w-20 shrink-0 rounded-2xl [&_svg]:h-8 [&_svg]:w-8" />
                                    <div className="min-w-36 flex-1">
                                        <h2 className="text-lg font-semibold text-emerald-950">{isArabic ? product.arName : product.enName}</h2>
                                        <p className="mt-0.5 text-sm text-slate-500">{product.weight ? `${product.weight} · ` : ""}{formatCurrency(product.price, locale)}</p>
                                        <button type="button" onClick={() => removeFromCart(product.id)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-700">
                                            <Trash2 size={13} aria-hidden="true" />
                                            {isArabic ? "إزالة" : "Remove"}
                                        </button>
                                    </div>
                                    <div className="flex items-center rounded-full border border-clinic-border">
                                        <button type="button" aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"} onClick={() => updateCartQuantity(product.id, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><Minus size={14} aria-hidden="true" /></button>
                                        <span className="min-w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                                        <button type="button" aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"} disabled={item.quantity >= product.stock} onClick={() => updateCartQuantity(product.id, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40"><Plus size={14} aria-hidden="true" /></button>
                                    </div>
                                    <div className="w-20 text-end font-semibold text-emerald-950">{formatCurrency(Number((product.price * item.quantity).toFixed(2)), locale)}</div>
                                </article>
                            ) : (
                                <div key={item.productId} className="flex items-center justify-between py-5 text-sm">
                                    <span className="text-slate-600">{isArabic ? "هذا المنتج لم يعد متاحاً." : "This product is no longer available."}</span>
                                    <button type="button" onClick={() => removeFromCart(item.productId)} className="font-semibold text-red-700">{isArabic ? "إزالة" : "Remove"}</button>
                                </div>
                            ))}
                        </div>

                        <aside className="surface-card h-fit p-6 lg:sticky lg:top-24">
                            <h2 className="text-2xl font-semibold text-emerald-950">{isArabic ? "ملخص الطلب" : "Order summary"}</h2>
                            <div className="mt-5 flex items-baseline justify-between border-b border-clinic-border pb-4">
                                <span className="text-sm text-slate-500">{isArabic ? "المجموع" : "Subtotal"}</span>
                                <span className="text-2xl font-semibold text-emerald-900">{formatCurrency(Number(total.toFixed(2)), locale)}</span>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-slate-500">{isArabic ? "سيتم تأكيد رسوم التوصيل من إدارة العيادة." : "The clinic will confirm delivery charges."}</p>
                            <form onSubmit={confirmOrder} className="mt-5 space-y-4">
                                <label className="block space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "الاسم الكامل" : "Full name"}<input required autoComplete="name" value={customerName} onChange={(event) => setCustomerNameDraft(event.target.value)} className="field" /></label>
                                <label className="block space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "رقم الهاتف" : "Phone number"}<input required type="tel" dir="ltr" autoComplete="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="field text-start" /></label>
                                <label className="block space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "عنوان التوصيل" : "Delivery address"}<textarea required autoComplete="street-address" rows={3} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="field resize-y" /></label>
                                <div className="space-y-1.5">
                                    <label htmlFor="order-location" className="block text-sm font-medium text-slate-700">
                                        {isArabic ? "الموقع على الخريطة" : "Map location"} <span className="font-normal text-slate-400">({isArabic ? "اختياري" : "optional"})</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="order-location"
                                            type="text"
                                            dir="auto"
                                            autoComplete="off"
                                            value={locationUrl}
                                            onChange={(event) => { setLocationUrl(event.target.value); setLocationError(""); }}
                                            placeholder={isArabic ? "رابط خرائط Google أو معلم قريب" : "Maps link, coordinates or landmark"}
                                            className="field min-w-0 flex-1 text-start text-sm"
                                        />
                                        <LoadingButton
                                            type="button"
                                            pending={isLocating}
                                            icon={<MapPin size={16} aria-hidden="true" />}
                                            onClick={shareLocation}
                                            title={isArabic ? "استخدام موقعي الحالي" : "Use my current location"}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-700 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
                                        >
                                            {isLocating ? (isArabic ? "جارٍ التحديد..." : "Locating...") : (isArabic ? "موقعي" : "My location")}
                                        </LoadingButton>
                                    </div>
                                    {locationUrl.trim() && !locationError ? (
                                        <a href={toGoogleMapsUrl(locationUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline underline-offset-2">
                                            <ExternalLink size={12} aria-hidden="true" />
                                            {isArabic ? "معاينة على الخريطة" : "Preview on map"}
                                        </a>
                                    ) : null}
                                    {locationError ? <p role="alert" className="text-xs leading-5 text-red-700">{locationError}</p> : null}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-honey-50 px-3 py-2.5 text-sm font-medium text-honey-700"><Banknote size={16} aria-hidden="true" />{isArabic ? "الدفع نقداً عند الاستلام" : "Cash on delivery"}</div>
                                {orderError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{orderError}</p> : null}
                                <LoadingButton type="submit" pending={isPlacingOrder} disabled={cartProducts.some((row) => !row.product)} className="btn-primary w-full py-3.5 text-base">{isPlacingOrder ? (isArabic ? "جارٍ إرسال الطلب..." : "Placing order...") : (isArabic ? "تأكيد الطلب" : "Place order")}</LoadingButton>
                            </form>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
