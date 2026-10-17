"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { Product } from "@/types/clinic";

const blankProduct: Omit<Product, "id"> = {
    arName: "",
    enName: "",
    description: "",
    category: "",
    price: 0,
    weight: "",
    stock: 0,
    active: true,
};

export function ProductManager() {
    const { products, saveProduct, deleteProduct, adjustProductStock } = useClinicData();
    const { locale } = useLocale();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Product, "id">>(blankProduct);
    const [stockReceipts, setStockReceipts] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const ar = locale === "ar";

    const startEdit = (product: Product) => {
        if (!isAdmin) return;
        setEditingId(product.id);
        setForm({ ...product });
        setError("");
    };

    const startAdd = () => {
        if (!isAdmin) return;
        setEditingId("new");
        setForm({ ...blankProduct });
        setError("");
    };

    const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isAdmin) return;
        if (!form.arName.trim() || !form.enName.trim() || form.price < 0 || form.stock < 0) {
            setError(ar ? "أدخل الأسماء والسعر والمخزون بشكل صحيح." : "Enter both names and valid price and stock values.");
            return;
        }

        try {
            await saveProduct(form, editingId === "new" ? undefined : editingId ?? undefined);
            setEditingId(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حفظ المنتج." : "Unable to save product."));
        }
    };

    const readPhoto = (file?: File) => {
        if (!isAdmin) return;
        if (!file) return;
        if (file.size > 1024 * 1024) {
            setError(ar ? "حجم الصورة يجب أن يكون أقل من 1 ميغابايت." : "Choose an image smaller than 1 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result) }));
        reader.readAsDataURL(file);
    };

    const receiveStock = async (product: Product) => {
        if (!isAdmin) return;
        const amount = Number(stockReceipts[product.id]);
        if (!Number.isInteger(amount) || amount < 1) return;
        try {
            await adjustProductStock(product.id, amount);
            setStockReceipts((current) => ({ ...current, [product.id]: "" }));
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر تحديث المخزون." : "Unable to adjust inventory."));
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!isAdmin) return;
        try {
            await deleteProduct(productId);
            if (editingId === productId) setEditingId(null);
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حذف المنتج." : "Unable to delete product."));
        }
    };

    const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <p className="text-sm font-medium text-emerald-700">{ar ? "المنتجات" : "Products"}</p>
                    <h1 className="mt-1 text-2xl font-bold text-emerald-950">{ar ? "الكتالوج والمخزون" : "Catalog and stock"}</h1>
                </div>
                {isAdmin ? <button type="button" onClick={startAdd} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">{ar ? "إضافة منتج" : "Add product"}</button> : null}
            </div>

            {editingId ? (
                <form onSubmit={handleSaveProduct} className="grid gap-3 rounded-xl border border-clinic-border bg-[#f6faf8] p-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">{ar ? "الاسم بالعربية" : "Arabic name"}<input className={fieldClass} value={form.arName} onChange={(event) => setForm({ ...form, arName: event.target.value })} required /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "الاسم بالإنجليزية" : "English name"}<input className={fieldClass} value={form.enName} onChange={(event) => setForm({ ...form, enName: event.target.value })} required /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea className={fieldClass} value={form.arDescription ?? ""} onChange={(event) => setForm({ ...form, arDescription: event.target.value })} rows={2} /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea className={fieldClass} value={form.enDescription ?? form.description} onChange={(event) => setForm({ ...form, enDescription: event.target.value, description: event.target.value })} rows={2} /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "السعر" : "Price"}<input className={fieldClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "المخزون الحالي" : "Current stock"}<input className={fieldClass} type="number" value={editingId === "new" ? form.stock : products.find((item) => item.id === editingId)?.stock ?? 0} readOnly /></label>
                    <label className="space-y-1 text-sm font-medium">{ar ? "الوزن" : "Weight"}<input className={fieldClass} value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></label>
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="accent-emerald-700" />{ar ? "منتج نشط ومتاح للبيع" : "Active and available for sale"}</label>
                    <label className="space-y-2 text-sm font-medium sm:col-span-2">{ar ? "صورة المنتج" : "Product photo"}<input className="block w-full text-sm" type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0])} />{form.image ? <img src={form.image} alt={form.enName || "Product preview"} className="h-24 w-24 rounded-md border border-slate-200 object-cover" /> : null}</label>
                    {error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
                    <div className="flex gap-2 sm:col-span-2"><button className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">{ar ? "حفظ" : "Save"}</button><button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold" type="button" onClick={() => setEditingId(null)}>{ar ? "إلغاء" : "Cancel"}</button></div>
                </form>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm text-slate-700">
                    <thead className="bg-[#eff7f3]"><tr><th className="px-4 py-3">{ar ? "المنتج" : "Product"}</th><th className="px-4 py-3">{ar ? "السعر" : "Price"}</th><th className="px-4 py-3">{ar ? "المخزون" : "In stock"}</th><th className="px-4 py-3">{ar ? "استلام مخزون" : "Receive stock"}</th>{isAdmin ? <th className="px-4 py-3">{ar ? "الإجراءات" : "Actions"}</th> : null}</tr></thead>
                    <tbody>{products.length === 0 ? <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-slate-500">{ar ? "لم تتم إضافة منتجات بعد." : "No products added yet."}</td></tr> : products.map((product) => <tr key={product.id} className="border-t border-slate-200">
                        <td className="px-4 py-3"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt="" className="h-11 w-11 rounded-md object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50">🍯</span>}<div className="font-semibold text-slate-900">{ar ? product.arName : product.enName}</div></div></td>
                        <td className="px-4 py-3">${product.price} / {product.weight}</td><td className="px-4 py-3 font-semibold">{product.stock}</td>
                        <td className="px-4 py-3">{isAdmin ? <div className="flex gap-2"><input aria-label={ar ? "كمية الإضافة" : "Quantity received"} className="w-20 rounded-md border border-slate-300 px-2 py-1" type="number" min="1" step="1" value={stockReceipts[product.id] ?? ""} onChange={(event) => setStockReceipts({ ...stockReceipts, [product.id]: event.target.value })} /><button type="button" onClick={() => void receiveStock(product)} className="rounded-md border border-emerald-800 px-2 py-1 text-xs font-semibold text-emerald-800">{ar ? "إضافة" : "Add"}</button></div> : <span className="text-slate-500">{ar ? "للمدير فقط" : "Admin only"}</span>}</td>
                        {isAdmin ? <td className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => startEdit(product)} className="font-semibold text-emerald-800">{ar ? "تعديل" : "Edit"}</button><button type="button" onClick={() => void handleDeleteProduct(product.id)} className="ms-3 font-semibold text-red-700">{ar ? "حذف" : "Delete"}</button></td> : null}
                    </tr>)}</tbody>
                </table>
            </div>
        </div>
    );
}