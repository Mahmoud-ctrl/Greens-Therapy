"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";

const navItems = {
    ar: [
        { label: "الرئيسية", href: "/" },
        { label: "العلاجات", href: "/treatments" },
        { label: "المنتجات", href: "/products" },
    ],
    en: [
        { label: "Home", href: "/" },
        { label: "Treatments", href: "/treatments" },
        { label: "Products", href: "/products" },
    ],
};

export function SiteHeader() {
    const { locale, setLocale } = useLocale();
    const { user, logout } = useAuth();
    const { cartItems, clinicLogo } = useClinicData();
    const [isOpen, setIsOpen] = useState(false);
    const [cartAnimationKey, setCartAnimationKey] = useState(0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    useEffect(() => {
        const animateCart = () => setCartAnimationKey((key) => key + 1);
        window.addEventListener("clinic-cart-item-added", animateCart);
        return () => window.removeEventListener("clinic-cart-item-added", animateCart);
    }, []);

    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const visibleNavItems = navItems[locale];
    const primaryActionHref = user
        ? user.role === "admin" || user.role === "receptionist"
            ? "/dashboard"
            : "/book"
        : "/login";

    const primaryActionLabel = user
        ? user.role === "admin" || user.role === "receptionist"
            ? locale === "ar"
                ? "لوحة التحكم"
                : "Dashboard"
            : locale === "ar"
                ? "حجزي"
                : "My booking"
        : locale === "ar"
            ? "ابدأ الآن"
            : "Get started";

    return (
        <header className="sticky top-0 z-50 border-b border-clinic-border bg-white/95 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-700 text-lg font-bold text-white">
                        {clinicLogo
                            ? <img src={clinicLogo} alt="Greens Healing Therapy" className="h-full w-full object-cover" />
                            : "G"}
                    </div>
                    <div>
                        <div className="text-base font-bold text-emerald-950">Greens Healing Therapy</div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-700">
                            {locale === "ar" ? "العناية الطبيعية" : "Natural wellness"}
                        </div>
                    </div>
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    {visibleNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-slate-700 transition hover:text-emerald-700"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                        className="hidden rounded-full border border-emerald-700/20 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-700 md:inline-flex"
                    >
                        {locale === "ar" ? "English" : "العربية"}
                    </button>

                    {!isStaff ? <Link href="/cart" aria-label={`${locale === "ar" ? "السلة" : "Cart"}: ${cartCount}`} className="hidden items-center gap-2 rounded-full border border-emerald-700/20 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 md:inline-flex">
                        <ShoppingCart key={cartAnimationKey} size={17} aria-hidden="true" className={cartAnimationKey > 0 ? "cart-added-pop" : ""} />
                        <span>{locale === "ar" ? "السلة" : "Cart"}</span>
                        {cartCount > 0 ? <span key={cartCount} className="cart-count-pop rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold">{cartCount}</span> : null}
                    </Link> : null}

                    {user ? (
                        <button
                            type="button"
                            onClick={logout}
                            className="hidden rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 md:inline-flex"
                        >
                            {locale === "ar" ? "تسجيل الخروج" : "Logout"}
                        </button>
                    ) : null}

                    <Link
                        href={primaryActionHref}
                        className="hidden rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 md:inline-flex"
                    >
                        {primaryActionLabel}
                    </Link>

                    <button
                        type="button"
                        aria-label="Toggle menu"
                        onClick={() => setIsOpen((current) => !current)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
                    >
                        ☰
                    </button>
                </div>
            </nav>

            {isOpen ? (
                <div className="border-t border-emerald-900/10 bg-white px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-2">
                        {visibleNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!isStaff ? <Link href="/cart" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                            <ShoppingCart size={17} aria-hidden="true" />
                            <span>{locale === "ar" ? "السلة" : "Cart"}</span>
                            {cartCount > 0 ? <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold">{cartCount}</span> : null}
                        </Link> : null}
                        {user ? (
                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                            >
                                {locale === "ar" ? "تسجيل الخروج" : "Logout"}
                            </button>
                        ) : null}
                        <Link
                            href={primaryActionHref}
                            onClick={() => setIsOpen(false)}
                            className="mt-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-center text-sm font-semibold text-white"
                        >
                            {primaryActionLabel}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                            className="mt-2 rounded-xl border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                        >
                            {locale === "ar" ? "English" : "العربية"}
                        </button>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
