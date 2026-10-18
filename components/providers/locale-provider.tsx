"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useSyncExternalStore,
    type ReactNode,
} from "react";

import type { Locale } from "@/types/clinic";

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const localeStorageKey = "greens-healing-locale";
const localeChangeEvent = "greens-healing-locale-change";

function subscribeToLocale(onChange: () => void) {
    const handleStorage = (event: StorageEvent) => {
        if (event.key === localeStorageKey || event.key === null) onChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(localeChangeEvent, onChange);
    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(localeChangeEvent, onChange);
    };
}

function getLocaleSnapshot(): Locale {
    return window.localStorage.getItem(localeStorageKey) === "ar" ? "ar" : "en";
}

function getServerLocaleSnapshot(): Locale {
    return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocaleSnapshot);
    const setLocale = useCallback((nextLocale: Locale) => {
        window.localStorage.setItem(localeStorageKey, nextLocale);
        window.dispatchEvent(new Event(localeChangeEvent));
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        document.body.dir = locale === "ar" ? "rtl" : "ltr";
    }, [locale]);

    const value = useMemo<LocaleContextValue>(
        () => ({ locale, setLocale }),
        [locale, setLocale],
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
