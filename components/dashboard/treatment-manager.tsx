"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { ImageUpload } from "@/components/ui/image-upload";
import { ItemVisual } from "@/components/ui/item-visual";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingRegion, PageTitleSkeleton, TableSkeleton } from "@/components/ui/skeleton";
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
    const { treatments, isLoaded, saveTreatment, deleteTreatment } = useClinicData();
    const { locale } = useLocale();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Treatment, "id">>(blankTreatment);
    const [error, setError] = useState("");
    // Which async action is running: "save" or "delete:<id>".
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const ar = locale === "ar";
    const fieldClass = "field py-2 text-sm";

    const edit = (treatment?: Treatment) => {
        setEditingId(treatment?.id ?? "new");
        setForm(treatment ? { ...treatment } : { ...blankTreatment });
        setError("");
    };

    const handleSaveTreatment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.arName.trim() || !form.enName.trim() || form.price < 0 || form.duration < 1) {
            setError(ar ? "أدخل الأسماء والسعر والمدة بشكل صحيح." : "Enter both names and valid price and duration values.");
            return;
        }
        setPendingAction("save");
        try {
            await saveTreatment(form, editingId === "new" ? undefined : editingId ?? undefined);
            setEditingId(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حفظ العلاج." : "Unable to save the treatment."));
        } finally {
            setPendingAction(null);
        }
    };

    const handleDeleteTreatment = async (treatmentId: string) => {
        setPendingAction(`delete:${treatmentId}`);
        try {
            await deleteTreatment(treatmentId);
            if (editingId === treatmentId) setEditingId(null);
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حذف العلاج." : "Unable to delete treatment."));
        } finally {
            setPendingAction(null);
        }
    };

    if (!isLoaded) {
        return (
            <LoadingRegion label={ar ? "جارٍ تحميل العلاجات..." : "Loading treatments..."} className="space-y-5">
                <PageTitleSkeleton />
                <TableSkeleton rows={5} columns={isAdmin ? 4 : 3} />
            </LoadingRegion>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clinic-border pb-4">
                <div>
                    <p className="text-sm font-medium text-emerald-700">{ar ? "العلاجات" : "Treatments"}</p>
                    <h1 className="mt-1 text-3xl font-semibold text-emerald-950">{ar ? "قائمة العلاجات" : "Treatment services"}</h1>
                </div>
                {isAdmin ? <button type="button" onClick={() => edit()} className="btn-primary py-2.5"><Plus size={16} aria-hidden="true" />{ar ? "إضافة علاج" : "Add treatment"}</button> : null}
            </div>

            {error && !editingId ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

            {editingId ? (
                <form onSubmit={handleSaveTreatment} className="grid gap-4 rounded-2xl border border-clinic-border bg-slate-50 p-5 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الاسم بالعربية" : "Arabic name"}<input className={fieldClass} value={form.arName} onChange={(event) => setForm({ ...form, arName: event.target.value })} required /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الاسم بالإنجليزية" : "English name"}<input className={fieldClass} value={form.enName} onChange={(event) => setForm({ ...form, enName: event.target.value })} required /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea className={fieldClass} value={form.arDescription} onChange={(event) => setForm({ ...form, arDescription: event.target.value })} rows={2} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea className={fieldClass} value={form.enDescription} onChange={(event) => setForm({ ...form, enDescription: event.target.value })} rows={2} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "السعر" : "Price"}<input className={fieldClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "المدة بالدقائق" : "Duration in minutes"}<input className={fieldClass} type="number" min="1" step="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الفئة" : "Category"}<input className={fieldClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" checked={form.active ?? true} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="accent-emerald-700" />{ar ? "علاج نشط ومتاح للحجز" : "Active and available for booking"}</label>
                    <div className="sm:col-span-2">
                        <ImageUpload
                            label={ar ? "صورة العلاج" : "Treatment photo"}
                            value={form.image}
                            onChange={(image) => { setForm((current) => ({ ...current, image })); setError(""); }}
                            onRemove={() => { setForm((current) => ({ ...current, image: undefined })); setError(""); }}
                            onError={setError}
                            maxBytes={300 * 1024}
                            isArabic={ar}
                        />
                    </div>
                    {error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
                    <div className="flex gap-2 sm:col-span-2">
                        <LoadingButton type="submit" pending={pendingAction === "save"} className="btn-primary py-2.5">{pendingAction === "save" ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}</LoadingButton>
                        <button type="button" disabled={pendingAction === "save"} onClick={() => setEditingId(null)} className="btn-secondary py-2.5">{ar ? "إلغاء" : "Cancel"}</button>
                    </div>
                </form>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-start text-sm text-slate-700">
                    <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-start">{ar ? "العلاج" : "Treatment"}</th><th className="px-4 py-3 text-start">{ar ? "السعر" : "Price"}</th><th className="px-4 py-3 text-start">{ar ? "المدة" : "Duration"}</th>{isAdmin ? <th className="px-4 py-3 text-start">{ar ? "الإجراءات" : "Actions"}</th> : null}</tr></thead>
                    <tbody>{treatments.length === 0 ? <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-10 text-center text-slate-500">{ar ? "لم تتم إضافة علاجات بعد." : "No treatments added yet."}</td></tr> : treatments.map((treatment) => (
                        <tr key={treatment.id} className="border-t border-slate-200">
                            <td className="px-4 py-3"><div className="flex items-center gap-3"><ItemVisual image={treatment.image} alt="" category={treatment.category} className="h-11 w-11 shrink-0 rounded-lg [&_svg]:h-5 [&_svg]:w-5" /><div className="font-semibold text-slate-900">{ar ? treatment.arName : treatment.enName}</div></div></td>
                            <td className="px-4 py-3">${treatment.price}</td>
                            <td className="px-4 py-3">{treatment.duration} {ar ? "دقيقة" : "min"}</td>
                            {isAdmin ? (
                                <td className="whitespace-nowrap px-4 py-3">
                                    <button type="button" onClick={() => edit(treatment)} className="font-semibold text-emerald-800">{ar ? "تعديل" : "Edit"}</button>
                                    <LoadingButton type="button" pending={pendingAction === `delete:${treatment.id}`} icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => void handleDeleteTreatment(treatment.id)} className="ms-3 inline-flex items-center gap-1 font-semibold text-red-700 disabled:opacity-60">{ar ? "حذف" : "Delete"}</LoadingButton>
                                </td>
                            ) : null}
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
