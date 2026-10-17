"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useClinicData } from "@/components/providers/clinic-data-provider";
import { useLocale } from "@/components/providers/locale-provider";

export default function DashboardAppointmentsPage() {
    const { appointments, markAppointmentsRead, updateAppointmentStatus } = useClinicData();
    const { user } = useAuth();
    const { locale } = useLocale();
    const [actionError, setActionError] = useState("");
    const isArabic = locale === "ar";
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        void markAppointmentsRead().catch((cause: unknown) => {
            setActionError(cause instanceof Error ? cause.message : (isArabic ? "تعذر تحديث حالة قراءة المواعيد." : "Unable to mark appointments as read."));
        });
    }, [isArabic, markAppointmentsRead]);

    const handleStatusUpdate = async (appointmentId: string, status: "Confirmed" | "Cancelled") => {
        try {
            await updateAppointmentStatus(appointmentId, status);
            setActionError("");
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : (isArabic ? "تعذر تحديث الموعد." : "Unable to update the appointment."));
        }
    };

    const rows = appointments.map((appointment) => ({
        key: appointment.id,
        patient: appointment.patientName,
        appointmentId: appointment.id,
        date: appointment.date,
        from: appointment.startTime,
        to: appointment.endTime,
        treatment: appointment.treatmentName,
        status: appointment.status,
    }));

    return (
        <div className="space-y-6">
            {actionError ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p> : null}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-emerald-700">{isArabic ? "المواعيد" : "Appointments"}</div>
                    <h1 className="mt-2 text-2xl font-bold text-emerald-950">{isArabic ? "قائمة المواعيد" : "Appointment list"}</h1>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-clinic-border">
                <table className="min-w-full text-left text-sm text-slate-700">
                    <thead className="bg-[#eff7f3]">
                        <tr>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "المريض" : "Patient"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "التاريخ" : "Date"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "من" : "From"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "إلى" : "To"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "العلاج" : "Treatment"}</th>
                            <th className="px-4 py-3 font-semibold">{isArabic ? "الحالة" : "Status"}</th>
                            {isAdmin ? <th className="px-4 py-3 font-semibold">{isArabic ? "الإجراء" : "Action"}</th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-10 text-center text-slate-500">{isArabic ? "لا توجد مواعيد بعد." : "No appointments yet."}</td></tr> : null}
                        {rows.map((appointment) => (
                            <tr key={appointment.key} className="border-t border-slate-200">
                                <td className="px-4 py-3">{appointment.patient}</td>
                                <td className="px-4 py-3">{appointment.date || "—"}</td>
                                <td className="px-4 py-3">{appointment.from}</td>
                                <td className="px-4 py-3">{appointment.to}</td>
                                <td className="px-4 py-3">{appointment.treatment}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointment.status === "Pending" ? "bg-amber-50 text-amber-800" : appointment.status === "Cancelled" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                                        {isArabic
                                            ? appointment.status === "Pending" ? "قيد الانتظار" : appointment.status === "Confirmed" ? "مؤكد" : appointment.status === "Cancelled" ? "مرفوض" : "مكتمل"
                                            : appointment.status}
                                    </span>
                                </td>
                                {isAdmin ? <td className="px-4 py-3">{appointment.status === "Pending" ? <div className="flex gap-2"><button type="button" onClick={() => void handleStatusUpdate(appointment.appointmentId, "Confirmed")} className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white">{isArabic ? "تأكيد" : "Confirm"}</button><button type="button" onClick={() => void handleStatusUpdate(appointment.appointmentId, "Cancelled")} className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700">{isArabic ? "رفض" : "Reject"}</button></div> : <span className="text-slate-400">—</span>}</td> : null}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
