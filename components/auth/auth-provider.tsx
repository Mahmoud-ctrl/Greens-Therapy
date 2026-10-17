"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/auth";

interface AuthContextValue {
    user: AppUser | null;
    login: (email: string, password: string) => Promise<AppUser>;
    register: (name: string, email: string, password: string) => Promise<AppUser>;
    updateProfile: (profile: Pick<AppUser, "name" | "email" | "phone">) => Promise<void>;
    logout: () => Promise<void>;
    isLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(user: User): AppUser {
    const role = user.app_metadata.role;
    return {
        id: user.id,
        name: user.user_metadata.full_name || user.email?.split("@")[0] || "Patient",
        email: user.email ?? "",
        role: role === "admin" || role === "receptionist" ? role : "patient",
        phone: user.user_metadata.phone ?? undefined,
        photoUrl: user.user_metadata.photo_url ?? undefined,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        let mounted = true;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ? toAppUser(session.user) : null);
                setIsLoaded(true);
            }
        });

        void supabase.auth.getSession().then(({ data, error }) => {
            if (!mounted) return;
            if (error) {
                console.error("Unable to restore the Supabase session:", error.message);
                setUser(null);
            } else {
                setUser(data.session?.user ? toAppUser(data.session.user) : null);
            }
            setIsLoaded(true);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            login: async (email, password) => {
                const { data, error } = await createClient().auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (!data.user) throw new Error("Supabase did not return a user after sign in.");
                const signedInUser = toAppUser(data.user);
                setUser(signedInUser);
                return signedInUser;
            },
            register: async (name, email, password) => {
                const supabase = createClient();
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } },
                });
                if (error) throw error;

                // Registration signs the user in directly. Supabase only returns a session here when
                // "Confirm email" is disabled in the project's Auth settings; otherwise sign in fails below.
                let authUser = data.session ? data.user : null;
                if (!authUser) {
                    const signIn = await supabase.auth.signInWithPassword({ email, password });
                    if (signIn.error) throw signIn.error;
                    authUser = signIn.data.user;
                }
                if (!authUser) throw new Error("Supabase did not return a user after registration.");
                const registeredUser = toAppUser(authUser);
                setUser(registeredUser);
                return registeredUser;
            },
            updateProfile: async (profile) => {
                const { data, error } = await createClient().auth.updateUser({
                    email: profile.email,
                    data: { full_name: profile.name, phone: profile.phone },
                });
                if (error) throw error;
                if (data.user) setUser(toAppUser(data.user));
            },
            logout: async () => {
                const { error } = await createClient().auth.signOut();
                if (error) throw error;
                setUser(null);
            },
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
