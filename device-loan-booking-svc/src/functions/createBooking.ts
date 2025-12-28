import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { bookingClient, initBookingDatabase, BookingEntity } from "../db";
import { verifyToken, INVENTORY_SERVICE_URL } from "../utils";
import { v4 as uuidv4 } from "uuid";

export async function createBooking(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function processed request for createBooking.');

    // 1. Auth Check
    const user = verifyToken(request);
    if (!user) {
        return { status: 401, body: "Unauthorized" };
    }

    await initBookingDatabase();

    try {
        const body = await request.json() as { brand: string, model: string };
        if (!body.brand || !body.model) {
            return { status: 400, body: "Missing device info" };
        }

        // 2. Check Inventory & Decrease Stock (Atomic check in Inventory Service logic ideally, 
        // but here we call the update endpoint which does the check)
        const inventoryResponse = await fetch(`${INVENTORY_SERVICE_URL}/api/updateInventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                brand: body.brand,
                model: body.model,
                change: -1 // Decrease by 1
            })
        });

        if (!inventoryResponse.ok) {
            const errorText = await inventoryResponse.text();
            return { status: 409, body: `Reservation failed: ${errorText}` };
        }

        // 3. Create Booking Record
        const now = new Date();
        const returnDate = new Date(now);
        returnDate.setDate(returnDate.getDate() + 2); // Fixed 2 days

        const booking: BookingEntity = {
            partitionKey: user.userId,
            rowKey: uuidv4(),
            brand: body.brand,
            model: body.model,
            status: "Reserved",
            reservationDate: now.toISOString(),
            returnDate: returnDate.toISOString()
        };

        await bookingClient.createEntity(booking);

        return {
            status: 201,
            jsonBody: booking
        };

    } catch (error) {
        context.error("Error creating booking", error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('bookings', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createBooking
});
