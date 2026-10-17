export type UserRole = "admin" | "receptionist" | "patient";

export interface AppUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    photoUrl?: string;
}

export const demoUsers: AppUser[] = [
    {
        id: "doctor-1",
        name: "Dr. Salim Rahman",
        email: "doctor@greenshealing.com",
        password: "Greens123!",
        role: "admin",
    },
    {
        id: "reception-1",
        name: "Reception Desk",
        email: "reception@greenshealing.com",
        password: "Greens123!",
        role: "receptionist",
    },
    {
        id: "patient-1",
        name: "Patient Demo",
        email: "patient@greenshealing.com",
        password: "Greens123!",
        role: "patient",
    },
];

export const authStorageKey = "greens-healing-auth-user";
const profileStoragePrefix = "greens-healing-profile-";

export function getUserProfile(user: AppUser): AppUser {
    if (typeof window === "undefined") return user;

    try {
        const profile = window.localStorage.getItem(`${profileStoragePrefix}${user.id}`);
        return profile ? { ...user, ...JSON.parse(profile) as Partial<AppUser> } : user;
    } catch {
        return user;
    }
}

export function saveUserProfile(user: AppUser) {
    if (typeof window === "undefined") return;
    const { name, email, phone, photoUrl } = user;
    window.localStorage.setItem(`${profileStoragePrefix}${user.id}`, JSON.stringify({ name, email, phone, photoUrl }));
}

export function getStoredUser(): AppUser | null {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as AppUser;
    } catch {
        return null;
    }
}

export function saveUser(user: AppUser) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(authStorageKey, JSON.stringify(user));
    }
}

export function clearUser() {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(authStorageKey);
    }
}

export function findUserByEmail(email: string) {
    return demoUsers.map(getUserProfile).find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}

export function signInDemoUser(email: string, password: string): AppUser | null {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) return null;
    return user;
}
