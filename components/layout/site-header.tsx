"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LogOut, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import clinicLogoImage from "../../logo.jpeg";

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
    const pathname = usePathname();
    const { locale, setLocale } = useLocale();
    const { user, logout } = useAuth();
    const { cartItems, clinicLogo } = useClinicData();
    const [isOpen, setIsOpen] = useState(false);
    const [cartAnimationKey, setCartAnimationKey] = useState(0);
    const [logoutError, setLogoutError] = useState("");
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    const isArabic = locale === "ar";

    const handleLogout = async () => {
        try {
            await logout();
            setLogoutError("");
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Unable to sign out.";
            console.error("Unable to sign out:", message);
            setLogoutError(message);
        }
    };

    useEffect(() => {
        const animateCart = () => setCartAnimationKey((key) => key + 1);
        window.addEventListener("clinic-cart-item-added", animateCart);
        return () => window.removeEventListener("clinic-cart-item-added", animateCart);
    }, []);

    const isStaff = user?.role === "admin" || user?.role === "receptionist";
    const visibleNavItems = navItems[locale];
    const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
    const primaryActionHref = isStaff ? "/dashboard" : "/book";
    const primaryActionLabel = isStaff
        ? isArabic ? "لوحة التحكم" : "Dashboard"
        : isArabic ? "احجز موعداً" : "Book a session";
    const toggleLocale = () => setLocale(isArabic ? "en" : "ar");

    return (
        <header className="sticky top-0 z-50 border-b border-clinic-border/80 bg-background/85 backdrop-blur-lg">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-clinic-border">
                        {clinicLogo
                            ? <img src={clinicLogo} alt="" className="h-full w-full object-cover" />
                            : <Image src={clinicLogoImage} alt="" fill sizes="44px" className="scale-[1.12] object-cover" priority />}
                    </span>
                    <span className="leading-tight">
                        <span className="block font-display text-lg font-semibold text-emerald-950">Greens Healing Therapy</span>
                        <span className="block text-[11px] tracking-[0.2em] text-honey-700 uppercase">
                            {isArabic ? "طبيعي · نقي · شافٍ" : "Natural · Pure · Healing"}
                        </span>
                    </span>
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {visibleNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive(item.href) ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:text-emerald-800"}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleLocale}
                        className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800 md:inline-flex"
                    >
                        <Globe size={16} aria-hidden="true" />
                        {isArabic ? "English" : "العربية"}
                    </button>

                    {!isStaff ? (
                        <Link
                            href="/cart"
                            aria-label={`${isArabic ? "السلة" : "Cart"}: ${cartCount}`}
                            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-900 transition hover:bg-emerald-50"
                        >
                            <ShoppingBag key={cartAnimationKey} size={20} aria-hidden="true" className={cartAnimationKey > 0 ? "cart-added-pop" : ""} />
                            {cartCount > 0 ? (
                                <span key={cartCount} className="cart-count-pop absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white">
                                    {cartCount}
                                </span>
                            ) : null}
                        </Link>
                    ) : null}

                    {user ? (
                        <button
                            type="button"
                            onClick={() => void handleLogout()}
                            aria-label={isArabic ? "تسجيل الخروج" : "Log out"}
                            title={isArabic ? "تسجيل الخروج" : "Log out"}
                            className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 md:inline-flex"
                        >
                            <LogOut size={18} aria-hidden="true" />
                        </button>
                    ) : (
                        <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800 md:inline-flex">
                            {isArabic ? "تسجيل الدخول" : "Sign in"}
                        </Link>
                    )}

                    <Link href={primaryActionHref} className="btn-primary hidden py-2.5 md:inline-flex">
                        {primaryActionLabel}
                    </Link>

                    <button
                        type="button"
                        aria-label={isArabic ? "القائمة" : "Menu"}
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((current) => !current)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-900 transition hover:bg-emerald-50 md:hidden"
                    >
                        {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
                    </button>
                </div>
            </nav>

            {logoutError ? <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800">{logoutError}</p> : null}

            {isOpen ? (
                <div className="border-t border-clinic-border bg-background px-4 pb-6 pt-3 md:hidden">
                    <div className="flex flex-col gap-1">
                        {visibleNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                aria-current={isActive(item.href) ? "page" : undefined}
                                className={`rounded-2xl px-4 py-3 text-base font-medium ${isActive(item.href) ? "bg-emerald-50 text-emerald-900" : "text-slate-700"}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {user ? (
                            <button
                                type="button"
                                onClick={() => {
                                    void handleLogout();
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-start text-base font-medium text-slate-700"
                            >
                                <LogOut size={18} aria-hidden="true" />
                                {isArabic ? "تسجيل الخروج" : "Log out"}
                            </button>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-2xl px-4 py-3 text-base font-medium text-slate-700">
                                {isArabic ? "تسجيل الدخول" : "Sign in"}
                            </Link>
                        )}
                        <button type="button" onClick={toggleLocale} className="flex items-center gap-2 rounded-2xl px-4 py-3 text-start text-base font-medium text-slate-700">
                            <Globe size={18} aria-hidden="true" />
                            {isArabic ? "English" : "العربية"}
                        </button>
                        <Link href={primaryActionHref} onClick={() => setIsOpen(false)} className="btn-primary mt-3 w-full py-3.5">
                            {primaryActionLabel}
                        </Link>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
