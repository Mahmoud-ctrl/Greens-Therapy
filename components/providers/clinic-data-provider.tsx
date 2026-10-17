"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { products as initialProducts } from "@/data/products";
import { treatments as initialTreatments } from "@/data/treatments";
import { demoUsers, getUserProfile } from "@/lib/auth";
import type { CartItem, ClinicAppointment, ClinicHours, Product, ProductOrder, Treatment } from "@/types/clinic";

const productsStorageKey = "greens-healing-products";
const treatmentsStorageKey = "greens-healing-treatments";
const appointmentsStorageKey = "greens-healing-appointments";
const cartStorageKey = "greens-healing-cart";
const ordersStorageKey = "greens-healing-product-orders";
const clinicLogoStorageKey = "greens-healing-clinic-logo";
const clinicHoursStorageKey = "greens-healing-clinic-hours";
const legacySampleProductIds = new Set([
    "sidian-honey",
    "citrus-honey",
    "jardi-honey",
    "sidian-honey-honeycomb",
    "green-honey",
    "summer-honey",
    "honey-nut-mixture",
    "pollen-pistachio-honey",
]);
const legacySampleTreatmentIds = new Set([
    "hijama-islamic",
    "comprehensive-chinese-cupping",
    "massage-cupping",
    "muscle-relief-massage",
    "complete-chinese-massage",
    "healing-session",
    "healing-stone-therapy",
    "dry-acupuncture",
    "ear-candling",
]);

interface ClinicDataContextValue {
    isLoaded: boolean;
    clinicLogo: string;
    clinicHours: ClinicHours | null;
    products: Product[];
    treatments: Treatment[];
    appointments: ClinicAppointment[];
    cartItems: CartItem[];
    productOrders: ProductOrder[];
    setProducts: (products: Product[]) => void;
    setTreatments: (treatments: Treatment[]) => void;
    setClinicLogo: (logo: string) => void;
    setClinicHours: (hours: ClinicHours | null) => void;
    isAppointmentSlotAvailable: (date: string, startTime: string, endTime: string) => boolean;
    bookAppointment: (appointment: Omit<ClinicAppointment, "id" | "createdAt" | "isRead">) => boolean;
    markAppointmentsRead: () => void;
    updateAppointmentStatus: (appointmentId: string, status: "Confirmed" | "Cancelled") => boolean;
    addToCart: (productId: string) => boolean;
    updateCartQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    submitProductOrder: (customer: Pick<ProductOrder, "customerName" | "customerPhone" | "deliveryAddress">) => ProductOrder | null;
    markProductOrdersRead: () => void;
}

const ClinicDataContext = createContext<ClinicDataContextValue | undefined>(undefined);

