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

    if (context === "register" && (
        code === "over_email_send_rate_limit"
        || normalizedMessage.includes("email rate limit")
        || normalizedMessage.includes("only request this after")
    )) {
        return isArabic
            ? "وصلت مؤقتاً إلى حد إرسال رسائل التسجيل. لا تعاود المحاولة الآن؛ تحقق من رسائل التأكيد التي أُرسلت سابقاً، أو انتظر قبل المحاولة مجدداً."
            : "Supabase has temporarily limited registration emails. Don’t retry now; check for a confirmation email sent earlier, or wait before trying again.";
    }

    if (context === "login" && (
        code === "email_not_confirmed"
        || normalizedMessage.includes("email not confirmed")
    )) {
        return isArabic
            ? "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها."
            : "Confirm your email before signing in. Check your inbox and spam folder for the confirmation message.";
    }

    if (context === "login" && normalizedMessage.includes("invalid login credentials")) {
        return isArabic
            ? "لم يتم العثور على حساب بهذه البيانات. إذا سجلت للتو، أكّد بريدك الإلكتروني أولاً، ثم تحقق من البريد وكلمة المرور."
            : "Supabase could not verify this email and password. If you just registered, confirm your email first, then check that you’re using the same email and password.";
    }

    if (message) return message;
    return context === "register"
        ? (isArabic ? "تعذر إنشاء الحساب." : "Unable to create the account.")
        : (isArabic ? "تعذر تسجيل الدخول." : "Unable to sign in.");
}
