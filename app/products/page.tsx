"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ProductCard } from "@/components/catalog/product-card";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CardSkeletons, EmptyState, PageHeader } from "@/components/ui/section-shell";

export default function ProductsPage() {
    const { locale } = useLocale();
    const { user } = useAuth();
    const { products, isLoaded } = useClinicData();
    const [category, setCategory] = useState<string | null>(null);
    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const isArabic = locale === "ar";
    const availableProducts = products.filter((product) => product.active);
    const categories = [...new Set(availableProducts.map((product) => product.category).filter(Boolean))];
    const visibleProducts = category ? availableProducts.filter((product) => product.category === category) : availableProducts;

    return (
        <div>
            <PageHeader
                eyebrow={isArabic ? "المتجر" : "Shop"}
                title={isArabic ? "عسل ومنتجات من خلايانا" : "Honey & hive products"}
                description={isArabic
                    ? "عسل طبيعي ومنتجات نحل مختارة، تُوصَل إليك مع الدفع نقداً عند الاستلام."
                    : "Raw honey and selected hive products, delivered to you with cash on delivery."}
            />
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {categories.length > 1 ? (
                    <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={isArabic ? "تصفية حسب الفئة" : "Filter by category"}>
                        {[null, ...categories].map((item) => (
                            <button
                                key={item ?? "all"}
                                type="button"
                                aria-pressed={category === item}
                                onClick={() => setCategory(item)}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${category === item ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-card text-slate-700 hover:border-emerald-600"}`}
                            >
                                {item ?? (isArabic ? "الكل" : "All")}
                            </button>
                        ))}
                    </div>
                ) : null}
                {!isLoaded ? <CardSkeletons count={4} /> : visibleProducts.length === 0 ? (
                    <EmptyState title={isArabic ? "المنتجات قادمة قريباً" : "Products coming soon"} />
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id} product={product} locale={locale} showCart={!isStaff} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
