export type Locale = "ar" | "en";

export interface Treatment {
    id: string;
    arName: string;
    enName: string;
    arDescription: string;
    enDescription: string;
    price: number;
    duration: number;
    category: string;
    image?: string;
}

export interface Product {
    id: string;
    arName: string;
    enName: string;
    description: string;
    category: string;
    price: number;
    weight: string;
    stock: number;
    image?: string;
    active: boolean;
}

export interface ClinicAppointment {
    id: string;
    patientName: string;
    patientEmail: string;
    patientPhone?: string;
    treatmentId: string;
    treatmentName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    createdAt: string;
    isRead: boolean;
}

export interface ClinicHours {
    workingDays: number[];
    startTime: string;
    endTime: string;
    slotInterval: number;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface ProductOrder {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: Array<{
        productId: string;
        productNameAr: string;
        productNameEn: string;
        quantity: number;
        unitPrice: number;
    }>;
    total: number;
    paymentMethod: "Cash on delivery";
    status: "New" | "Preparing" | "Delivered" | "Cancelled";
    createdAt: string;
    isRead: boolean;
}

export interface DashboardMetric {
    label: string;
    value: string;
    trend: string;
    tone: "green" | "olive" | "beige" | "dark";
}