function readStoredData<T>(key: string, fallback: T): T {
    try {
        const stored = window.localStorage.getItem(key);
        return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function ClinicDataProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState(initialProducts);
    const [treatments, setTreatments] = useState(initialTreatments);
    const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
    const [clinicLogo, setClinicLogoState] = useState("");
    const [clinicHours, setClinicHoursState] = useState<ClinicHours | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setProducts(readStoredData<Product[]>(productsStorageKey, initialProducts).filter((product) => !legacySampleProductIds.has(product.id)));
        setTreatments(readStoredData<Treatment[]>(treatmentsStorageKey, initialTreatments).filter((treatment) => !legacySampleTreatmentIds.has(treatment.id)));
        setAppointments(readStoredData<ClinicAppointment[]>(appointmentsStorageKey, []).filter((appointment) => !legacySampleTreatmentIds.has(appointment.treatmentId)));
        setCartItems(readStoredData<CartItem[]>(cartStorageKey, []).filter((item) => !legacySampleProductIds.has(item.productId)));
        setProductOrders(readStoredData<ProductOrder[]>(ordersStorageKey, []).filter((order) => order.items.every((item) => !legacySampleProductIds.has(item.productId))));
        const storedClinicLogo = window.localStorage.getItem(clinicLogoStorageKey);
        const adminAccount = demoUsers.find((user) => user.role === "admin");
        const previousAdminPhoto = adminAccount ? getUserProfile(adminAccount).photoUrl ?? "" : "";
        const clinicLogo = storedClinicLogo ?? previousAdminPhoto;
        setClinicLogoState(clinicLogo);
        if (!storedClinicLogo && clinicLogo) {
            window.localStorage.setItem(clinicLogoStorageKey, clinicLogo);
        }
        setClinicHoursState(readStoredData<ClinicHours | null>(clinicHoursStorageKey, null));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
        window.localStorage.setItem(treatmentsStorageKey, JSON.stringify(treatments));
        window.localStorage.setItem(appointmentsStorageKey, JSON.stringify(appointments));
        window.localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
        window.localStorage.setItem(ordersStorageKey, JSON.stringify(productOrders));
        if (clinicLogo) window.localStorage.setItem(clinicLogoStorageKey, clinicLogo);
        else window.localStorage.removeItem(clinicLogoStorageKey);
        if (clinicHours) window.localStorage.setItem(clinicHoursStorageKey, JSON.stringify(clinicHours));
        else window.localStorage.removeItem(clinicHoursStorageKey);
    }, [appointments, cartItems, clinicHours, clinicLogo, isLoaded, products, productOrders, treatments]);

    useEffect(() => {
        const syncStoredCollection = (event: StorageEvent) => {
            if (event.key === appointmentsStorageKey) {
                try {
                    setAppointments(event.newValue ? JSON.parse(event.newValue) as ClinicAppointment[] : []);
                } catch {
                    setAppointments([]);
                }
            }
            if (event.key === ordersStorageKey) {
                try {
                    setProductOrders(event.newValue ? JSON.parse(event.newValue) as ProductOrder[] : []);
                } catch {
                    setProductOrders([]);
                }
            }
            if (event.key === clinicLogoStorageKey) {
                setClinicLogoState(event.newValue ?? "");
            }
            if (event.key === clinicHoursStorageKey) {
                try {
                    setClinicHoursState(event.newValue ? JSON.parse(event.newValue) as ClinicHours : null);
                } catch {
                    setClinicHoursState(null);
                }
            }
        };

        window.addEventListener("storage", syncStoredCollection);
        return () => window.removeEventListener("storage", syncStoredCollection);
    }, []);

    const markAppointmentsRead = useCallback(() => {
        if (appointments.every((appointment) => appointment.isRead)) return;
        const nextAppointments = appointments.map((appointment) => ({ ...appointment, isRead: true }));
        setAppointments(nextAppointments);
        window.localStorage.setItem(appointmentsStorageKey, JSON.stringify(nextAppointments));
    }, [appointments]);

    const updateAppointmentStatus = useCallback((appointmentId: string, status: "Confirmed" | "Cancelled") => {
        const appointmentExists = appointments.some((appointment) => appointment.id === appointmentId && appointment.status === "Pending");
        if (!appointmentExists) return false;
        const nextAppointments = appointments.map((appointment) => appointment.id === appointmentId && appointment.status === "Pending"
            ? { ...appointment, status, isRead: true }
            : appointment);
        setAppointments(nextAppointments);
        window.localStorage.setItem(appointmentsStorageKey, JSON.stringify(nextAppointments));
        return true;
    }, [appointments]);

    const addToCart = useCallback((productId: string) => {
        const product = products.find((item) => item.id === productId && item.active);
        if (!product || product.stock < 1) return false;
        const currentQuantity = cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
        const nextQuantity = Math.min(currentQuantity + 1, product.stock);
        if (nextQuantity === currentQuantity) return false;
        const nextCart = cartItems.some((item) => item.productId === productId)
            ? cartItems.map((item) => item.productId === productId ? { ...item, quantity: nextQuantity } : item)
            : [...cartItems, { productId, quantity: nextQuantity }];
        setCartItems(nextCart);
        window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
        window.dispatchEvent(new CustomEvent("clinic-cart-item-added", { detail: { productId } }));
        return true;
    }, [cartItems, products]);

    const updateCartQuantity = useCallback((productId: string, quantity: number) => {
        const product = products.find((item) => item.id === productId && item.active);
        if (!product) return;
        if (quantity < 1) {
            setCartItems(cartItems.filter((item) => item.productId !== productId));
            return;
        }
        const nextCart = cartItems.map((item) => item.productId === productId
            ? { ...item, quantity: Math.min(Math.floor(quantity), product.stock) }
            : item).filter((item) => item.quantity > 0);
        setCartItems(nextCart);
        window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
    }, [cartItems, products]);

    const removeFromCart = useCallback((productId: string) => {
        const nextCart = cartItems.filter((item) => item.productId !== productId);
        setCartItems(nextCart);
        window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
    }, [cartItems]);

    const clearCart = useCallback(() => {
        setCartItems([]);
        window.localStorage.removeItem(cartStorageKey);
    }, []);

    const setClinicLogo = useCallback((logo: string) => {
        setClinicLogoState(logo);
        if (logo) window.localStorage.setItem(clinicLogoStorageKey, logo);
        else window.localStorage.removeItem(clinicLogoStorageKey);
    }, []);

    const setClinicHours = useCallback((hours: ClinicHours | null) => {
        setClinicHoursState(hours);
        if (hours) window.localStorage.setItem(clinicHoursStorageKey, JSON.stringify(hours));
        else window.localStorage.removeItem(clinicHoursStorageKey);
    }, []);

    const isAppointmentSlotAvailable = useCallback((date: string, startTime: string, endTime: string) => {
        const start = startTimeToMinutes(startTime);
        const end = startTimeToMinutes(endTime);
        const opening = clinicHours ? startTimeToMinutes(clinicHours.startTime) : null;
        const closing = clinicHours ? startTimeToMinutes(clinicHours.endTime) : null;
        if (start === null || end === null || start >= end) return false;
        if (!clinicHours || !clinicHours.workingDays.includes(new Date(`${date}T12:00:00`).getDay())) return false;
        if (opening === null || closing === null || clinicHours.slotInterval < 1) return false;
        if (start < opening || end > closing || (start - opening) % clinicHours.slotInterval !== 0) return false;
        return !appointments.some((appointment) =>
            appointment.date === date
            && appointment.status !== "Cancelled"
            && start < (startTimeToMinutes(appointment.endTime) ?? 0)
            && end > (startTimeToMinutes(appointment.startTime) ?? 0),
        );
    }, [appointments, clinicHours]);

    const bookAppointment = useCallback((appointment: Omit<ClinicAppointment, "id" | "createdAt" | "isRead">) => {
        const latestAppointments = readStoredData<ClinicAppointment[]>(appointmentsStorageKey, appointments);
        const start = startTimeToMinutes(appointment.startTime);
        const end = startTimeToMinutes(appointment.endTime);
        const opening = clinicHours ? startTimeToMinutes(clinicHours.startTime) : null;
        const closing = clinicHours ? startTimeToMinutes(clinicHours.endTime) : null;
        const withinConfiguredHours = Boolean(
            clinicHours
            && clinicHours.workingDays.includes(new Date(`${appointment.date}T12:00:00`).getDay())
            && opening !== null
            && closing !== null
            && start !== null
            && end !== null
            && start >= opening
            && end <= closing
            && clinicHours.slotInterval > 0
            && (start - opening) % clinicHours.slotInterval === 0,
        );
        const collides = latestAppointments.some((existing) =>
            existing.date === appointment.date
            && existing.status !== "Cancelled"
            && start !== null
            && end !== null
            && start < (startTimeToMinutes(existing.endTime) ?? 0)
            && end > (startTimeToMinutes(existing.startTime) ?? 0),
        );
        if (!withinConfiguredHours || collides) return false;
        const nextAppointment: ClinicAppointment = {
            ...appointment,
            id: `appointment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        const nextAppointments = [nextAppointment, ...latestAppointments];
        setAppointments(nextAppointments);
        window.localStorage.setItem(appointmentsStorageKey, JSON.stringify(nextAppointments));
        window.dispatchEvent(new CustomEvent("clinic-appointment-created", { detail: nextAppointment }));
        return true;
    }, [appointments, clinicHours]);

    const submitProductOrder = useCallback((customer: Pick<ProductOrder, "customerName" | "customerPhone" | "deliveryAddress">) => {
        if (!cartItems.length || !customer.customerName.trim() || !customer.customerPhone.trim() || !customer.deliveryAddress.trim()) return null;

        const orderItems: ProductOrder["items"] = [];
        for (const cartItem of cartItems) {
            const product = products.find((item) => item.id === cartItem.productId && item.active);
            if (!product || !Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || cartItem.quantity > product.stock) return null;
            orderItems.push({
                productId: product.id,
                productNameAr: product.arName,
                productNameEn: product.enName,
                quantity: cartItem.quantity,
                unitPrice: product.price,
            });
        }

        const order: ProductOrder = {
            id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            customerName: customer.customerName.trim(),
            customerPhone: customer.customerPhone.trim(),
            deliveryAddress: customer.deliveryAddress.trim(),
            items: orderItems,
            total: orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
            paymentMethod: "Cash on delivery",
            status: "New",
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        const nextOrders = [order, ...productOrders];
        setProductOrders(nextOrders);
        setCartItems([]);
        window.localStorage.setItem(ordersStorageKey, JSON.stringify(nextOrders));
        window.localStorage.removeItem(cartStorageKey);
        window.dispatchEvent(new CustomEvent("clinic-product-order-created", { detail: order }));
        return order;
    }, [cartItems, products, productOrders]);

    const markProductOrdersRead = useCallback(() => {
        if (productOrders.every((order) => order.isRead)) return;
        const nextOrders = productOrders.map((order) => ({ ...order, isRead: true }));
        setProductOrders(nextOrders);
        window.localStorage.setItem(ordersStorageKey, JSON.stringify(nextOrders));
    }, [productOrders]);

    const value = useMemo(
        () => ({ isLoaded, clinicLogo, clinicHours, products, treatments, appointments, cartItems, productOrders, setProducts, setTreatments, setClinicLogo, setClinicHours, isAppointmentSlotAvailable, bookAppointment, markAppointmentsRead, updateAppointmentStatus, addToCart, updateCartQuantity, removeFromCart, clearCart, submitProductOrder, markProductOrdersRead }),
        [isLoaded, clinicLogo, clinicHours, products, treatments, appointments, cartItems, productOrders, setClinicLogo, setClinicHours, isAppointmentSlotAvailable, bookAppointment, markAppointmentsRead, updateAppointmentStatus, addToCart, updateCartQuantity, removeFromCart, clearCart, submitProductOrder, markProductOrdersRead],
    );

    return <ClinicDataContext.Provider value={value}>{children}</ClinicDataContext.Provider>;
}

export function useClinicData() {
    const context = useContext(ClinicDataContext);
    if (!context) {
        throw new Error("useClinicData must be used within ClinicDataProvider");
    }
    return context;
}

function startTimeToMinutes(time: string) {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}