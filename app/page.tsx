"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2, Droplet, FlaskRound, Flower2, Hand, Pin } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ProductCard } from "@/components/catalog/product-card";
import { TreatmentCard } from "@/components/catalog/treatment-card";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CardSkeletons, EmptyState, SectionShell } from "@/components/ui/section-shell";
import therapistPoster from "../about us.jpeg";
import therapistPortrait from "../ali akhdar .png";

export default function HomePage() {
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingWhatsAppUrl, setBookingWhatsAppUrl] = useState("");
  const { locale } = useLocale();
  const { user } = useAuth();
  const { products, treatments, isLoaded } = useClinicData();
  const isStaff = user?.role === "admin" || user?.role === "receptionist";
  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const activeTreatments = treatments.filter((treatment) => treatment.active !== false);
  const activeProducts = products.filter((product) => product.active);

  useEffect(() => {
    if (window.sessionStorage.getItem("greens-healing-booking-confirmed") === "1") {
      window.sessionStorage.removeItem("greens-healing-booking-confirmed");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Consume one-shot navigation state after hydration.
      setBookingConfirmed(true);
    }
    const whatsappUrl = window.sessionStorage.getItem("greens-healing-booking-whatsapp-url");
    if (whatsappUrl) {
      window.sessionStorage.removeItem("greens-healing-booking-whatsapp-url");
      setBookingWhatsAppUrl(whatsappUrl);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "receptionist") {
      const confirmation = window.sessionStorage.getItem("greens-healing-booking-confirmed");
      if (confirmation === "1") window.sessionStorage.removeItem("greens-healing-booking-confirmed");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hide patient-only confirmation from staff.
      setBookingConfirmed(false);
    }
  }, [user?.role]);

  const therapies = [
    { icon: FlaskRound, ar: "العلاج بالحجامة", en: "Cupping therapy" },
    { icon: Hand, ar: "التدليك الصيني", en: "Chinese massage" },
    { icon: Pin, ar: "العلاج بالإبر الجافة", en: "Dry needling" },
    { icon: Flower2, ar: "الشفاء الشامل", en: "Holistic healing" },
  ];

  return (
    <div>
      {bookingConfirmed ? (
        <div role="status" className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">{isArabic ? "تم حفظ طلب الموعد. أرسله عبر واتساب إلى العيادة للموافقة." : "Your appointment request is saved. Send it to the clinic on WhatsApp for approval."}</p>
              {bookingWhatsAppUrl ? <a href={bookingWhatsAppUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold underline underline-offset-4">{isArabic ? "فتح واتساب لإرسال الطلب" : "Open WhatsApp to send the request"}</a> : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 start-1/2 h-[480px] w-[480px] rounded-full bg-honey-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16 lg:px-8">
          <div>
            <p className="eyebrow">{isArabic ? "علاج تقليدي · عسل طبيعي" : "Traditional healing · Natural honey"}</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] text-emerald-950 sm:text-6xl lg:text-7xl">
              {isArabic ? "شفاءٌ طبيعي بجذورٍ تقليدية" : <>Natural healing, <span className="italic text-emerald-700">rooted</span> in tradition</>}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              {isArabic
                ? "حجامة وتدليك صيني وإبر جافة وجلسات شفاء شاملة مع المعالج علي أخضر، إلى جانب عسل ومنتجات طبيعية من خلايانا."
                : "Cupping, Chinese massage, dry needling and holistic sessions with healer Ali Akhdar, alongside raw honey and natural products from our own hives."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {!isStaff ? (
                <Link href="/book" className="btn-primary px-7 py-3.5 text-base">
                  {isArabic ? "احجز جلستك" : "Book your session"}
                  <Arrow size={18} aria-hidden="true" />
                </Link>
              ) : null}
              <Link href="/treatments" className="btn-secondary px-7 py-3.5 text-base">
                {isArabic ? "استكشف العلاجات" : "Explore treatments"}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] border-[6px] border-card shadow-2xl shadow-emerald-950/15">
              <Image
                src={therapistPoster}
                alt={isArabic ? "المعالج علي أخضر في العيادة" : "Healer Ali Akhdar in the clinic"}
                fill
                priority
                sizes="(min-width: 768px) 28rem, 90vw"
                className="origin-[100%_30%] scale-[1.75] object-cover object-right"
              />
            </div>
            <div className="surface-card absolute -bottom-6 start-0 flex items-center gap-3 px-4 py-3 sm:-start-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-honey-50 text-honey-700">
                <Droplet size={20} aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-emerald-950">{isArabic ? "عسل من خلايانا" : "Honey from our hives"}</p>
                <p className="text-xs text-slate-500">{isArabic ? "طبيعي ونقي ١٠٠٪" : "100% raw & natural"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Therapy strip */}
        <div className="border-y border-clinic-border bg-card/70">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {therapies.map(({ icon: Icon, ar, en }) => (
              <li key={en} className="flex items-center gap-3 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-emerald-950">{isArabic ? ar : en}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Treatments */}
      <SectionShell
        eyebrow={isArabic ? "علاجاتنا" : "Our therapies"}
        title={isArabic ? "جلسات للجسد والروح" : "Sessions for body and mind"}
        description={isArabic ? "كل جلسة مصممة لتعيد التوازن وتخفف التوتر وتدعم قدرة الجسم على الشفاء." : "Each session is designed to restore balance, ease tension, and support the body's own ability to heal."}
        action={activeTreatments.length > 3 ? (
          <Link href="/treatments" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            {isArabic ? "كل العلاجات" : "All treatments"}
            <Arrow size={16} aria-hidden="true" />
          </Link>
        ) : null}
      >
        {!isLoaded ? <CardSkeletons count={3} /> : activeTreatments.length === 0 ? (
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
      <section className="bg-emerald-950 text-emerald-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] ring-1 ring-white/10">
            <Image src={therapistPortrait} alt={isArabic ? "صورة علي أخضر" : "Portrait of Ali Akhdar"} fill sizes="(min-width: 768px) 24rem, 90vw" className="object-cover" />
          </div>
          <div>
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
          {!isLoaded ? <CardSkeletons count={4} /> : activeProducts.length === 0 ? (
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
