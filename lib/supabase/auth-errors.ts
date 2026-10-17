import type { Locale } from "@/types/clinic";

type AuthErrorContext = "login" | "register";

function errorCode(error: unknown) {
    if (typeof error !== "object" || error === null || !("code" in error)) return "";
    return typeof error.code === "string" ? error.code.toLowerCase() : "";
}

export function getAuthErrorMessage(error: unknown, locale: Locale, context: AuthErrorContext) {
    const message = error instanceof Error ? error.message : "";
    const normalizedMessage = message.toLowerCase();
    const code = errorCode(error);
    const isArabic = locale === "ar";

    // Only reachable while "Confirm email" is still enabled in Supabase Auth, or for accounts
    // created before it was disabled.
    if (code === "email_not_confirmed" || normalizedMessage.includes("email not confirmed")) {
        return isArabic
            ? "تعذر تفعيل هذا الحساب. يرجى التواصل مع العيادة."
            : "This account could not be activated. Please contact the clinic.";
    }

    if (context === "register" && (
        code === "user_already_exists"
        || normalizedMessage.includes("user already registered")
    )) {
        return isArabic
            ? "يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول بدلاً من ذلك."
            : "An account with this email already exists. Sign in instead.";
    }

    if (context === "login" && normalizedMessage.includes("invalid login credentials")) {
        return isArabic
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            : "Incorrect email or password.";
    }

    if (message) return message;
    return context === "register"
        ? (isArabic ? "تعذر إنشاء الحساب." : "Unable to create the account.")
        : (isArabic ? "تعذر تسجيل الدخول." : "Unable to sign in.");
}
