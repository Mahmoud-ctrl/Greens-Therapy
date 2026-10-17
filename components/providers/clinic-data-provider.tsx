"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, ClinicAppointment, ClinicHours, Product, ProductOrder, Treatment } from "@/types/clinic";

const cartStorageKey = "greens-healing-cart";
const clinicLogoStorageKey = "greens-healing-clinic-logo";
const emptyCart: CartItem[] = [];

const orderStatuses: Record<string, ProductOrder["status"]> = {
    new: "New",
    preparing: "Preparing",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

interface ProductOrderItemRow {
    product_id: string | null;
    product_name_ar: string;
    product_name_en: string;
    quantity: number;
    unit_price: number | string;
}

interface ProductOrderRow {
    id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    location_url: string | null;
    total: number | string;
    status: string;
    is_read: boolean;
    created_at: string;
    product_order_items?: ProductOrderItemRow[];
}

function toProductOrder(row: ProductOrderRow): ProductOrder {
    return {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        deliveryAddress: row.delivery_address,
        locationUrl: row.location_url ?? undefined,
        items: (row.product_order_items ?? []).map((item) => ({
            productId: item.product_id ?? "",
            productNameAr: item.product_name_ar,
            productNameEn: item.product_name_en,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
        })),
        total: Number(row.total),
        paymentMethod: "Cash on delivery",
        status: orderStatuses[row.status] ?? "New",
        createdAt: row.created_at,
        isRead: row.is_read,
    };
}

const productOrderSelect = "*, product_order_items(product_id, product_name_ar, product_name_en, quantity, unit_price)";

interface ClinicDataContextValue {
    isLoaded: boolean;
    dataError: string;
    clinicLogo: string;
    clinicHours: ClinicHours | null;
    products: Product[];
    treatments: Treatment[];
    appointments: ClinicAppointment[];
    cartItems: CartItem[];
    productOrders: ProductOrder[];
    saveProduct: (product: Omit<Product, "id">, id?: string) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    adjustProductStock: (productId: string, quantityDelta: number) => Promise<void>;
    saveTreatment: (treatment: Omit<Treatment, "id">, id?: string) => Promise<void>;
    deleteTreatment: (treatmentId: string) => Promise<void>;
    setClinicLogo: (logo: string) => void;
    setClinicHours: (hours: ClinicHours | null) => Promise<void>;
    isAppointmentSlotAvailable: (date: string, startTime: string, endTime: string) => boolean;
    getBookedAppointmentSlots: (date: string) => Promise<Array<{ startTime: string; endTime: string }>>;
    bookAppointment: (appointment: Pick<ClinicAppointment, "treatmentId" | "date" | "startTime" | "endTime">) => Promise<boolean>;
    markAppointmentsRead: () => Promise<void>;
    updateAppointmentStatus: (appointmentId: string, status: "Confirmed" | "Cancelled") => Promise<boolean>;
    addToCart: (productId: string) => boolean;
    updateCartQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    submitProductOrder: (customer: Pick<ProductOrder, "customerName" | "customerPhone" | "deliveryAddress" | "locationUrl">) => Promise<ProductOrder>;
    markProductOrdersRead: () => Promise<void>;
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

function subscribeToLocalStorage(key: string, onChange: () => void) {
    const handleStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) onChange();
    };
    const handleLocalStorageChange = (event: Event) => {
        if ((event as CustomEvent<string>).detail === key) onChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("clinic-local-storage-change", handleLocalStorageChange);
    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("clinic-local-storage-change", handleLocalStorageChange);
    };
}

function useLocalStorageString(key: string) {
    const subscribe = useCallback((onChange: () => void) => subscribeToLocalStorage(key, onChange), [key]);
    const getSnapshot = useCallback(() => window.localStorage.getItem(key), [key]);
    const storedValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
    const setStoredValue = useCallback((value: string | null) => {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
        window.dispatchEvent(new CustomEvent("clinic-local-storage-change", { detail: key }));
    }, [key]);
    return [storedValue, setStoredValue] as const;
}

