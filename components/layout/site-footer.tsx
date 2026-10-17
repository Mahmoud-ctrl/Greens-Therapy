"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { clinicWhatsAppNumber } from "@/lib/clinic-contact";

export function SiteFooter() {
    const pathname = usePathname();
    const { locale } = useLocale();
    const isArabic = locale === "ar";

    if (pathname.startsWith("/dashboard")) return null;

    const links = [
        { href: "/treatments", label: isArabic ? "العلاجات" : "Treatments" },
        { href: "/products", label: isArabic ? "المنتجات" : "Products" },
        { href: "/book", label: isArabic ? "احجز موعداً" : "Book a session" },
    ];

    return (
        <footer className="bg-emerald-950 text-emerald-100">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
                <div>
                    <p className="font-display text-2xl font-semibold text-white">Greens Healing Therapy</p>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-emerald-200/80">
                        {isArabic
                            ? "علاجات تقليدية ومنتجات طبيعية من خلايا النحل، لرعاية الجسد والعقل والتوازن اليومي."
                            : "Traditional therapies and natural hive products, caring for body, mind, and daily balance."}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-300">{isArabic ? "روابط" : "Explore"}</p>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        {links.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="text-emerald-100/90 transition hover:text-white">{link.label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-300">{isArabic ? "تواصل معنا" : "Get in touch"}</p>
                    <a
                        href={`https://wa.me/${clinicWhatsAppNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-100/90 transition hover:text-white"
                    >
                        <MessageCircle size={16} aria-hidden="true" />
                        <span dir="ltr">+{clinicWhatsAppNumber.replace(/^961/, "961 ")}</span>
                    </a>
                </div>
            </div>
            <div className="border-t border-white/10">
                <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-emerald-200/60 sm:px-6 lg:px-8">
                    © Greens Healing Therapy
                </p>
            </div>
        </footer>
    );
}
