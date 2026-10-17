"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthLayout, FormError, PasswordField, TextField } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingButton } from "@/components/ui/loading-button";
import { useLocale } from "@/components/providers/locale-provider";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

export default function RegisterPage() {
    const { locale } = useLocale();
    const router = useRouter();
    const { register } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isArabic = locale === "ar";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            setError(isArabic ? "يرجى تعبئة جميع الحقول." : "Please complete all fields.");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await register(`${firstName.trim()} ${lastName.trim()}`, email.trim(), password);
            router.push("/book");
        } catch (cause) {
            setError(getAuthErrorMessage(cause, locale, "register"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title={isArabic ? "إنشاء حساب" : "Create your account"}
            description={isArabic ? "ابدأ رحلتك نحو العافية الطبيعية." : "Start your journey toward natural wellness."}
            footer={<>
                {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-900">
                    {isArabic ? "تسجيل الدخول" : "Sign in"}
                </Link>
            </>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                        label={isArabic ? "الاسم الأول" : "First name"}
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                    />
                    <TextField
                        label={isArabic ? "اسم العائلة" : "Last name"}
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                    />
                </div>
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
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isArabic ? "٨ أحرف على الأقل" : "At least 8 characters"}
                    minLength={8}
                    required
                />
                <FormError message={error} />
                <LoadingButton type="submit" pending={isSubmitting} className="btn-primary w-full py-3.5 text-base">
                    {isSubmitting ? (isArabic ? "جارٍ إنشاء الحساب..." : "Creating account...") : (isArabic ? "إنشاء الحساب" : "Create account")}
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
