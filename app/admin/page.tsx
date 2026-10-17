"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { signInDemoUser } from "@/lib/auth";

export default function AdminLoginPage() {
    const router = useRouter();
    const { locale } = useLocale();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const user = signInDemoUser(email, password);
        if (!user) {
            setError(locale === "ar" ? "بيانات الدخول غير صحيحة." : "Invalid email or password.");
            return;
        }

        login(user);
        router.push(user.role === "admin" || user.role === "receptionist" ? "/dashboard" : "/");
    };

    return (
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
            <div className="rounded-2xl border border-clinic-border bg-white p-7 shadow-sm sm:p-8">
                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {locale === "ar" ? "بوابة الطبيب" : "Doctor portal"}
                </div>
                <h1 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                    {locale === "ar" ? "تسجيل دخول الإدارة" : "Staff login"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {locale === "ar" ? "الوصول إلى إدارة العيادة." : "Access clinic management."}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-3 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        {locale === "ar" ? "كلمة المرور" : "Password"}
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-3 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </label>

                    {error ? <div className="text-sm text-red-600">{error}</div> : null}

                    <button type="submit" className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">
                        {locale === "ar" ? "تسجيل الدخول" : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <Link href="/login" className="font-semibold text-emerald-700">
                        {locale === "ar" ? "العودة إلى صفحة تسجيل الدخول العامة" : "Back to public login"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
