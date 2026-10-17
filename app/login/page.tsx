"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

export default function LoginPage() {
    const { locale } = useLocale();
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
            <div className="rounded-2xl border border-clinic-border bg-white p-7 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                    {locale === "ar" ? "تسجيل الدخول" : "Login"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {locale === "ar" ? "مرحباً بعودتك. سجّل الدخول للاستمرار." : "Welcome back. Sign in to continue."}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-3 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="name@example.com"
                            required
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        {locale === "ar" ? "كلمة المرور" : "Password"}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 pe-10 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword
                                    ? (locale === "ar" ? "إخفاء كلمة المرور" : "Hide password")
                                    : (locale === "ar" ? "إظهار كلمة المرور" : "Show password")}
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </label>

                    {error ? <div className="text-sm text-red-600">{error}</div> : null}

                    <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">
                        {isSubmitting ? (locale === "ar" ? "جارٍ تسجيل الدخول..." : "Signing in...") : (locale === "ar" ? "تسجيل الدخول" : "Login")}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {locale === "ar" ? "ليس لديك حساب؟" : "Don’t have an account?"}{" "}
                    <Link href="/register" className="font-semibold text-emerald-700">
                        {locale === "ar" ? "إنشاء حساب" : "Register"}
                    </Link>
                </div>
                <div className="mt-4 text-center text-sm text-slate-500">
                    <Link href="/admin" className="font-semibold text-emerald-700">
                        {locale === "ar" ? "دخول الطبيب" : "Doctor login"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
