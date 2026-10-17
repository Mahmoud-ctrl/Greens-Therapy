"use client";

import { useMemo } from "react";

import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { LoadingRegion, PageTitleSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardPatientsPage() {
    const { appointments, isLoaded } = useClinicData();
    const { locale } = useLocale();
    const isArabic = locale === "ar";
    const patients = useMemo(() => {
        const patientMap = new Map<string, { name: string; email: string; visits: number; lastDate: string; lastTreatment: string }>();
        for (const appointment of appointments) {
            const key = appointment.patientEmail || appointment.patientName;
            const existing = patientMap.get(key);
            if (!existing) {
                patientMap.set(key, { name: appointment.patientName, email: appointment.patientEmail, visits: 1, lastDate: appointment.date, lastTreatment: appointment.treatmentName });
            } else {
                existing.visits += 1;
                if (appointment.date > existing.lastDate) {
                    existing.lastDate = appointment.date;
                    existing.lastTreatment = appointment.treatmentName;
                }
            }
        }
        return Array.from(patientMap.values()).sort((first, second) => first.name.localeCompare(second.name));
    }, [appointments]);

    if (!isLoaded) {
        return (
            <LoadingRegion label={isArabic ? "جارٍ تحميل المرضى..." : "Loading patients..."} className="space-y-6">
                <PageTitleSkeleton />
                <TableSkeleton rows={6} columns={4} />
            </LoadingRegion>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="text-sm uppercase tracking-[0.2em] text-emerald-700">{isArabic ? "المرضى" : "Patients"}</div>
                <h1 className="mt-2 text-2xl font-bold text-emerald-950">{isArabic ? "قائمة المرضى" : "Patient list"}</h1>
            </div>

            <div className="overflow-x-auto rounded-xl border border-clinic-border">
                <table className="min-w-full text-left text-sm text-slate-700">
                    <thead className="bg-[#eff7f3]">
                        <tr>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "الاسم" : "Name"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "البريد الإلكتروني" : "Email"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "عدد المواعيد" : "Appointments"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "آخر موعد" : "Last appointment"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">{isArabic ? "لا يوجد مرضى مسجلون بعد." : "No patients recorded yet."}</td></tr> : null}
                        {patients.map((patient) => (
                            <tr key={patient.email || patient.name} className="border-t border-slate-200">
                                <td className="px-4 py-3">{patient.name}</td>
                                <td className="px-4 py-3">{patient.email || "—"}</td>
                                <td className="px-4 py-3">{patient.visits}</td>
                                <td className="px-4 py-3">{patient.lastDate} · {patient.lastTreatment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
