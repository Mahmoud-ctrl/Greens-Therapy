"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthLayout, FormError, PasswordField, TextField } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingButton } from "@/components/ui/loading-button";
import { useLocale } from "@/components/providers/locale-provider";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

export default function LoginPage() {
    const { locale } = useLocale();
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isArabic = locale === "ar";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const user = await login(email.trim(), password);
            router.push(user.role === "admin" || user.role === "receptionist" ? "/dashboard" : "/book");
        } catch (cause) {
            setError(getAuthErrorMessage(cause, locale, "login"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title={isArabic ? "أهلاً بعودتك" : "Welcome back"}
            description={isArabic ? "سجّل الدخول لحجز جلستك القادمة." : "Sign in to book your next session."}
            footer={<>
                {isArabic ? "ليس لديك حساب؟" : "Don’t have an account?"}{" "}
                <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-900">
                    {isArabic ? "أنشئ حساباً" : "Create one"}
                </Link>
                <span className="mx-2 text-slate-300">·</span>
                <Link href="/admin" className="font-semibold text-emerald-700 hover:text-emerald-900">
                    {isArabic ? "دخول الموظفين" : "Staff login"}
                </Link>
            </>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <TextField
                    label={isArabic ? "البريد الإلكتروني" : "Email"}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                />
                <PasswordField
                    label={isArabic ? "كلمة المرور" : "Password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
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
