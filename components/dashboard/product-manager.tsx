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
    const { products, isLoaded, saveProduct, deleteProduct, adjustProductStock } = useClinicData();
    const { locale } = useLocale();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Product, "id">>(blankProduct);
    const [stockReceipts, setStockReceipts] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    // Which async action is running: "save", "stock:<id>" or "delete:<id>".
    const [pendingAction, setPendingAction] = useState<string | null>(null);
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

        setPendingAction("save");
        try {
            await saveProduct(form, editingId === "new" ? undefined : editingId ?? undefined);
            setEditingId(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حفظ المنتج." : "Unable to save product."));
        } finally {
            setPendingAction(null);
        }
    };

    const receiveStock = async (product: Product) => {
        if (!isAdmin) return;
        const amount = Number(stockReceipts[product.id]);
        if (!Number.isInteger(amount) || amount < 1) return;
        setPendingAction(`stock:${product.id}`);
        try {
            await adjustProductStock(product.id, amount);
            setStockReceipts((current) => ({ ...current, [product.id]: "" }));
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر تحديث المخزون." : "Unable to adjust inventory."));
        } finally {
            setPendingAction(null);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!isAdmin) return;
        setPendingAction(`delete:${productId}`);
        try {
            await deleteProduct(productId);
            if (editingId === productId) setEditingId(null);
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : (ar ? "تعذر حذف المنتج." : "Unable to delete product."));
        } finally {
            setPendingAction(null);
        }
    };

    if (!isLoaded) {
        return (
            <LoadingRegion label={ar ? "جارٍ تحميل المنتجات..." : "Loading products..."} className="space-y-5">
                <PageTitleSkeleton />
                <TableSkeleton rows={5} columns={isAdmin ? 5 : 4} />
            </LoadingRegion>
        );
    }

    const fieldClass = "field py-2 text-sm";

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <p className="text-sm font-medium text-emerald-700">{ar ? "المنتجات" : "Products"}</p>
                    <h1 className="mt-1 text-3xl font-semibold text-emerald-950">{ar ? "الكتالوج والمخزون" : "Catalog and stock"}</h1>
                </div>
                {isAdmin ? <button type="button" onClick={startAdd} className="btn-primary py-2.5"><Plus size={16} aria-hidden="true" />{ar ? "إضافة منتج" : "Add product"}</button> : null}
            </div>

            {error && !editingId ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

            {editingId ? (
                <form onSubmit={handleSaveProduct} className="grid gap-4 rounded-2xl border border-clinic-border bg-slate-50 p-5 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الاسم بالعربية" : "Arabic name"}<input className={fieldClass} value={form.arName} onChange={(event) => setForm({ ...form, arName: event.target.value })} required /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الاسم بالإنجليزية" : "English name"}<input className={fieldClass} value={form.enName} onChange={(event) => setForm({ ...form, enName: event.target.value })} required /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea className={fieldClass} value={form.arDescription ?? ""} onChange={(event) => setForm({ ...form, arDescription: event.target.value })} rows={2} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea className={fieldClass} value={form.enDescription ?? form.description} onChange={(event) => setForm({ ...form, enDescription: event.target.value, description: event.target.value })} rows={2} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "السعر" : "Price"}<input className={fieldClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "المخزون الحالي" : "Current stock"}<input className={fieldClass} type="number" value={editingId === "new" ? form.stock : products.find((item) => item.id === editingId)?.stock ?? 0} readOnly /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الوزن" : "Weight"}<input className={fieldClass} value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></label>
                    <label className="space-y-1.5 text-sm font-medium">{ar ? "الفئة" : "Category"}<input className={fieldClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
                    <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="accent-emerald-700" />{ar ? "منتج نشط ومتاح للبيع" : "Active and available for sale"}</label>
                    <div className="sm:col-span-2">
                        <ImageUpload
                            label={ar ? "صورة المنتج" : "Product photo"}
                            value={form.image}
                            onChange={(image) => { setForm((current) => ({ ...current, image })); setError(""); }}
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
                    <thead className="bg-slate-100 text-start"><tr><th className="px-4 py-3 text-start">{ar ? "المنتج" : "Product"}</th><th className="px-4 py-3 text-start">{ar ? "السعر" : "Price"}</th><th className="px-4 py-3 text-start">{ar ? "المخزون" : "In stock"}</th><th className="px-4 py-3 text-start">{ar ? "استلام مخزون" : "Receive stock"}</th>{isAdmin ? <th className="px-4 py-3 text-start">{ar ? "الإجراءات" : "Actions"}</th> : null}</tr></thead>
                    <tbody>{products.length === 0 ? <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-slate-500">{ar ? "لم تتم إضافة منتجات بعد." : "No products added yet."}</td></tr> : products.map((product) => {
                        const isAddingStock = pendingAction === `stock:${product.id}`;
                        const isDeleting = pendingAction === `delete:${product.id}`;
                        return (
                            <tr key={product.id} className="border-t border-slate-200">
                                <td className="px-4 py-3"><div className="flex items-center gap-3"><ItemVisual image={product.image} alt="" category={product.category} className="h-11 w-11 shrink-0 rounded-lg [&_svg]:h-5 [&_svg]:w-5" /><div className="font-semibold text-slate-900">{ar ? product.arName : product.enName}</div></div></td>
                                <td className="whitespace-nowrap px-4 py-3">${product.price}{product.weight ? ` / ${product.weight}` : ""}</td>
                                <td className="px-4 py-3 font-semibold">{product.stock}</td>
                                <td className="px-4 py-3">{isAdmin ? (
                                    <div className="flex gap-2">
                                        <input aria-label={ar ? "كمية الإضافة" : "Quantity received"} className="w-20 rounded-lg border border-slate-300 bg-card px-2 py-1" type="number" min="1" step="1" disabled={isAddingStock} value={stockReceipts[product.id] ?? ""} onChange={(event) => setStockReceipts({ ...stockReceipts, [product.id]: event.target.value })} />
                                        <LoadingButton type="button" pending={isAddingStock} onClick={() => void receiveStock(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-800 disabled:opacity-60">{ar ? "إضافة" : "Add"}</LoadingButton>
                                    </div>
                                ) : <span className="text-slate-500">{ar ? "للمدير فقط" : "Admin only"}</span>}</td>
                                {isAdmin ? (
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <button type="button" onClick={() => startEdit(product)} className="font-semibold text-emerald-800">{ar ? "تعديل" : "Edit"}</button>
                                        <LoadingButton type="button" pending={isDeleting} icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => void handleDeleteProduct(product.id)} className="ms-3 inline-flex items-center gap-1 font-semibold text-red-700 disabled:opacity-60">{ar ? "حذف" : "Delete"}</LoadingButton>
                                    </td>
                                ) : null}
                            </tr>
                        );
                    })}</tbody>
                </table>
            </div>
        </div>
    );
}
