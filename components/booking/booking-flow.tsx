"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";

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
    const { user } = useAuth();
    const { treatments, clinicHours, isAppointmentSlotAvailable, bookAppointment } = useClinicData();
    const isArabic = locale === "ar";
    const [treatmentId, setTreatmentId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [error, setError] = useState("");
    const treatment = treatments.find((item) => item.id === treatmentId) ?? treatments[0];

    useEffect(() => {
        if (user?.phone) setPhone(user.phone);
    }, [user?.phone]);

    const dates = useMemo(() => {
        if (!clinicHours || clinicHours.slotInterval < 1) return [];
        const today = new Date();
        const availableDates: Array<{ value: string; label: string }> = [];
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
                });
            }
        }
        return availableDates;
    }, [clinicHours, isAppointmentSlotAvailable, isArabic, treatment]);

    useEffect(() => {
        if (dates.length && !dates.some((date) => date.value === selectedDate)) {
            setSelectedDate(dates[0].value);
            setSelectedTime("");
        }
        if (!dates.length) {
            setSelectedDate("");
            setSelectedTime("");
        }
    }, [dates, selectedDate]);

    const slots = useMemo(() => {
        if (!clinicHours || clinicHours.slotInterval < 1 || !treatment || !selectedDate) return [];
        const slotsForDate: Array<{ time: string; available: boolean }> = [];
        const opening = timeToMinutes(clinicHours.startTime);
        const closing = timeToMinutes(clinicHours.endTime);
        const now = new Date();
        for (let minute = opening; minute + treatment.duration <= closing; minute += clinicHours.slotInterval) {
            if (selectedDate === dateKey(now) && minute <= now.getHours() * 60 + now.getMinutes()) continue;
            const time = minutesToTime(minute);
            slotsForDate.push({
                time,
                available: isAppointmentSlotAvailable(selectedDate, time, minutesToTime(minute + treatment.duration)),
            });
        }
        return slotsForDate;
    }, [clinicHours, isAppointmentSlotAvailable, selectedDate, treatment]);

    const confirmBooking = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !treatment || !selectedDate || !selectedTime || !phone.trim()) {
            setError(isArabic ? "أكمل بيانات الحجز واختر موعداً متاحاً." : "Complete your details and select an available time.");
            return;
        }
        const endTime = minutesToTime(timeToMinutes(selectedTime) + treatment.duration);
        const booked = bookAppointment({
            patientName: user.name,
            patientEmail: user.email,
            patientPhone: phone.trim(),
            treatmentId: treatment.id,
            treatmentName: isArabic ? treatment.arName : treatment.enName,
            date: selectedDate,
            startTime: selectedTime,
            endTime,
            status: "Pending",
        });
        if (!booked) {
            setError(isArabic ? "هذا الموعد لم يعد متاحاً. اختر وقتاً آخر." : "That time was just booked. Please choose another slot.");
            setSelectedTime("");
            return;
        }
        window.sessionStorage.setItem("greens-healing-booking-confirmed", "1");
        router.push("/");
    };

    if (!clinicHours) {
        return <div className="mx-auto max-w-xl rounded-xl border border-clinic-border bg-white p-6 text-center"><h2 className="text-lg font-bold text-emerald-950">{isArabic ? "ساعات الحجز غير محددة بعد" : "Booking hours are not set yet"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{isArabic ? "ستظهر المواعيد هنا بعد أن تحدد العيادة أيام وساعات العمل." : "Available appointment times will appear here after the clinic sets its working days and hours."}</p></div>;
    }

    if (treatments.length === 0) {
        return <div className="mx-auto max-w-xl rounded-xl border border-clinic-border bg-white p-6 text-center text-sm text-slate-600">{isArabic ? "لا توجد علاجات متاحة للحجز حالياً." : "There are no treatments available to book."}</div>;
    }

    return (
        <form onSubmit={confirmBooking} className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6 rounded-xl border border-clinic-border bg-white p-5 sm:p-6">
                <label className="block space-y-2 text-sm font-semibold text-slate-800">
                    {isArabic ? "اختر العلاج" : "Choose a treatment"}
                    <select value={treatment?.id ?? ""} onChange={(event) => { setTreatmentId(event.target.value); setSelectedTime(""); setError(""); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                        {treatments.map((item) => <option key={item.id} value={item.id}>{isArabic ? item.arName : item.enName} · {item.duration} {isArabic ? "دقيقة" : "min"} · ${item.price}</option>)}
                    </select>
                </label>

                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-slate-800">{isArabic ? "اختر يوماً متاحاً" : "Choose an available day"}</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {dates.map((date) => <button key={date.value} type="button" onClick={() => { setSelectedDate(date.value); setSelectedTime(""); setError(""); }} className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${selectedDate === date.value ? "border-emerald-700 bg-emerald-50 text-emerald-950" : "border-clinic-border bg-white text-slate-700 hover:border-emerald-500"}`}>{date.label}</button>)}
                    </div>
                    {dates.length === 0 ? <p className="rounded-lg bg-[#eff7f3] p-3 text-sm text-slate-600">{isArabic ? "لا توجد أيام متاحة خلال الثلاثين يوماً القادمة." : "No available days in the next 30 days."}</p> : null}
                </fieldset>

                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-slate-800">{isArabic ? "اختر وقتاً متاحاً" : "Choose an available time"}</legend>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => <button key={slot.time} type="button" disabled={!slot.available} onClick={() => { setSelectedTime(slot.time); setError(""); }} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${!slot.available ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through" : selectedTime === slot.time ? "border-emerald-700 bg-emerald-700 text-white" : "border-clinic-border bg-white text-emerald-900 hover:border-emerald-600"}`}>{slot.time}</button>)}
                    </div>
                    {slots.length === 0 && selectedDate ? <p className="text-sm text-slate-500">{isArabic ? "لا توجد أوقات متاحة لهذا اليوم." : "No available times for this day."}</p> : null}
                </fieldset>

                <label className="block space-y-2 text-sm font-semibold text-slate-800">
                    {isArabic ? "رقم الهاتف للتواصل" : "Phone number"}
                    <input required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                </label>
                {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
                <button type="submit" disabled={!selectedDate || !selectedTime || !phone.trim()} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isArabic ? "تأكيد الحجز" : "Confirm appointment"}</button>
            </div>

            <aside className="h-fit rounded-xl border border-clinic-border bg-[#eff7f3] p-5">
                <h2 className="text-base font-bold text-emerald-950">{isArabic ? "ملخص الموعد" : "Appointment summary"}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                    <div><dt className="text-slate-500">{isArabic ? "العلاج" : "Treatment"}</dt><dd className="font-semibold text-slate-900">{isArabic ? treatment?.arName : treatment?.enName}</dd></div>
                    <div><dt className="text-slate-500">{isArabic ? "المدة" : "Duration"}</dt><dd className="font-semibold text-slate-900">{treatment?.duration} {isArabic ? "دقيقة" : "min"}</dd></div>
                    <div><dt className="text-slate-500">{isArabic ? "التاريخ" : "Date"}</dt><dd className="font-semibold text-slate-900">{selectedDate || "—"}</dd></div>
                    <div><dt className="text-slate-500">{isArabic ? "الوقت" : "Time"}</dt><dd className="font-semibold text-slate-900">{selectedTime || "—"}</dd></div>
                </dl>
                <p className="mt-4 border-t border-emerald-900/10 pt-3 text-xs leading-5 text-slate-600">{isArabic ? "سيتم إرسال طلبك إلى العيادة للموافقة." : "Your appointment request will be sent to the clinic for approval."}</p>
            </aside>
        </form>
    );
}