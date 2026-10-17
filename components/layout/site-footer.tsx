import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="border-t border-clinic-border bg-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
                <div>
                    <div className="mb-3 text-lg font-bold text-emerald-950">Greens Healing Therapy</div>
                    <p className="text-sm leading-7 text-slate-600">
                        Natural care for your body, mind, and daily balance.
                    </p>
                </div>

                <div>
                    <h3 className="mb-4 text-base font-semibold text-emerald-950">Quick links</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div><Link href="/treatments">Treatments</Link></div>
                        <div><Link href="/products">Products</Link></div>
                        <div><Link href="/book">Book appointment</Link></div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
