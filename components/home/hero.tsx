"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Droplet, FlaskRound, Flower2, Hand, Leaf, Pin, type LucideIcon } from "lucide-react";

import type { Locale } from "@/types/clinic";
import therapistPoster from "../../about us.jpeg";
import therapistPortrait from "../../ali akhdar .png";

export const therapies: Array<{ icon: LucideIcon; ar: string; en: string }> = [
    { icon: FlaskRound, ar: "العلاج بالحجامة", en: "Cupping therapy" },
    { icon: Hand, ar: "التدليك ", en: "Massage" },
    { icon: Pin, ar: "عسل طبيعي", en: "Natural Honey" },
    { icon: Flower2, ar: "تربية النحل", en: "Beekeeping" },
];

export function HomeHero({ locale, isStaff }: { locale: Locale; isStaff: boolean }) {
    const isArabic = locale === "ar";
    const ArrowOut = isArabic ? ArrowUpLeft : ArrowUpRight;

    return (
        <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:flex lg:h-[calc(100svh-4.3rem)] lg:min-h-[32rem] lg:flex-col lg:px-8 lg:pb-3">
            <div className="surface-card overflow-hidden p-2 sm:p-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                {/* Gradient panel */}
                <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#e9e1cc] via-[#f1ebdb] to-[#faf7ef] px-5 py-7 sm:px-10 sm:py-10 lg:min-h-0 lg:flex-1 lg:px-14 short:lg:py-7 shorter:lg:py-5">
                    <div aria-hidden="true" className="pointer-events-none absolute -top-24 end-[-10%] h-96 w-96 rounded-full bg-honey-300/25 blur-3xl" />

                    <div className="relative grid items-center gap-10 lg:h-full lg:grid-cols-[1.05fr_0.95fr]">
                        {/* Copy */}
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-honey-300">
                                        <Leaf size={20} aria-hidden="true" />
                                    </span>
                                    <div className="leading-tight">
                                        <p className="font-semibold text-emerald-950">{isArabic ? "معالج تقليدي " : "Traditional healer"}</p>
                                        <p className="text-sm text-slate-600">
                                            {isArabic ? "تعرّف على " : "Meet "}
                                            <a href="#healer" className="font-semibold text-emerald-900 underline underline-offset-4">{isArabic ? "علي أخضر" : "Ali Akhdar"}</a>
                                        </p>
                                    </div>
                                </div>
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-honey-300 to-honey-500 shadow-lg shadow-emerald-950/20 ring-4 ring-card sm:h-20 sm:w-20 lg:hidden">
                                    <Image
                                        src={therapistPortrait}
                                        alt={isArabic ? "المعالج علي أخضر" : "Healer Ali Akhdar"}
                                        fill
                                        priority
                                        sizes="(min-width: 640px) 5rem, 4rem"
                                        className="object-cover object-center"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex items-end justify-between gap-4 sm:mt-7 lg:block short:lg:mt-5">
                                <h1 className="min-w-0 font-display text-[clamp(3rem,15vw,4.5rem)] font-semibold leading-[0.85] tracking-tight text-emerald-950 sm:text-[7rem] lg:text-[clamp(4.5rem,15vh,9.5rem)]">
                                    {/* The brand name stays left-to-right in Arabic so the "+" keeps its place. */}
                                    <span dir="ltr" className="whitespace-nowrap">
                                        Ali Akhdar
                                        <sup className="ms-1 align-super text-[0.45em] font-medium text-honey-500">+</sup>
                                    </span>
                                </h1>
                            </div>

                            <div className="mt-5 border-t border-emerald-950/15 pt-5 sm:mt-7 short:lg:mt-5 short:lg:pt-4">
                                <p className="max-w-lg text-base leading-7 text-slate-700 sm:text-xl sm:leading-9 short:lg:text-lg short:lg:leading-8">
                                    {isArabic
                                        ? "استعادة التوازن الطبيعي."
                                        : "Restore your balance."}
                                </p>

                                <div className="mt-5 hidden flex-wrap items-center gap-x-5 gap-y-3 border-b border-emerald-950/15 pb-5 text-sm sm:flex shorter:lg:hidden">
                                    <div className="flex items-center gap-3">
                                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-card">
                                            <Image src={therapistPortrait} alt="" fill sizes="40px" className="object-cover" />
                                        </span>
                                        <span className="leading-tight text-slate-700">
                                            <span className="block font-medium text-emerald-950">{isArabic ? "علاج بلمسة طبيعية" : "Healing, the natural way"}</span>
                                            {isArabic ? "بدون آثار جانبية" : "No harsh side effects"}
                                        </span>
                                    </div>
                                    <span aria-hidden="true" className="hidden text-slate-300 sm:inline">/</span>
                                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-950">
                                        <Droplet size={15} aria-hidden="true" className="text-honey-500" />
                                        {isArabic ? "عسل طبيعي ١٠٠٪" : "100% raw honey"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7 short:lg:mt-5">
                                {!isStaff ? (
                                    <Link href="/book" className="inline-flex items-center rounded-full bg-emerald-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:px-7 sm:py-4">
                                        {isArabic ? "احجز جلسة" : "Book a session"}
                                        <span className="ms-1.5 hidden font-normal text-emerald-100/70 sm:inline">{isArabic ? "— بسهولة" : "— it's quick"}</span>
                                    </Link>
                                ) : null}
                                <Link href="/treatments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-950 underline underline-offset-4 hover:text-emerald-700">
                                    {isArabic ? "علاجاتنا" : "Our treatments"}
                                    <ArrowOut size={16} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>

                        {/* Visual */}
                        <div className="relative mx-auto hidden aspect-[3/4] overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-honey-300 to-honey-500 shadow-2xl shadow-emerald-950/20 lg:block lg:h-full lg:max-h-[36rem]">
                            <Image
                                src={therapistPoster}
                                alt={isArabic ? "المعالج علي أخضر في العيادة" : "Healer Ali Akhdar in the clinic"}
                                fill
                                priority
                                sizes="(min-width: 1024px) 27rem, 0px"
                                className="origin-[100%_30%] scale-[1.3] object-cover object-right"
                            />
                        </div>
                    </div>
                </div>

                {/* Therapy strip, styled like a logo row */}
                <ul className="grid shrink-0 grid-cols-2 gap-y-3 px-4 py-4 sm:gap-y-5 sm:px-8 sm:py-6 md:grid-cols-4 short:lg:py-4">
                    {therapies.map(({ icon: Icon, ar, en }) => (
                        <li key={en} className="flex items-center gap-2 text-emerald-950/80 md:justify-center md:gap-2.5">
                            <Icon size={20} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                            <span className="font-display text-base font-semibold leading-tight sm:text-2xl short:lg:text-xl">{isArabic ? ar : en}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
