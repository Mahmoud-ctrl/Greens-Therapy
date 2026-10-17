"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout, FormError, PasswordField, TextField } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingButton } from "@/components/ui/loading-button";
import { useLocale } from "@/components/providers/locale-provider";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

export default function AdminLoginPage() {
    const router = useRouter();
    const { locale } = useLocale();
    const { login, logout } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isArabic = locale === "ar";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const user = await login(email.trim(), password);
            if (user.role !== "admin" && user.role !== "receptionist") {
                await logout();
                setError(isArabic ? "هذا الحساب ليس حساباً للموظفين." : "This account is not authorized for staff access.");
                return;
            }
            router.push("/dashboard");
        } catch (cause) {
            setError(getAuthErrorMessage(cause, locale, "login"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            eyebrow={isArabic ? "بوابة الموظفين" : "Staff portal"}
            title={isArabic ? "دخول الإدارة" : "Staff sign in"}
            description={isArabic ? "الوصول إلى إدارة المواعيد والعلاجات والمنتجات." : "Manage appointments, treatments, and products."}
            footer={
                <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-900">
                    {isArabic ? "العودة إلى تسجيل دخول المرضى" : "Back to patient sign in"}
                </Link>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <TextField
                    label={isArabic ? "البريد الإلكتروني" : "Email"}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
                <PasswordField
                    label={isArabic ? "كلمة المرور" : "Password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <FormError message={error} />
                <LoadingButton type="submit" pending={isSubmitting} className="btn-primary w-full py-3.5 text-base">
                    {isSubmitting ? (isArabic ? "جارٍ تسجيل الدخول..." : "Signing in...") : (isArabic ? "تسجيل الدخول" : "Sign in")}
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
