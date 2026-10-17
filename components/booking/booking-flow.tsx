"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { clinicWhatsAppNumber } from "@/lib/clinic-contact";
import { formatCurrency, formatDuration } from "@/lib/i18n";
import { LoadingButton } from "@/components/ui/loading-button";
import { BookingSkeleton, LoadingRegion, Skeleton } from "@/components/ui/skeleton";

function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function BookingFlow() {
    const router = useRouter();
    const { locale } = useLocale();
    const { user, updateProfile } = useAuth();
    const { treatments, clinicHours, isLoaded, isAppointmentSlotAvailable, getBookedAppointmentSlots, bookAppointment } = useClinicData();
    const isArabic = locale === "ar";
    const [treatmentId, setTreatmentId] = useState("");
    const [requestedDate, setRequestedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [phone, setPhone] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<{ date: string; slots: Array<{ startTime: string; endTime: string }> } | null>(null);
    const phoneValue = phone ?? user?.phone ?? "";
    const treatment = treatments.find((item) => item.id === treatmentId) ?? treatments[0];

    const dates = useMemo(() => {
        if (!clinicHours || clinicHours.slotInterval < 1) return [];
        const today = new Date();
        const availableDates: Array<{ value: string; label: string; weekday: string; day: string }> = [];
        for (let offset = 0; offset < 30; offset += 1) {
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12);
            if (!clinicHours.workingDays.includes(date.getDay())) continue;
            const value = dateKey(date);
            const hasOpenTime = treatment && (() => {
                const opening = timeToMinutes(clinicHours.startTime);
                const closing = timeToMinutes(clinicHours.endTime);
                for (let minute = opening; minute + treatment.duration <= closing; minute += clinicHours.slotInterval) {
                    const start = minutesToTime(minute);
                    if (value === dateKey(today) && minute <= today.getHours() * 60 + today.getMinutes()) continue;
                    if (isAppointmentSlotAvailable(value, start, minutesToTime(minute + treatment.duration))) return true;
                }
                return false;
            })();
            if (!treatment || hasOpenTime) {
                availableDates.push({
                    value,
                    label: new Intl.DateTimeFormat(isArabic ? "ar" : "en", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                    }).format(date),
                    weekday: new Intl.DateTimeFormat(isArabic ? "ar" : "en", { weekday: "short" }).format(date),
                    day: new Intl.DateTimeFormat(isArabic ? "ar" : "en", { day: "numeric", month: "short" }).format(date),
                });
            }
        }
        return availableDates;
    }, [clinicHours, isAppointmentSlotAvailable, isArabic, treatment]);

    const selectedDate = dates.some((date) => date.value === requestedDate)
        ? requestedDate
        : dates[0]?.value ?? "";

    useEffect(() => {
        if (!selectedDate) return;
        let mounted = true;
        void getBookedAppointmentSlots(selectedDate).then((slotsForDate) => {
            if (mounted) setBookedSlots({ date: selectedDate, slots: slotsForDate });
        }).catch((cause: unknown) => {
            if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load appointment availability.");
        });
        return () => {
            mounted = false;
        };
    }, [getBookedAppointmentSlots, selectedDate]);

    const slots = useMemo(() => {
        if (!clinicHours || clinicHours.slotInterval < 1 || !treatment || !selectedDate) return [];
        const bookedSlotsForDate = bookedSlots?.date === selectedDate ? bookedSlots.slots : [];
        const slotsForDate: Array<{ time: string; available: boolean }> = [];
        const opening = timeToMinutes(clinicHours.startTime);
        const closing = timeToMinutes(clinicHours.endTime);
        const now = new Date();
        for (let minute = opening; minute + treatment.duration <= closing; minute += clinicHours.slotInterval) {
            if (selectedDate === dateKey(now) && minute <= now.getHours() * 60 + now.getMinutes()) continue;
            const time = minutesToTime(minute);
            slotsForDate.push({
                time,
                available: isAppointmentSlotAvailable(selectedDate, time, minutesToTime(minute + treatment.duration))
                    && !bookedSlotsForDate.some((booked) => minute < timeToMinutes(booked.endTime)
                        && minute + treatment.duration > timeToMinutes(booked.startTime)),
            });
        }
        return slotsForDate;
    }, [bookedSlots, clinicHours, isAppointmentSlotAvailable, selectedDate, treatment]);

    const confirmBooking = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !treatment || !selectedDate || !selectedTime || !phoneValue.trim()) {
            setError(isArabic ? "أكمل بيانات الحجز واختر موعداً متاحاً." : "Complete your details and select an available time.");
            return;
        }
        const endTime = minutesToTime(timeToMinutes(selectedTime) + treatment.duration);
        setIsSubmitting(true);
        try {
            if (phoneValue.trim() !== (user.phone ?? "")) {
                await updateProfile({ name: user.name, email: user.email, phone: phoneValue.trim() });
            }
            const booked = await bookAppointment({
                treatmentId: treatment.id,
                date: selectedDate,
                startTime: selectedTime,
                endTime,
            });
            if (!booked) {
                setError(isArabic ? "هذا الموعد لم يعد متاحاً. اختر وقتاً آخر." : "That time was just booked. Please choose another slot.");
                setSelectedTime("");
                setIsSubmitting(false);
                return;
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (isArabic ? "تعذر حجز الموعد." : "Unable to book the appointment."));
            setSelectedTime("");
            setIsSubmitting(false);
            return;
        }
        const whatsappMessage = [
            isArabic ? "طلب موعد جديد إلى Greens Healing Therapy" : "New appointment request for Greens Healing Therapy",
            `${isArabic ? "الاسم" : "Name"}: ${user.name}`,
            `${isArabic ? "البريد الإلكتروني" : "Email"}: ${user.email}`,
            `${isArabic ? "الهاتف" : "Phone"}: ${phoneValue.trim()}`,
            `${isArabic ? "العلاج" : "Treatment"}: ${isArabic ? treatment.arName : treatment.enName}`,
            `${isArabic ? "التاريخ" : "Date"}: ${selectedDate}`,
            `${isArabic ? "الوقت" : "Time"}: ${selectedTime} - ${endTime}`,
            isArabic ? "الحالة: بانتظار موافقة العيادة" : "Status: Pending clinic approval",
        ].join("\n");
        const whatsappUrl = `https://wa.me/${clinicWhatsAppNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        window.sessionStorage.setItem("greens-healing-booking-confirmed", "1");
        window.sessionStorage.setItem("greens-healing-booking-whatsapp-url", whatsappUrl);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        router.push("/my-bookings");
    };

    if (!isLoaded) {
        return <LoadingRegion label={isArabic ? "جارٍ تحميل المواعيد المتاحة..." : "Loading available times..."}><BookingSkeleton /></LoadingRegion>;
    }

    if (!clinicHours) {
        return (
            <div className="surface-card mx-auto max-w-xl p-8 text-center">
                <CalendarDays className="mx-auto text-emerald-700" size={32} strokeWidth={1.5} aria-hidden="true" />
                <h2 className="mt-4 text-3xl font-semibold text-emerald-950">{isArabic ? "ساعات الحجز غير محددة بعد" : "Booking hours are not set yet"}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{isArabic ? "ستظهر المواعيد هنا بعد أن تحدد العيادة أيام وساعات العمل." : "Available appointment times will appear here after the clinic sets its working days and hours."}</p>
            </div>
        );
    }

    if (treatments.length === 0) {
        return <div className="surface-card mx-auto max-w-xl p-8 text-center text-sm text-slate-600">{isArabic ? "لا توجد علاجات متاحة للحجز حالياً." : "There are no treatments available to book."}</div>;
    }

    return (
        <form onSubmit={confirmBooking} className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-10">
                <fieldset className="min-w-0">
                    <legend className="flex items-center gap-3 text-lg font-semibold text-emerald-950">
                        <StepNumber value={1} />
                        {isArabic ? "اختر العلاج" : "Choose a treatment"}
                    </legend>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {treatments.map((item) => {
                            const selected = item.id === treatment?.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => { setTreatmentId(item.id); setSelectedTime(""); setError(""); }}
                                    className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-start transition ${selected ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700" : "border-clinic-border bg-card hover:border-emerald-500"}`}
                                >
                                    <span>
                                        <span className="block font-semibold text-emerald-950">{isArabic ? item.arName : item.enName}</span>
                                        <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                            <Clock size={14} aria-hidden="true" />
                                            {formatDuration(item.duration, locale)}
                                        </span>
                                    </span>
                                    <span className="font-semibold text-emerald-800">{formatCurrency(item.price, locale)}</span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset className="min-w-0">
                    <legend className="flex items-center gap-3 text-lg font-semibold text-emerald-950">
                        <StepNumber value={2} />
                        {isArabic ? "اختر اليوم" : "Pick a day"}
                    </legend>
                    {dates.length === 0 ? (
                        <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">{isArabic ? "لا توجد أيام متاحة خلال الثلاثين يوماً القادمة." : "No available days in the next 30 days."}</p>
                    ) : (
                        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                            {dates.map((date) => {
                                const selected = selectedDate === date.value;
                                return (
                                    <button
                                        key={date.value}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => { setRequestedDate(date.value); setSelectedTime(""); setError(""); }}
                                        className={`flex min-w-20 shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition ${selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-card text-slate-700 hover:border-emerald-500"}`}
                                    >
                                        <span className={`text-xs ${selected ? "text-emerald-100" : "text-slate-500"}`}>{date.weekday}</span>
                                        <span className="mt-0.5 text-sm font-semibold">{date.day}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </fieldset>

                <fieldset className="min-w-0">
                    <legend className="flex items-center gap-3 text-lg font-semibold text-emerald-950">
                        <StepNumber value={3} />
                        {isArabic ? "اختر الوقت" : "Pick a time"}
                    </legend>
                    {selectedDate && bookedSlots?.date !== selectedDate && !error ? (
                        <LoadingRegion label={isArabic ? "جارٍ تحميل الأوقات..." : "Loading times..."} className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-11 rounded-xl" />)}
                        </LoadingRegion>
                    ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {slots.map((slot) => (
                            <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                aria-pressed={selectedTime === slot.time}
                                onClick={() => { setSelectedTime(slot.time); setError(""); }}
                                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold tabular-nums transition ${!slot.available ? "cursor-not-allowed border-transparent bg-slate-100 text-slate-400 line-through" : selectedTime === slot.time ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-card text-emerald-900 hover:border-emerald-500"}`}
                            >
                                <span dir="ltr">{slot.time}</span>
                            </button>
                        ))}
                    </div>
                    )}
                    {slots.length === 0 && selectedDate && bookedSlots?.date === selectedDate ? <p className="mt-4 text-sm text-slate-500">{isArabic ? "لا توجد أوقات متاحة لهذا اليوم." : "No available times for this day."}</p> : null}
                </fieldset>

                <fieldset className="min-w-0">
                    <legend className="flex items-center gap-3 text-lg font-semibold text-emerald-950">
                        <StepNumber value={4} />
                        {isArabic ? "رقم التواصل" : "Your phone number"}
                    </legend>
                    <input
                        required
                        type="tel"
                        autoComplete="tel"
                        dir="ltr"
                        value={phoneValue}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+961 …"
                        aria-label={isArabic ? "رقم الهاتف" : "Phone number"}
                        className="field mt-4 max-w-sm text-start"
                    />
                </fieldset>
            </div>

            <aside className="surface-card h-fit p-6 lg:sticky lg:top-24">
                <h2 className="text-2xl font-semibold text-emerald-950">{isArabic ? "ملخص الموعد" : "Your appointment"}</h2>
                <dl className="mt-5 space-y-4 text-sm">
                    <SummaryRow label={isArabic ? "العلاج" : "Treatment"} value={isArabic ? treatment?.arName : treatment?.enName} />
                    <SummaryRow label={isArabic ? "المدة" : "Duration"} value={treatment ? formatDuration(treatment.duration, locale) : undefined} />
                    <SummaryRow label={isArabic ? "التاريخ" : "Date"} value={dates.find((date) => date.value === selectedDate)?.label} />
                    <SummaryRow label={isArabic ? "الوقت" : "Time"} value={selectedTime ? <span dir="ltr">{selectedTime}</span> : undefined} />
                </dl>
                <div className="mt-5 flex items-baseline justify-between border-t border-clinic-border pt-4">
                    <span className="text-sm text-slate-500">{isArabic ? "السعر" : "Price"}</span>
                    <span className="text-2xl font-semibold text-emerald-900">{treatment ? formatCurrency(treatment.price, locale) : "—"}</span>
                </div>
                {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
                <LoadingButton type="submit" pending={isSubmitting} disabled={!selectedDate || !selectedTime || !phoneValue.trim()} className="btn-primary mt-5 w-full py-3.5 text-base">
                    {isSubmitting ? (isArabic ? "جارٍ الحجز..." : "Booking...") : (isArabic ? "تأكيد الحجز" : "Confirm booking")}
                </LoadingButton>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">{isArabic ? "سيتم إرسال طلبك إلى العيادة عبر واتساب للموافقة." : "Your request is sent to the clinic on WhatsApp for approval."}</p>
            </aside>
        </form>
    );
}

function StepNumber({ value }: { value: number }) {
    return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-honey-100 text-sm font-semibold text-honey-700">{value}</span>;
}

function SummaryRow({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-end font-medium text-slate-900">{value || "—"}</dd>
        </div>
    );
}
