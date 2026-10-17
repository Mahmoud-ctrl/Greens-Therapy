"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { Treatment } from "@/types/clinic";

const blankTreatment: Omit<Treatment, "id"> = {
    arName: "",
    enName: "",
    arDescription: "",
    enDescription: "",
    price: 0,
    duration: 0,
    category: "",
};

export function TreatmentManager() {
    const { treatments, setTreatments } = useClinicData();
    const { locale } = useLocale();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Treatment, "id">>(blankTreatment);
    const [error, setError] = useState("");
    const ar = locale === "ar";
    const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

    const readPhoto = (file?: File) => {
        if (!file) return;
        if (file.size > 1024 * 1024) {
            setError(ar ? "حجم الصورة يجب أن يكون أقل من 1 ميغابايت." : "Choose an image smaller than 1 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result) }));
        reader.readAsDataURL(file);
    };

    const edit = (treatment?: Treatment) => {
        setEditingId(treatment?.id ?? "new");
        setForm(treatment ? { ...treatment } : { ...blankTreatment });
        setError("");
    };

    const saveTreatment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.arName.trim() || !form.enName.trim() || form.price < 0 || form.duration < 1) {
            setError(ar ? "أدخل الأسماء والسعر والمدة بشكل صحيح." : "Enter both names and valid price and duration values.");
            return;
        }
        if (editingId === "new") {
            setTreatments([...treatments, { ...form, id: `treatment-${Date.now()}` }]);
        } else {
            setTreatments(treatments.map((treatment) => treatment.id === editingId ? { ...form, id: treatment.id } : treatment));
        }
        setEditingId(null);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clinic-border pb-4"><div><p className="text-sm font-medium text-emerald-700">{ar ? "العلاجات" : "Treatments"}</p><h1 className="mt-1 text-2xl font-bold text-emerald-950">{ar ? "قائمة العلاجات" : "Treatment services"}</h1></div>{isAdmin ? <button type="button" onClick={() => edit()} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">{ar ? "إضافة علاج" : "Add treatment"}</button> : null}</div>
            {editingId ? <form onSubmit={saveTreatment} className="grid gap-3 rounded-xl border border-clinic-border bg-[#f6faf8] p-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">{ar ? "الاسم بالعربية" : "Arabic name"}<input className={fieldClass} value={form.arName} onChange={(event) => setForm({ ...form, arName: event.target.value })} required /></label>
                <label className="space-y-1 text-sm font-medium">{ar ? "الاسم بالإنجليزية" : "English name"}<input className={fieldClass} value={form.enName} onChange={(event) => setForm({ ...form, enName: event.target.value })} required /></label>
                <label className="space-y-1 text-sm font-medium">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea className={fieldClass} value={form.arDescription} onChange={(event) => setForm({ ...form, arDescription: event.target.value })} rows={2} /></label>
                <label className="space-y-1 text-sm font-medium">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea className={fieldClass} value={form.enDescription} onChange={(event) => setForm({ ...form, enDescription: event.target.value })} rows={2} /></label>
                <label className="space-y-1 text-sm font-medium">{ar ? "السعر" : "Price"}<input className={fieldClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
                <label className="space-y-1 text-sm font-medium">{ar ? "المدة بالدقائق" : "Duration in minutes"}<input className={fieldClass} type="number" min="1" step="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} /></label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">{ar ? "صورة العلاج" : "Treatment photo"}<input className="block w-full text-sm" type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0])} />{form.image ? <img src={form.image} alt={form.enName || "Treatment preview"} className="h-24 w-24 rounded-md border border-slate-200 object-cover" /> : null}</label>
                {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
                <div className="flex gap-2 sm:col-span-2"><button className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">{ar ? "حفظ" : "Save"}</button><button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold" type="button" onClick={() => setEditingId(null)}>{ar ? "إلغاء" : "Cancel"}</button></div>
            </form> : null}
            <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full text-left text-sm text-slate-700"><thead className="bg-[#eff7f3]"><tr><th className="px-4 py-3">{ar ? "العلاج" : "Treatment"}</th><th className="px-4 py-3">{ar ? "السعر" : "Price"}</th><th className="px-4 py-3">{ar ? "المدة" : "Duration"}</th>{isAdmin ? <th className="px-4 py-3">{ar ? "الإجراءات" : "Actions"}</th> : null}</tr></thead><tbody>{treatments.length === 0 ? <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-10 text-center text-slate-500">{ar ? "لم تتم إضافة علاجات بعد." : "No treatments added yet."}</td></tr> : treatments.map((treatment) => <tr key={treatment.id} className="border-t border-slate-200"><td className="px-4 py-3"><div className="font-semibold text-slate-900">{ar ? treatment.arName : treatment.enName}</div></td><td className="px-4 py-3">${treatment.price}</td><td className="px-4 py-3">{treatment.duration} {ar ? "دقيقة" : "min"}</td>{isAdmin ? <td className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => edit(treatment)} className="font-semibold text-emerald-800">{ar ? "تعديل" : "Edit"}</button><button type="button" onClick={() => setTreatments(treatments.filter((item) => item.id !== treatment.id))} className="ms-3 font-semibold text-red-700">{ar ? "حذف" : "Delete"}</button></td> : null}</tr>)}</tbody></table></div>
        </div>
    );
}