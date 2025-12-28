import { Device, Booking, User } from './types';

const INVENTORY_API = import.meta.env.VITE_INVENTORY_API;
const BOOKING_API = import.meta.env.VITE_BOOKING_API;

export const api = {
    async getDevices(): Promise<Device[]> {
        const res = await fetch(`${INVENTORY_API}/getDevices`);
        return res.json();
    },

    async login(username: string, role: "student" | "staff"): Promise<User> {
        const res = await fetch(`${BOOKING_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, role })
        });
        if (!res.ok) throw new Error("Login failed");
        return res.json();
    },

    async getBookings(token: string): Promise<Booking[]> {
        const res = await fetch(`${BOOKING_API}/bookings`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
    },

    async createBooking(token: string, brand: string, model: string): Promise<void> {
        const res = await fetch(`${BOOKING_API}/bookings`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ brand, model })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt);
        }
    },

    async manageBooking(token: string, bookingId: string, action: "collect" | "return"): Promise<void> {
        const res = await fetch(`${BOOKING_API}/bookings/${bookingId}/${action}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt);
        }
    }
};