function useLocalStorageData<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useLocalStorageString(key);
    const value = useMemo(() => {
        if (!storedValue) return fallback;
        try {
            return JSON.parse(storedValue) as T;
        } catch {
            return fallback;
        }
    }, [fallback, storedValue]);
    const setValue = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
        const current = readStoredData(key, fallback);
        setStoredValue(JSON.stringify(typeof nextValue === "function"
            ? (nextValue as (currentValue: T) => T)(current)
            : nextValue));
    }, [fallback, key, setStoredValue]);
    return [value, setValue];
}

export function ClinicDataProvider({ children }: { children: ReactNode }) {
    const { user, isLoaded: authLoaded } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
    const [cartItems, setCartItems] = useLocalStorageData(cartStorageKey, emptyCart);
    const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
    const [storedClinicLogo, setStoredClinicLogo] = useLocalStorageString(clinicLogoStorageKey);
    const clinicLogo = storedClinicLogo ?? "";
    const [clinicHours, setClinicHoursState] = useState<ClinicHours | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [dataError, setDataError] = useState("");

    useEffect(() => {
        if (!authLoaded) return;
        let mounted = true;
        const loadClinicData = async () => {
            const supabase = createClient();
            const isAdmin = user?.role === "admin";
            const [treatmentResult, productResult, settingsResult, appointmentResult, orderResult] = await Promise.all([
                supabase.from("treatments").select("*").order("name_en"),
                supabase.from("products").select("*").order("name_en"),
                supabase.from("clinic_settings").select("*").eq("id", true).maybeSingle(),
                user ? supabase.from("appointments").select("*, patient_profiles(full_name, email, phone)").order("appointment_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
                isAdmin ? supabase.from("product_orders").select(productOrderSelect).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
            ]);
            const loadError = treatmentResult.error ?? productResult.error ?? settingsResult.error ?? appointmentResult.error;
            if (loadError) throw loadError;
            if (!mounted) return;

            setTreatments((treatmentResult.data ?? []).map((row) => ({
                id: row.id,
                arName: row.name_ar,
                enName: row.name_en,
                arDescription: row.description_ar,
                enDescription: row.description_en,
                price: Number(row.price),
                duration: row.duration_minutes,
                category: row.category,
                image: row.image_url ?? undefined,
                active: row.is_active,
            })));
            setProducts((productResult.data ?? []).map((row) => ({
                id: row.id,
                arName: row.name_ar,
                enName: row.name_en,
                description: row.description_en,
                arDescription: row.description_ar,
                enDescription: row.description_en,
                category: row.category,
                price: Number(row.price),
                weight: row.weight,
                stock: row.stock_quantity,
                image: row.image_url ?? undefined,
                active: row.is_active,
            })));
            setClinicHoursState(settingsResult.data?.start_time && settingsResult.data?.end_time ? {
                workingDays: settingsResult.data.working_days,
                startTime: settingsResult.data.start_time.slice(0, 5),
                endTime: settingsResult.data.end_time.slice(0, 5),
                slotInterval: settingsResult.data.slot_interval_minutes,
            } : null);
            setAppointments((appointmentResult.data ?? []).map((row) => {
                const profile = Array.isArray(row.patient_profiles) ? row.patient_profiles[0] : row.patient_profiles;
                return {
                    id: row.id,
                    patientName: profile?.full_name ?? "",
                    patientEmail: profile?.email ?? "",
                    patientPhone: profile?.phone ?? undefined,
                    treatmentId: row.treatment_id,
                    treatmentName: row.treatment_name_en_snapshot,
                    date: row.appointment_date,
                    startTime: row.start_time.slice(0, 5),
                    endTime: row.end_time.slice(0, 5),
                    status: row.status[0].toUpperCase() + row.status.slice(1) as ClinicAppointment["status"],
                    createdAt: row.created_at,
                    isRead: row.is_read,
                };
            }));
            // Orders are admin-only and live in their own migration; a failure here shouldn't hide the rest of the dashboard.
            if (orderResult.error) console.error("Unable to load product orders from Supabase:", orderResult.error.message);
            setProductOrders(((orderResult.data ?? []) as ProductOrderRow[]).map(toProductOrder));
            setIsLoaded(true);
            setDataError("");
        };

        void loadClinicData().catch((error: unknown) => {
            if (!mounted) return;
            const message = error instanceof Error ? error.message : "Unable to load clinic data.";
            console.error("Unable to load clinic data from Supabase:", message);
            setDataError(message);
            setIsLoaded(true);
        });

        return () => {
            mounted = false;
        };
    }, [authLoaded, user]);

    useEffect(() => {
        if (user?.role !== "admin") return;
        const supabase = createClient();
        const channel = supabase
            .channel("admin-product-orders")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "product_orders" }, (payload) => {
                // The insert payload has no line items, so fetch the full order.
                void supabase.from("product_orders").select(productOrderSelect).eq("id", (payload.new as { id: string }).id).single()
                    .then(({ data, error }) => {
                        if (error || !data) return;
                        const order = toProductOrder(data as ProductOrderRow);
                        setProductOrders((current) => current.some((item) => item.id === order.id) ? current : [order, ...current]);
                    });
            })
            .subscribe();
        return () => {
            void supabase.removeChannel(channel);
        };
    }, [user?.role]);

    const saveTreatment = useCallback(async (treatment: Omit<Treatment, "id">, id?: string) => {
        const values = {
            name_ar: treatment.arName.trim(),
            name_en: treatment.enName.trim(),
            description_ar: treatment.arDescription,
            description_en: treatment.enDescription,
            price: treatment.price,
            duration_minutes: treatment.duration,
            category: treatment.category,
            image_url: treatment.image ?? null,
            is_active: treatment.active ?? true,
        };
        const supabase = createClient();
        const { data, error } = id
            ? await supabase.from("treatments").update(values).eq("id", id).select().single()
            : await supabase.from("treatments").insert(values).select().single();
        if (error) throw error;
        const saved: Treatment = {
            id: data.id,
            arName: data.name_ar,
            enName: data.name_en,
            arDescription: data.description_ar,
            enDescription: data.description_en,
            price: Number(data.price),
            duration: data.duration_minutes,
            category: data.category,
            image: data.image_url ?? undefined,
            active: data.is_active,
        };
        setTreatments((current) => id
            ? current.map((item) => item.id === id ? saved : item)
            : [...current, saved]);
    }, []);

    const deleteTreatment = useCallback(async (treatmentId: string) => {
        const { error } = await createClient().from("treatments").delete().eq("id", treatmentId);
        if (error) throw error;
        setTreatments((current) => current.filter((item) => item.id !== treatmentId));
    }, []);

    const adjustProductStock = useCallback(async (productId: string, quantityDelta: number) => {
        if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
            throw new Error("Inventory adjustment must be a non-zero whole number.");
        }
        const { error } = await createClient().from("inventory").insert({
            product_id: productId,
            quantity_delta: quantityDelta,
            reason: quantityDelta > 0 ? "Stock received" : "Stock adjustment",
        });
        if (error) throw error;
        setProducts((current) => current.map((product) => product.id === productId
            ? { ...product, stock: product.stock + quantityDelta }
            : product));
    }, []);

    const saveProduct = useCallback(async (product: Omit<Product, "id">, id?: string) => {
        const values = {
            name_ar: product.arName.trim(),
            name_en: product.enName.trim(),
            description_ar: product.arDescription ?? product.description,
            description_en: product.enDescription ?? product.description,
            price: product.price,
            category: product.category,
            weight: product.weight,
            image_url: product.image ?? null,
            is_active: product.active,
        };
        const supabase = createClient();
        const { data, error } = id
            ? await supabase.from("products").update(values).eq("id", id).select().single()
            : await supabase.from("products").insert({ ...values, stock_quantity: 0 }).select().single();
        if (error) throw error;
        const saved: Product = {
            id: data.id,
            arName: data.name_ar,
            enName: data.name_en,
            description: data.description_en,
            arDescription: data.description_ar,
            enDescription: data.description_en,
            category: data.category,
            price: Number(data.price),
            weight: data.weight,
            stock: data.stock_quantity,
            image: data.image_url ?? undefined,
            active: data.is_active,
        };
        setProducts((current) => id
            ? current.map((item) => item.id === id ? saved : item)
            : [...current, saved]);

        const stockDelta = product.stock - saved.stock;
        if (stockDelta !== 0) {
            try {
                await adjustProductStock(saved.id, stockDelta);
            } catch (stockError) {
                throw new Error(
                    `Product details were saved, but its stock was not adjusted: ${stockError instanceof Error ? stockError.message : "unknown error"}`,
                );
            }
        }
    }, [adjustProductStock]);

    const deleteProduct = useCallback(async (productId: string) => {
        const { error } = await createClient().from("products").delete().eq("id", productId);
        if (error) throw error;
        setProducts((current) => current.filter((product) => product.id !== productId));
    }, []);

    const markAppointmentsRead = useCallback(async () => {
        const unreadIds = appointments.filter((appointment) => !appointment.isRead).map((appointment) => appointment.id);
        if (!unreadIds.length) return;
        const { error } = await createClient().from("appointments").update({ is_read: true }).in("id", unreadIds);
        if (error) throw error;
        setAppointments((current) => current.map((appointment) => ({ ...appointment, isRead: true })));
    }, [appointments]);

    const updateAppointmentStatus = useCallback(async (appointmentId: string, status: "Confirmed" | "Cancelled") => {
        const appointmentExists = appointments.some((appointment) => appointment.id === appointmentId && appointment.status === "Pending");
        if (!appointmentExists) return false;
        const { error } = await createClient().from("appointments").update({
            status: status.toLowerCase(),
            is_read: true,
        }).eq("id", appointmentId).eq("status", "pending").select("id").single();
        if (error) throw error;
        setAppointments((current) => current.map((appointment) => appointment.id === appointmentId && appointment.status === "Pending"
            ? { ...appointment, status, isRead: true }
            : appointment));
        return true;
    }, [appointments]);

    const getBookedAppointmentSlots = useCallback(async (date: string) => {
        const { data, error } = await createClient().rpc("get_booked_appointment_slots", {
            p_appointment_date: date,
        });
        if (error) throw error;
        const slots = (data ?? []) as Array<{ start_time: string; end_time: string }>;
        return slots.map((slot) => ({
            startTime: slot.start_time.slice(0, 5),
            endTime: slot.end_time.slice(0, 5),
        }));
    }, []);

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
        window.dispatchEvent(new CustomEvent("clinic-cart-item-added", { detail: { productId } }));
        return true;
    }, [cartItems, products, setCartItems]);

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
    }, [cartItems, products, setCartItems]);

    const removeFromCart = useCallback((productId: string) => {
        const nextCart = cartItems.filter((item) => item.productId !== productId);
        setCartItems(nextCart);
    }, [cartItems, setCartItems]);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, [setCartItems]);

    const setClinicLogo = useCallback((logo: string) => {
        setStoredClinicLogo(logo || null);
    }, [setStoredClinicLogo]);

    const setClinicHours = useCallback(async (hours: ClinicHours | null) => {
        const { error } = await createClient().from("clinic_settings").upsert({
            id: true,
            working_days: hours?.workingDays ?? [],
            start_time: hours?.startTime ?? null,
            end_time: hours?.endTime ?? null,
            slot_interval_minutes: hours?.slotInterval ?? 30,
        });
        if (error) throw error;
        setClinicHoursState(hours);
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

    const bookAppointment = useCallback(async (appointment: Pick<ClinicAppointment, "treatmentId" | "date" | "startTime" | "endTime">) => {
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
        const collides = appointments.some((existing) =>
            existing.date === appointment.date
            && existing.status !== "Cancelled"
            && start !== null
            && end !== null
            && start < (startTimeToMinutes(existing.endTime) ?? 0)
            && end > (startTimeToMinutes(existing.startTime) ?? 0),
        );
        if (!withinConfiguredHours || collides) return false;
        const { data, error } = await createClient().rpc("create_appointment", {
            p_treatment_id: appointment.treatmentId,
            p_appointment_date: appointment.date,
            p_start_time: appointment.startTime,
            p_end_time: appointment.endTime,
        });
        if (error) throw error;
        const booked = Array.isArray(data) ? data[0] : data;
        if (!booked) throw new Error("Supabase did not return the created appointment.");
        const nextAppointment: ClinicAppointment = {
            id: booked.id,
            patientName: user?.name ?? "",
            patientEmail: user?.email ?? "",
            treatmentId: booked.treatment_id,
            treatmentName: booked.treatment_name_en_snapshot,
            date: booked.appointment_date,
            startTime: booked.start_time.slice(0, 5),
            endTime: booked.end_time.slice(0, 5),
            status: "Pending",
            createdAt: booked.created_at,
            isRead: booked.is_read,
        };
        setAppointments((current) => [nextAppointment, ...current]);
        window.dispatchEvent(new CustomEvent("clinic-appointment-created", { detail: nextAppointment }));
        return true;
    }, [appointments, clinicHours, user]);

    const submitProductOrder = useCallback(async (customer: Pick<ProductOrder, "customerName" | "customerPhone" | "deliveryAddress" | "locationUrl">) => {
        if (!cartItems.length) throw new Error("Your cart is empty.");
        const { data, error } = await createClient().rpc("create_product_order", {
            p_customer_name: customer.customerName.trim(),
            p_customer_phone: customer.customerPhone.trim(),
            p_delivery_address: customer.deliveryAddress.trim(),
            p_location_url: customer.locationUrl?.trim() || null,
            p_items: cartItems.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        });
        if (error) throw error;
        const created = data as { id: string; total: number | string; created_at: string; items: ProductOrderItemRow[] };
        const order = toProductOrder({
            id: created.id,
            customer_name: customer.customerName.trim(),
            customer_phone: customer.customerPhone.trim(),
            delivery_address: customer.deliveryAddress.trim(),
            location_url: customer.locationUrl?.trim() || null,
            total: created.total,
            status: "new",
            is_read: false,
            created_at: created.created_at,
            product_order_items: created.items,
        });
        setCartItems([]);
        window.dispatchEvent(new CustomEvent("clinic-product-order-created", { detail: order }));
        return order;
    }, [cartItems, setCartItems]);

    const markProductOrdersRead = useCallback(async () => {
        const unreadIds = productOrders.filter((order) => !order.isRead).map((order) => order.id);
        if (!unreadIds.length) return;
        const { error } = await createClient().from("product_orders").update({ is_read: true }).in("id", unreadIds);
        if (error) throw error;
        setProductOrders((current) => current.map((order) => unreadIds.includes(order.id) ? { ...order, isRead: true } : order));
    }, [productOrders]);

    const value = useMemo(
        () => ({ isLoaded, dataError, clinicLogo, clinicHours, products, treatments, appointments, cartItems, productOrders, saveProduct, deleteProduct, adjustProductStock, saveTreatment, deleteTreatment, setClinicLogo, setClinicHours, isAppointmentSlotAvailable, getBookedAppointmentSlots, bookAppointment, markAppointmentsRead, updateAppointmentStatus, addToCart, updateCartQuantity, removeFromCart, clearCart, submitProductOrder, markProductOrdersRead }),
        [isLoaded, dataError, clinicLogo, clinicHours, products, treatments, appointments, cartItems, productOrders, saveProduct, deleteProduct, adjustProductStock, saveTreatment, deleteTreatment, setClinicLogo, setClinicHours, isAppointmentSlotAvailable, getBookedAppointmentSlots, bookAppointment, markAppointmentsRead, updateAppointmentStatus, addToCart, updateCartQuantity, removeFromCart, clearCart, submitProductOrder, markProductOrdersRead],
    );

    return (
        <ClinicDataContext.Provider value={value}>
            {dataError ? <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800">{dataError}</div> : null}
            {children}
        </ClinicDataContext.Provider>
    );
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