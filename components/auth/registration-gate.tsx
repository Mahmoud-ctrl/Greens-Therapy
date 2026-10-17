"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

const publicAuthRoutes = new Set(["/register", "/login", "/admin"]);

export function RegistrationGate({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoaded } = useAuth();
    const routeIsPublic = publicAuthRoutes.has(pathname);
    const needsRegistration = isLoaded && !user && !routeIsPublic;

    useEffect(() => {
        if (needsRegistration) router.replace("/register");
    }, [needsRegistration, router]);

    if (!isLoaded || needsRegistration) return null;

    return <>{children}</>;
}