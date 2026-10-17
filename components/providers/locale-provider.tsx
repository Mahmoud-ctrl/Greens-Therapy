"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type { Locale } from "@/types/clinic";

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("ar");

    useEffect(() => {
        const savedLocale = window.localStorage.getItem("greens-healing-locale") as Locale | null;
        setLocaleState(savedLocale === "ar" || savedLocale === "en" ? savedLocale : "ar");
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        document.body.dir = locale === "ar" ? "rtl" : "ltr";
        window.localStorage.setItem("greens-healing-locale", locale);
    }, [locale]);

    const value = useMemo(
        () => ({
            locale,
            setLocale: (nextLocale: Locale) => setLocaleState(nextLocale),
        }),
        [locale],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const context = useContext(LocaleContext);

    if (!context) {
        throw new Error("useLocale must be used inside LocaleProvider");
    }

    return context;
}
