import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
    return <Loader2 size={size} aria-hidden="true" className={`shrink-0 animate-spin ${className}`} />;
}

/** Button that swaps its icon for a spinner and disables itself while an async action runs. */
export function LoadingButton({ pending, icon, children, disabled, ...buttonProps }: {
    pending: boolean;
    icon?: ReactNode;
    children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...buttonProps} disabled={pending || disabled} aria-busy={pending || undefined}>
            {pending ? <Spinner /> : icon}
            {children}
        </button>
    );
}
