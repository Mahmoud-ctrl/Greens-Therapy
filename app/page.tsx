"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { SectionShell } from "@/components/ui/section-shell";
import therapistPoster from "../about us.jpeg";

export default function HomePage() {
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingWhatsAppUrl, setBookingWhatsAppUrl] = useState("");
  const { locale } = useLocale();
  const { user } = useAuth();
  const { products, treatments } = useClinicData();
  const isStaff = user?.role === "admin" || user?.role === "receptionist";
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

  const content = {
    ar: {
      headline: "Greens Healing Therapy",
      subheadline: "العناية الطبيعية والراحة الكاملة",
      description: "تابع العلاجات والمنتجات التي تضيفها العيادة واحجز عند توفر المواعيد.",
      primary: "احجز موعدك",
      secondary: "استكشف العلاجات",
      treatments: "العلاجات المميزة",
      products: "منتجات طبيعية",
    },
    en: {
      headline: "Greens Healing Therapy",
      subheadline: "Natural Healing & Wellness",
      description: "Browse clinic-listed treatments and products, and check for appointment availability.",
      primary: "Book your appointment",
      secondary: "Explore treatments",
      treatments: "Featured treatments",
      products: "Natural products",
    },
  }[locale];

  return (
    <div className="bg-white">
      {bookingConfirmed ? <div role="status" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"><div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"><p>{locale === "ar" ? "تم حفظ طلب الموعد. أرسله عبر واتساب إلى العيادة للموافقة." : "Your appointment request is saved. Send it to the clinic on WhatsApp for approval."}</p>{bookingWhatsAppUrl ? <a href={bookingWhatsAppUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold underline">{locale === "ar" ? "فتح واتساب لإرسال الطلب" : "Open WhatsApp to send the request"}</a> : null}</div></div> : null}
      <section className="border-b border-clinic-border bg-[#eef7f3]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid items-center gap-10">
            <div>
              <div className="inline-flex rounded-full border border-emerald-700/20 bg-emerald-50 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-emerald-800 uppercase">
                {locale === "ar" ? "العلاجات والمنتجات" : "Treatments and products"}
              </div>
              <h1 className="mt-5 text-4xl font-bold text-emerald-950 sm:text-5xl lg:text-6xl">
                {content.headline}
              </h1>
              <p className="mt-3 text-lg font-semibold text-emerald-800">{content.subheadline}</p>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{content.description}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                {!isStaff ? <Link href="/book" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">
                  {content.primary}
                </Link> : null}
                <Link href="/treatments" className="rounded-lg border border-clinic-border bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700">
                  {content.secondary}
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      <SectionShell eyebrow={locale === "ar" ? "علاجاتنا" : "Our therapies"} title={content.treatments}>
        {treatments.length === 0 ? <p className="border-t border-slate-200 py-8 text-sm text-slate-500">{locale === "ar" ? "لم تتم إضافة علاجات بعد." : "No treatments have been added yet."}</p> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {treatments.slice(0, 3).map((treatment) => (
            <div key={treatment.id} className="rounded-xl border border-clinic-border bg-white p-5">
              {treatment.image ? <img src={treatment.image} alt={locale === "ar" ? treatment.arName : treatment.enName} className="mb-5 h-40 w-full rounded-xl object-cover" /> : null}
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {treatment.category}
                </span>
                <span className="text-lg font-bold text-emerald-950">${treatment.price}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {locale === "ar" ? treatment.arName : treatment.enName}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {locale === "ar" ? treatment.arDescription : treatment.enDescription}
              </p>
              <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                <span>{locale === "ar" ? `${treatment.duration} دقيقة` : `${treatment.duration} min`}</span>
                {!isStaff ? <Link href="/book" className="font-semibold text-emerald-700">
                  {locale === "ar" ? "احجز الآن" : "Book now"}
                </Link> : null}
              </div>
            </div>
          ))}
        </div>}
      </SectionShell>

      <SectionShell eyebrow={locale === "ar" ? "منتجات طبيعية" : "Natural products"} title={content.products}>
        {activeProducts.length === 0 ? <p className="border-t border-slate-200 py-8 text-sm text-slate-500">{locale === "ar" ? "لم تتم إضافة منتجات بعد." : "No products have been added yet."}</p> : <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {activeProducts.slice(0, 4).map((product) => (
            <div key={product.id} className="rounded-xl border border-clinic-border bg-white p-4">
              <div className="mb-4 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#edf9ef] to-[#f5ebd2] text-4xl">
                {product.image ? <img src={product.image} alt={locale === "ar" ? product.arName : product.enName} className="h-full w-full object-cover" /> : "🍯"}
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{product.category}</span>
                <span>{product.weight}</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {locale === "ar" ? product.arName : product.enName}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-950">${product.price}</span>
                <span className="text-sm text-slate-500">{product.weight}</span>
              </div>
            </div>
          ))}
        </div>}
      </SectionShell>

      <section className="border-t border-clinic-border bg-[#f5f5ed] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-7 sm:grid-cols-[200px_1fr] sm:gap-10">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-md border-4 border-white shadow-sm">
            <Image
              src={therapistPoster}
              alt={locale === "ar" ? "صورة علي أخضر" : "Portrait of Ali Akhdar"}
              sizes="200px"
              className="absolute right-0 top-0 h-auto w-[200%] max-w-none"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {locale === "ar" ? "المعالج التقليدي" : "Traditional healer"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-950">ALI AKHDAR</h2>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-emerald-800">
              {(locale === "ar"
                ? ["العلاج بالحجامة", "العلاج بالتدليك", "العلاج بالإبر الجافة", "الشفاء الشامل"]
                : ["Cupping therapy", "Massage therapy", "Dry needling therapy", "Holistic healing"]
              ).map((service) => <li key={service}>{service}</li>)}
            </ul>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
              <p>{locale === "ar"
                ? "علي أخضر ممارس للعلاج التقليدي شغوف بالعافية الطبيعية والعلاجات التقليدية. وهو أيضاً مسعف ومدرب غوص تقني ومربٍ للنحل ومزارع، ويكنّ حباً عميقاً للطبيعة والبيئة."
                : "Ali Akhdar is a traditional healing practitioner passionate about natural wellness and traditional therapies. He is also a medic, technical diving instructor, beekeeper, and agriculturalist with a deep love for nature and the environment."}</p>
              <p>{locale === "ar"
                ? "إلى جانب العلاج، ينتج العسل الطبيعي ويقدم منتجات مختارة من خيرات خلايا النحل، تعبيراً عن تقديره للطبيعة وما تمنحه."
                : "Beyond healing, he produces natural honey and offers selected hive products, reflecting his appreciation for nature and its many gifts."}</p>
              <p>{locale === "ar"
                ? "مهمته تعزيز ممارسات العلاج التقليدي والمنتجات الطبيعية ونهج متوازن للعافية يستلهمه من الطبيعة."
                : "His mission is to promote traditional healing practices, natural products, and a balanced approach to well-being inspired by nature."}</p>
            </div>
            <p className="mt-4 font-semibold text-emerald-900">
              {locale === "ar" ? "علي أخضر: العلاج التقليدي والحياة الطبيعية." : "ALI AKHDAR – Traditional Healing & Natural Living."}
            </p>
          </div>
        </div>
      </section>
    </div >
  );
}
