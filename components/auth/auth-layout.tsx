"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import clinicLogoImage from "../../logo.jpeg";

/** Split-screen frame shared by the login, register and staff login pages. */
export function AuthLayout({ eyebrow, title, description, children, footer }: {
    eyebrow?: string;
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    const { locale } = useLocale();

    return (
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16 lg:px-8">
            <div className="relative hidden overflow-hidden rounded-[2rem] bg-[#f6efdf] md:flex md:flex-col md:items-center md:justify-center md:p-10">
                <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-full shadow-xl shadow-emerald-950/10">
                    <Image src={clinicLogoImage} alt="Greens Healing Therapy" fill sizes="24rem" className="scale-[1.1] object-cover" />
                </div>
                <p className="mt-6 max-w-xs text-center font-display text-2xl text-emerald-900">
                    {locale === "ar" ? "طبيعي · نقي · شافٍ" : "Natural · Pure · Healing"}
                </p>
            </div>

            <div className="surface-card flex flex-col justify-center p-7 sm:p-10">
                {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                <h1 className="mt-3 text-4xl font-semibold text-emerald-950 sm:text-5xl">{title}</h1>
                <p className="mt-3 text-slate-600">{description}</p>
                <div className="mt-8">{children}</div>
                {footer ? <div className="mt-8 border-t border-clinic-border pt-6 text-center text-sm text-slate-600">{footer}</div> : null}
            </div>
        </div>
    );
}

export function TextField({ label, ...inputProps }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {label}
            <input {...inputProps} className="field" />
        </label>
    );
}

export function PasswordField({ label, ...inputProps }: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
    const { locale } = useLocale();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {label}
            <div className="relative">
                <input {...inputProps} type={showPassword ? "text" : "password"} className="field pe-11" />
                <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword
                        ? (locale === "ar" ? "إخفاء كلمة المرور" : "Hide password")
                        : (locale === "ar" ? "إظهار كلمة المرور" : "Show password")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:text-emerald-700"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </label>
    );
}

export function FormError({ message }: { message: string }) {
    if (!message) return null;
    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>;
}
