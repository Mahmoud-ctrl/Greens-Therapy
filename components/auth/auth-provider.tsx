"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { authStorageKey, clearUser, getStoredUser, saveUser, saveUserProfile, type AppUser } from "@/lib/auth";

interface AuthContextValue {
    user: AppUser | null;
    login: (user: AppUser) => void;
    updateProfile: (profile: Pick<AppUser, "name" | "email" | "phone" | "photoUrl">) => void;
    logout: () => void;
    isLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const storedUser = getStoredUser();
        setUser(storedUser);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        if (user) {
            saveUser(user);
        } else {
            clearUser();
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(authStorageKey);
            }
        }
    }, [isLoaded, user]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            login: (nextUser) => setUser(nextUser),
            updateProfile: (profile) => setUser((currentUser) => {
                if (!currentUser) return currentUser;
                const nextUser = { ...currentUser, ...profile };
                saveUserProfile(nextUser);
                return nextUser;
            }),
            logout: () => setUser(null),
            isLoaded,
        }),
        [isLoaded, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
