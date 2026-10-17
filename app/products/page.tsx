"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ProductCard } from "@/components/catalog/product-card";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CardSkeletons, EmptyState, PageHeader } from "@/components/ui/section-shell";
import type { Product } from "@/types/clinic";

type SortOrder = "featured" | "price-asc" | "price-desc" | "name";

const sortOptions: Array<{ value: SortOrder; ar: string; en: string }> = [
    { value: "featured", ar: "الافتراضي", en: "Featured" },
    { value: "price-asc", ar: "السعر: من الأقل", en: "Price: low to high" },
    { value: "price-desc", ar: "السعر: من الأعلى", en: "Price: high to low" },
    { value: "name", ar: "الاسم", en: "Name" },
];

export default function ProductsPage() {
    const { locale } = useLocale();
    const { user } = useAuth();
    const { products, isLoaded } = useClinicData();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>("featured");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const isArabic = locale === "ar";
    const availableProducts = products.filter((product) => product.active);
    const categories = [...new Set(availableProducts.map((product) => product.category).filter(Boolean))];
    const activeFilterCount = [category, minPrice, maxPrice].filter(Boolean).length + (inStockOnly ? 1 : 0) + (sortOrder !== "featured" ? 1 : 0);

    const normalizedQuery = query.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const matchesQuery = (product: Product) => !normalizedQuery || [product.arName, product.enName, product.arDescription, product.enDescription, product.category, product.weight]
        .some((field) => field?.toLowerCase().includes(normalizedQuery));
    const visibleProducts = availableProducts
        .filter((product) => matchesQuery(product)
            && (!category || product.category === category)
            && (min === null || product.price >= min)
            && (max === null || product.price <= max)
            && (!inStockOnly || product.stock > 0))
        .sort((first, second) => {
            if (sortOrder === "price-asc") return first.price - second.price;
            if (sortOrder === "price-desc") return second.price - first.price;
            if (sortOrder === "name") return (isArabic ? first.arName : first.enName).localeCompare(isArabic ? second.arName : second.enName, locale);
            return 0;
        });

    const clearFilters = () => {
        setCategory(null);
        setMinPrice("");
        setMaxPrice("");
        setInStockOnly(false);
        setSortOrder("featured");
    };

    return (
        <div>
            <PageHeader
                eyebrow={isArabic ? "المتجر" : "Shop"}
                title={isArabic ? "عسل ومنتجات من خلايانا" : "Honey & hive products"}
                description={isArabic
                    ? "عسل طبيعي ومنتجات نحل مختارة، تُوصَل إليك مع الدفع نقداً عند الاستلام."
                    : "Raw honey and selected hive products, delivered to you with cash on delivery."}
            />
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex gap-3">
                    <label className="relative flex-1">
                        <span className="sr-only">{isArabic ? "ابحث عن منتج" : "Search products"}</span>
                        <Search size={18} aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={isArabic ? "ابحث عن عسل، شمع، لقاح..." : "Search honey, comb, pollen..."}
                            className="field rounded-full ps-11"
                        />
                    </label>
                    <button
                        type="button"
                        aria-expanded={filtersOpen}
                        aria-controls="product-filters"
                        onClick={() => setFiltersOpen((open) => !open)}
                        className={`relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition sm:px-5 ${filtersOpen ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-card text-emerald-900 hover:border-emerald-600"}`}
                    >
                        <SlidersHorizontal size={17} aria-hidden="true" />
                        <span className="hidden sm:inline">{isArabic ? "تصفية" : "Filters"}</span>
                        {activeFilterCount > 0 ? (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-honey-500 px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>
                        ) : null}
                    </button>
                </div>

                {filtersOpen ? (
                    <div id="product-filters" className="surface-card mt-4 grid gap-6 p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-4">
                        <fieldset className="min-w-0">
                            <legend className="text-sm font-semibold text-emerald-950">{isArabic ? "الفئة" : "Category"}</legend>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[null, ...categories].map((item) => (
                                    <button
                                        key={item ?? "all"}
                                        type="button"
                                        aria-pressed={category === item}
                                        onClick={() => setCategory(item)}
                                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${category === item ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-card text-slate-700 hover:border-emerald-600"}`}
                                    >
                                        {item ?? (isArabic ? "الكل" : "All")}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="min-w-0">
                            <legend className="text-sm font-semibold text-emerald-950">{isArabic ? "السعر ($)" : "Price ($)"}</legend>
                            <div className="mt-3 flex items-center gap-2">
                                <input type="number" inputMode="decimal" min={0} value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder={isArabic ? "من" : "Min"} aria-label={isArabic ? "أقل سعر" : "Minimum price"} className="field py-2" />
                                <span className="text-slate-400">–</span>
                                <input type="number" inputMode="decimal" min={0} value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder={isArabic ? "إلى" : "Max"} aria-label={isArabic ? "أعلى سعر" : "Maximum price"} className="field py-2" />
                            </div>
                        </fieldset>

                        <label className="flex flex-col gap-3 text-sm font-semibold text-emerald-950">
                            {isArabic ? "الترتيب" : "Sort by"}
                            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="field py-2 font-normal">
                                {sortOptions.map((option) => <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>)}
                            </select>
                        </label>

                        <div className="flex flex-col justify-between gap-4">
                            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-emerald-950">
                                {isArabic ? "المتوفر فقط" : "In stock only"}
                                <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="peer sr-only" />
                                <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-700 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
                            </label>
                            <button type="button" onClick={clearFilters} disabled={activeFilterCount === 0} className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-slate-500 transition hover:text-red-700 disabled:opacity-40 disabled:hover:text-slate-500">
                                <X size={15} aria-hidden="true" />
                                {isArabic ? "مسح التصفية" : "Clear filters"}
                            </button>
                        </div>
                    </div>
                ) : null}

                {isLoaded && availableProducts.length > 0 ? (
                    <p className="mt-6 text-sm text-slate-500" aria-live="polite">
                        {isArabic ? `${visibleProducts.length} من ${availableProducts.length} منتج` : `${visibleProducts.length} of ${availableProducts.length} products`}
                    </p>
                ) : null}

                <div className="mt-4">
                    {!isLoaded ? <CardSkeletons count={4} variant="product" label={isArabic ? "جارٍ تحميل المنتجات..." : "Loading products..."} /> : availableProducts.length === 0 ? (
                        <EmptyState title={isArabic ? "المنتجات قادمة قريباً" : "Products coming soon"} />
                    ) : visibleProducts.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-clinic-border bg-card/60 px-6 py-14 text-center">
                            <p className="font-display text-2xl font-semibold text-emerald-950">{isArabic ? "لا توجد نتائج" : "No matching products"}</p>
                            <p className="mt-2 text-sm text-slate-600">{isArabic ? "جرّب كلمة بحث أخرى أو غيّر التصفية." : "Try a different search or adjust the filters."}</p>
                            <button type="button" onClick={() => { setQuery(""); clearFilters(); }} className="btn-secondary mt-5">{isArabic ? "عرض كل المنتجات" : "Show all products"}</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {visibleProducts.map((product) => (
                                <ProductCard key={product.id} product={product} locale={locale} showCart={!isStaff} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
