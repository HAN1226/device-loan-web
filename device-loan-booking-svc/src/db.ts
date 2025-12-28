import { TableClient } from "@azure/data-tables";

const connectionString = process.env.AzureWebJobsStorage || "UseDevelopmentStorage=true";

export const bookingClient = TableClient.fromConnectionString(connectionString, "Bookings");

export interface BookingEntity {
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

export const initBookingDatabase = async () => {
    await bookingClient.createTable();
};
