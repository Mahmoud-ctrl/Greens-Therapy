"use client";

import { useState, type FormEvent } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { ImageUpload } from "@/components/ui/image-upload";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingRegion, PageTitleSkeleton, Skeleton } from "@/components/ui/skeleton";
import type { ClinicHours } from "@/types/clinic";

const weekdayLabels = {
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

function toMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function AdminProfileSettings() {
    const { locale } = useLocale();
    const { user, updateProfile } = useAuth();
    const { clinicLogo, setClinicLogo, clinicHours, setClinicHours, isLoaded } = useClinicData();
    const isArabic = locale === "ar";
    const [profileDraft, setProfileDraft] = useState<{ email: string; phone: string; photoUrl: string } | null>(null);
    const profile = profileDraft ?? {
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        photoUrl: clinicLogo || user?.photoUrl || "",
    };
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [hoursDraft, setHoursDraft] = useState<ClinicHours | null>(null);
    const hours = hoursDraft ?? clinicHours ?? { workingDays: [], startTime: "", endTime: "", slotInterval: 30 };
    const { workingDays, startTime, endTime, slotInterval } = hours;
    const [hoursError, setHoursError] = useState("");
    const [hoursSaved, setHoursSaved] = useState(false);
    const [isSavingHours, setIsSavingHours] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm";

    const updateHours = (patch: Partial<ClinicHours>) => {
        setHoursDraft((current) => ({
            ...(current ?? clinicHours ?? { workingDays: [], startTime: "", endTime: "", slotInterval: 30 }),
            ...patch,
        }));
        setHoursSaved(false);
    };

    const handlePhotoChange = (photoUrl: string) => {
        setProfileDraft((current) => ({
            ...(current ?? { email: user?.email ?? "", phone: user?.phone ?? "", photoUrl: clinicLogo || user?.photoUrl || "" }),
            photoUrl,
        }));
        setError("");
        setSaved(false);
    };

    const saveChanges = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) return;
        const cleanEmail = profile.email.trim();
        const cleanPhone = profile.phone.trim();
        if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            setError(isArabic ? "أدخل بريداً إلكترونياً صالحاً." : "Enter a valid email address.");
            return;
        }
        if (!cleanPhone) {
            setError(isArabic ? "أدخل رقم الهاتف." : "Enter a phone number.");
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateProfile({ name: user.name, email: cleanEmail, phone: cleanPhone });
            setClinicLogo(profile.photoUrl);
            setProfileDraft({ ...profile, email: cleanEmail, phone: cleanPhone });
            setError("");
            setSaved(true);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (isArabic ? "تعذر حفظ الملف الشخصي." : "Unable to save profile."));
            setSaved(false);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const saveHours = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (hours.workingDays.length === 0 || !hours.startTime || !hours.endTime || toMinutes(hours.startTime) >= toMinutes(hours.endTime)) {
            setHoursError(isArabic ? "اختر يوم عمل واحداً على الأقل وأدخل ساعات صحيحة." : "Select at least one working day and enter valid hours.");
            return;
        }
        setIsSavingHours(true);
        try {
            await setClinicHours(hours);
            setHoursError("");
            setHoursSaved(true);
        } catch (cause) {
            setHoursError(cause instanceof Error ? cause.message : (isArabic ? "تعذر حفظ ساعات الحجز." : "Unable to save booking hours."));
            setHoursSaved(false);
        } finally {
            setIsSavingHours(false);
        }
    };

    if (!isLoaded) {
        return (
            <LoadingRegion label={isArabic ? "جارٍ تحميل الإعدادات..." : "Loading settings..."} className="mx-auto max-w-2xl space-y-6">
                <PageTitleSkeleton />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-10" />)}</div>
                    <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-11" />)}</div>
                    <Skeleton className="h-10 w-44 rounded-full" />
                </div>
                <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-10 w-36 rounded-full" /></div>
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
            </LoadingRegion>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="border-b border-slate-200 pb-4">
                <div className="text-sm font-semibold text-emerald-700">{isArabic ? "الإعدادات" : "Settings"}</div>
                <h1 className="mt-1 text-2xl font-bold text-emerald-950">{isArabic ? "الملف الشخصي للمدير" : "Admin profile"}</h1>
            </div>

            <section className="border-y border-clinic-border py-6">
                <div className="mb-5">
                    <h2 className="text-lg font-bold text-emerald-950">{isArabic ? "ساعات الحجز" : "Booking hours"}</h2>
                    <p className="mt-1 text-sm text-slate-600">{isArabic ? "حدد الأيام والساعات التي يمكن للعملاء اختيارها." : "Set the days and hours customers can book."}</p>
                </div>
                <form onSubmit={saveHours} className="space-y-5">
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold text-slate-700">{isArabic ? "أيام العمل" : "Working days"}</legend>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {weekdayLabels[locale].map((day, dayIndex) => <label key={dayIndex} className="flex items-center gap-2 rounded-lg border border-clinic-border px-3 py-2 text-sm"><input type="checkbox" checked={workingDays.includes(dayIndex)} onChange={(event) => updateHours({ workingDays: event.target.checked ? [...workingDays, dayIndex].sort() : workingDays.filter((item) => item !== dayIndex) })} className="accent-emerald-700" />{day}</label>)}
                        </div>
                    </fieldset>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "يفتح" : "Opens"}<input type="time" required value={startTime} onChange={(event) => updateHours({ startTime: event.target.value })} className={fieldClass} /></label>
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "يغلق" : "Closes"}<input type="time" required value={endTime} onChange={(event) => updateHours({ endTime: event.target.value })} className={fieldClass} /></label>
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">{isArabic ? "الفاصل بين المواعيد" : "Slot interval"}<select value={slotInterval} onChange={(event) => updateHours({ slotInterval: Number(event.target.value) })} className={fieldClass}><option value={15}>15 {isArabic ? "دقيقة" : "minutes"}</option><option value={30}>30 {isArabic ? "دقيقة" : "minutes"}</option><option value={60}>60 {isArabic ? "دقيقة" : "minutes"}</option></select></label>
                    </div>
                    {hoursError ? <p role="alert" className="text-sm text-red-700">{hoursError}</p> : null}
                    {hoursSaved ? <p role="status" className="text-sm text-emerald-800">{isArabic ? "تم حفظ ساعات الحجز." : "Booking hours saved."}</p> : null}
                    <LoadingButton type="submit" pending={isSavingHours} className="btn-primary py-2.5">{isSavingHours ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ ساعات الحجز" : "Save booking hours")}</LoadingButton>
                </form>
            </section>

            <form onSubmit={saveChanges} className="space-y-5">
                <ImageUpload
                    label={isArabic ? "الصورة / شعار العيادة" : "Profile photo / clinic logo"}
                    value={profile.photoUrl}
                    onChange={handlePhotoChange}
                    onError={(message) => { setError(message); setSaved(false); }}
                    maxBytes={150 * 1024}
                    maxDimension={512}
                    isArabic={isArabic}
                    previewClassName="h-20 w-20 rounded-full"
                />

                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    {isArabic ? "البريد الإلكتروني" : "Email address"}
                    <input type="email" autoComplete="email" required value={profile.email} onChange={(event) => { setProfileDraft({ ...profile, email: event.target.value }); setSaved(false); }} className={fieldClass} />
                </label>

                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    {isArabic ? "رقم الهاتف" : "Phone number"}
                    <input type="tel" autoComplete="tel" required value={profile.phone} onChange={(event) => { setProfileDraft({ ...profile, phone: event.target.value }); setSaved(false); }} className={fieldClass} />
                </label>

                {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
                {saved ? <p role="status" className="text-sm text-emerald-800">{isArabic ? "تم حفظ الملف الشخصي." : "Profile saved."}</p> : null}
                <LoadingButton type="submit" pending={isSavingProfile} className="btn-primary py-2.5">{isSavingProfile ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التغييرات" : "Save changes")}</LoadingButton>
                <p className="text-xs leading-5 text-slate-500">{isArabic ? "تُحفظ معلومات الملف الشخصي مع حساب العيادة." : "Profile details are saved with the clinic account."}</p>
            </form>
        </div>
    );
}

export default function DashboardSettingsPage() {
    return (
        <RequireAuth allowedRoles={["admin"]}>
            <AdminProfileSettings />
        </RequireAuth>
    );
}
