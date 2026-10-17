"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { SectionShell } from "@/components/ui/section-shell";

export default function ProductsPage() {
    const { locale } = useLocale();
    const { user } = useAuth();
    const { products, cartItems, addToCart } = useClinicData();
    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const availableProducts = products.filter((product) => product.active);
    const [addedProductId, setAddedProductId] = useState<string | null>(null);
    const [addAnimationKey, setAddAnimationKey] = useState(0);

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionShell
                eyebrow={locale === "ar" ? "المنتجات" : "Products"}
                title={locale === "ar" ? "المنتجات الطبيعية" : "Natural products"}
                description={
                    locale === "ar"
                        ? "المنتجات التي أضافتها العيادة إلى الكتالوج."
                        : "Products added to the clinic catalog."
                }
            >
                {availableProducts.length === 0 ? <p className="border-t border-slate-200 py-8 text-sm text-slate-500">{locale === "ar" ? "لا توجد منتجات متاحة حالياً." : "No products are currently available."}</p> : <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {availableProducts.map((product) => {
                        const quantityInCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
                        const reachedLimit = quantityInCart >= product.stock;
                        const wasAdded = addedProductId === product.id;

                        return (
                            <div key={product.id} className="rounded-xl border border-clinic-border bg-white p-4">
                                <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-[#eff7f3] text-5xl">
                                    {product.image ? <img src={product.image} alt={locale === "ar" ? product.arName : product.enName} className="h-full w-full object-cover" /> : "🍯"}
                                </div>
                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                                    <span>{product.category}</span>
                                    <span>{product.weight}</span>
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-slate-900">
                                    {locale === "ar" ? product.arName : product.enName}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-slate-600">{locale === "ar" ? product.arDescription : product.enDescription ?? product.description}</p>
                                <div className="mt-5 flex items-center justify-between">
                                    <span className="text-lg font-bold text-emerald-950">${product.price}</span>
                                    <span className="text-sm text-slate-500">{product.weight}</span>
                                </div>
                                {!isStaff ? <button
                                    type="button"
                                    disabled={product.stock < 1 || reachedLimit}
                                    onClick={() => {
                                        if (!addToCart(product.id)) return;
                                        setAddedProductId(product.id);
                                        setAddAnimationKey((key) => key + 1);
                                    }}
                                    className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-400 ${wasAdded ? "bg-teal-700" : "bg-emerald-700 hover:bg-emerald-800"}`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {wasAdded ? <Check key={`${product.id}-${addAnimationKey}`} size={18} aria-hidden="true" className="cart-added-pop" /> : <ShoppingCart size={18} aria-hidden="true" />}
                                        <span>{product.stock < 1
                                            ? locale === "ar" ? "نفد من المخزون" : "Out of stock"
                                            : reachedLimit
                                                ? locale === "ar" ? "اكتملت الكمية في السلة" : "Stock limit reached"
                                                : wasAdded
                                                    ? locale === "ar" ? "أضيف إلى السلة" : "Added to cart"
                                                    : locale === "ar" ? "أضف إلى السلة" : "Add to cart"}</span>
                                    </span>
                                </button> : null}
                            </div>
                        );
                    })}
                </div>}
            </SectionShell>
        </div>
    );
}
