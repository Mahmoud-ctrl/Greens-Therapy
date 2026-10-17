import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <RequireAuth allowedRoles={["admin", "receptionist"]}>
            <DashboardShell>{children}</DashboardShell>
        </RequireAuth>
    );
}
