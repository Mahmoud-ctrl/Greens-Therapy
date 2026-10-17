"use client";

import { useId, useState } from "react";
import { ImageUp } from "lucide-react";

import { Spinner } from "@/components/ui/loading-button";

const maxSourceBytes = 15 * 1024 * 1024;

function dataUrlBytes(dataUrl: string) {
    return Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
}

// Progressively lower quality, then size, until the image fits the storage budget.
const compressionSteps = [
    { quality: 0.82, scale: 1 },
    { quality: 0.7, scale: 1 },
    { quality: 0.6, scale: 0.85 },
    { quality: 0.5, scale: 0.7 },
    { quality: 0.45, scale: 0.55 },
    { quality: 0.4, scale: 0.4 },
];

/**
 * Downscales the image to fit maxDimension and re-encodes it (WebP, JPEG fallback), stepping
 * quality and size down until it fits maxBytes. Images are stored as data URLs inside database
 * rows and every page load fetches them, so an unprocessed phone photo would slow down the site.
 * Returns null when even the smallest step is over budget.
 */
async function compressImage(file: File, maxDimension: number, maxBytes: number) {
    const bitmap = await createImageBitmap(file);
    try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Unable to process the image.");
        for (const step of compressionSteps) {
            const scale = Math.min(1, (maxDimension * step.scale) / Math.max(bitmap.width, bitmap.height));
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const webp = canvas.toDataURL("image/webp", step.quality);
            // Browsers without WebP encoding silently return PNG; use JPEG there instead.
            const dataUrl = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", step.quality);
            if (dataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
        }
        return null;
    } finally {
        bitmap.close();
    }
}

/**
 * Image picker that compresses the file into a data URL (how the app stores clinic images)
 * and shows a processing state while it does.
 */
export function ImageUpload({ label, value, onChange, onError, maxBytes, maxDimension = 1200, isArabic, previewClassName = "h-20 w-20 rounded-2xl" }: {
    label: string;
    value?: string;
    onChange: (dataUrl: string) => void;
    onError: (message: string) => void;
    /** Largest allowed size of the stored (compressed) image. */
    maxBytes: number;
    maxDimension?: number;
    isArabic: boolean;
    previewClassName?: string;
}) {
    const inputId = useId();
    const [isReading, setIsReading] = useState(false);

    const handleFile = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            onError(isArabic ? "يرجى اختيار ملف صورة." : "Please choose an image file.");
            return;
        }
        if (file.size > maxSourceBytes) {
            onError(isArabic ? "يجب أن يكون حجم الصورة أقل من 15 ميغابايت." : "Choose an image smaller than 15 MB.");
            return;
        }
        setIsReading(true);
        try {
            const dataUrl = await compressImage(file, maxDimension, maxBytes);
            if (!dataUrl) {
                onError(isArabic ? "الصورة كبيرة جداً حتى بعد الضغط. جرّب صورة أبسط." : "This image is still too large after compression. Try a simpler image.");
                return;
            }
            onChange(dataUrl);
        } catch (cause) {
            onError(cause instanceof Error ? cause.message : (isArabic ? "تعذر قراءة الصورة." : "Unable to read the image."));
        } finally {
            setIsReading(false);
        }
    };

    return (
        <div className="space-y-2 text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="flex items-center gap-4">
                <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-clinic-border bg-slate-100 ${previewClassName}`}>
                    {isReading
                        ? <Spinner size={20} className="text-emerald-700" />
                        : value
                            ? <img src={value} alt="" className="h-full w-full object-cover" />
                            : <ImageUp size={22} strokeWidth={1.5} aria-hidden="true" className="text-slate-400" />}
                </div>
                <div>
                    <label
                        htmlFor={inputId}
                        aria-disabled={isReading}
                        className={`btn-secondary cursor-pointer px-4 py-2 ${isReading ? "pointer-events-none opacity-60" : ""}`}
                    >
                        {isReading ? <Spinner /> : <ImageUp size={16} aria-hidden="true" />}
                        {isReading
                            ? isArabic ? "جارٍ المعالجة..." : "Processing..."
                            : value ? isArabic ? "تغيير الصورة" : "Change image" : isArabic ? "رفع صورة" : "Upload image"}
                    </label>
                    <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        disabled={isReading}
                        onChange={(event) => {
                            void handleFile(event.target.files?.[0]);
                            event.target.value = "";
                        }}
                        className="sr-only"
                    />
                    <p className="mt-1.5 text-xs font-normal text-slate-500">{isArabic ? "يتم تصغيرها وضغطها تلقائياً" : "Resized and compressed automatically"}</p>
                </div>
            </div>
        </div>
    );
}
