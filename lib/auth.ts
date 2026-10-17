export type UserRole = "admin" | "receptionist" | "patient";

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    photoUrl?: string;
}
