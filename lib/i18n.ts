export type Locale = "ar" | "en";

export const getDirection = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

export const formatCurrency = (value: number, locale: Locale) =>
    `${locale === "ar" ? "$" : "$"}${value}`;

export const formatDuration = (minutes: number, locale: Locale) =>
    locale === "ar" ? `${minutes} دقيقة` : `${minutes} min`;
