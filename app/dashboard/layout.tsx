import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardFrameSkeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <RequireAuth allowedRoles={["admin", "receptionist"]} fallback={<DashboardFrameSkeleton label="Loading dashboard..." />}>
            <DashboardShell>{children}</DashboardShell>
        </RequireAuth>
    );
}
