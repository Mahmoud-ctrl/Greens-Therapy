"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ProductCard } from "@/components/catalog/product-card";
import { TreatmentCard } from "@/components/catalog/treatment-card";
import { HomeHero, therapies } from "@/components/home/hero";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CardSkeletons, EmptyState, SectionShell } from "@/components/ui/section-shell";

export default function HomePage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { products, treatments, isLoaded } = useClinicData();
  const isStaff = user?.role === "admin" || user?.role === "receptionist";
  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const activeTreatments = treatments.filter((treatment) => treatment.active !== false);
  const activeProducts = products.filter((product) => product.active);


  return (
    <div>
      <HomeHero locale={locale} isStaff={isStaff} />

      {/* Treatments */}
      <SectionShell
        eyebrow={isArabic ? "علاجاتنا" : "Our therapies"}
        title={isArabic ? "خدماتنا" : "Our services"}
        description={isArabic ? "كل جلسة مصممة لتعيد التوازن وتخفف التوتر وتدعم قدرة الجسم على الشفاء." : "Each session is designed to restore balance, ease tension, and support the body's own ability to heal."}
        action={activeTreatments.length > 3 ? (
          <Link href="/treatments" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            {isArabic ? "كل العلاجات" : "All treatments"}
            <Arrow size={16} aria-hidden="true" />
          </Link>
        ) : null}
      >
        {!isLoaded ? <CardSkeletons count={3} variant="treatment" label={isArabic ? "جارٍ تحميل العلاجات..." : "Loading treatments..."} /> : activeTreatments.length === 0 ? (
          <EmptyState title={isArabic ? "العلاجات قادمة قريباً" : "Treatments coming soon"} description={isArabic ? "تواصل معنا عبر واتساب لمعرفة المزيد." : "Reach out on WhatsApp to learn more."} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeTreatments.slice(0, 3).map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} locale={locale} showBooking={!isStaff} />
            ))}
          </div>
        )}
      </SectionShell>

      {/* Meet the healer */}
      <section id="healer" className="scroll-mt-24 bg-emerald-950 text-emerald-50">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow text-honey-300">{isArabic ? "المعالج التقليدي" : "Traditional healer"}</p>
            <h2 className="mt-4 text-5xl font-semibold text-white sm:text-6xl">{isArabic ? "علي أخضر" : "Ali Akhdar"}</h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-emerald-100/85">
              <p>{isArabic
                ? "علي أخضر حاصل على شهادات في العلاج بالحجامة والتدليك الصيني والعلاج بالإبر الجافة. وهو أيضاً مسعف متقدم ومدرب غوص تقني ومربٍ للنحل ومزارع، ويكنّ حباً عميقاً للطبيعة."
                : "Ali Akhdar is certified in cupping therapy, Chinese massage therapy, and dry needling. He is also an advanced medic, technical diving instructor, beekeeper, and agriculturalist with a deep love for nature."}</p>
              <p>{isArabic
                ? "يطمح إلى مساعدة أكبر عدد ممكن من الناس على الشفاء بطرق طبيعية، وينتج العسل ومنتجات خلايا النحل تعبيراً عن تقديره لما تمنحه الطبيعة."
                : "He aspires to help as many people as possible heal naturally, and produces honey and hive products as an expression of his appreciation for nature's gifts."}</p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {therapies.map(({ ar, en }) => (
                <li key={en} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-emerald-50">{isArabic ? ar : en}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Products */}
      <div className="bg-honey-50/60">
        <SectionShell
          eyebrow={isArabic ? "من خلايانا" : "From our hives"}
          title={isArabic ? "عسل ومنتجات طبيعية" : "Honey & natural products"}
          action={activeProducts.length > 0 ? (
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
              {isArabic ? "تسوق الكل" : "Shop all"}
              <Arrow size={16} aria-hidden="true" />
            </Link>
          ) : null}
        >
          {!isLoaded ? <CardSkeletons count={4} variant="product" label={isArabic ? "جارٍ تحميل المنتجات..." : "Loading products..."} /> : activeProducts.length === 0 ? (
            <EmptyState title={isArabic ? "المنتجات قادمة قريباً" : "Products coming soon"} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} showCart={!isStaff} />
              ))}
            </div>
          )}
        </SectionShell>
      </div>

      {/* Closing CTA */}
      {!isStaff ? (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-emerald-800 px-6 py-14 text-center sm:px-12">
            <div aria-hidden="true" className="absolute -end-16 -top-16 h-56 w-56 rounded-full bg-honey-500/25 blur-2xl" />
            <h2 className="relative text-4xl font-semibold text-white sm:text-5xl">{isArabic ? "خذ خطوتك الأولى نحو التوازن" : "Take your first step toward balance"}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-emerald-100/85">{isArabic ? "اختر العلاج والموعد المناسب، وسنؤكد حجزك عبر واتساب." : "Choose your treatment and time, and we'll confirm your booking on WhatsApp."}</p>
            <Link href="/book" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-honey-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-honey-700">
              {isArabic ? "احجز الآن" : "Book now"}
              <Arrow size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
