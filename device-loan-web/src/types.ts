export interface Device {
    partitionKey: string; // Brand
    rowKey: string; // Model
    category: string;
    totalQuantity: number;
    availableQuantity: number;
}

export interface Booking {
    partitionKey: string; // UserId
    rowKey: string; // BookingId
    brand: string;
    model: string;
    status: "Reserved" | "Collected" | "Returned";
    reservationDate: string;
    returnDate?: string;
    collectedDate?: string;
    actualReturnDate?: string;
}

export interface User {
    username: string;
    role: "student" | "staff";
    token: string;
}
