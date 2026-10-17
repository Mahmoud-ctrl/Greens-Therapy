"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import type { UserRole } from "@/lib/auth";

export function RequireAuth({ allowedRoles, children, fallback }: { allowedRoles: UserRole[]; children: React.ReactNode; fallback?: React.ReactNode }) {
    const { user, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const hasAccess = user && allowedRoles.includes(user.role);
        if (!hasAccess) {
            router.replace("/admin");
        }
    }, [allowedRoles, isLoaded, router, user]);

    if (!isLoaded) {
        return fallback ?? <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading...</div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
