"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

import { useClinicData } from "@/components/providers/clinic-data-provider";
import { ItemVisual } from "@/components/ui/item-visual";
import { formatCurrency } from "@/lib/i18n";
import type { Locale, Product } from "@/types/clinic";

export function ProductCard({ product, locale, showCart }: { product: Product; locale: Locale; showCart: boolean }) {
    const { cartItems, addToCart } = useClinicData();
    const [addAnimationKey, setAddAnimationKey] = useState(0);
    const isArabic = locale === "ar";
    const name = isArabic ? product.arName : product.enName;
    const quantityInCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
    const outOfStock = product.stock < 1;
    const reachedLimit = quantityInCart >= product.stock;
    const wasAdded = addAnimationKey > 0;

    return (
        <article className="surface-card flex flex-col overflow-hidden">
            <ItemVisual image={product.image} alt={name} category={product.category} className="aspect-[16/9] w-full sm:aspect-square" />
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-[0.14em] text-honey-700">{product.category}</span>
                    {product.weight ? <span>{product.weight}</span> : null}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-emerald-950">{name}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">
                    {isArabic ? product.arDescription : product.enDescription ?? product.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-emerald-900">{formatCurrency(product.price, locale)}</span>
                    {showCart ? (
                        <button
                            type="button"
                            disabled={outOfStock || reachedLimit}
                            onClick={() => {
                                if (addToCart(product.id)) setAddAnimationKey((key) => key + 1);
                            }}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${wasAdded ? "bg-honey-500 text-white" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}
                        >
                            {wasAdded ? <Check key={addAnimationKey} size={16} aria-hidden="true" className="cart-added-pop" /> : <ShoppingBag size={16} aria-hidden="true" />}
                            {outOfStock
                                ? isArabic ? "نفد" : "Sold out"
                                : reachedLimit
                                    ? isArabic ? "الحد الأقصى" : "Max in cart"
                                    : wasAdded
                                        ? isArabic ? "أضيف" : "Added"
                                        : isArabic ? "أضف" : "Add"}
                        </button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
