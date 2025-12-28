import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { bookingClient, BookingEntity } from "../db";
import { verifyToken, INVENTORY_SERVICE_URL } from "../utils";

export async function manageBooking(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function processed request for manageBooking.');

    // 1. Auth Check (Staff Only)
    const user = verifyToken(request);
    if (!user || user.role !== "staff") {
        return { status: 403, body: "Forbidden: Staff only" };
    }

    const bookingId = request.params.id;
    const action = request.params.action; // collect or return

    if (!bookingId || !action) {
        return { status: 400, body: "Missing booking ID or action" };
    }

    // Find the booking. Since we don't have partitionKey (UserId) easily, 
    // we might need to query by RowKey. Azure Table Storage is fast with PK, slow without.
    // For this demo, we'll scan (inefficient) or require UserId in query params?
    // Let's scan for now as it's a demo with low data volume.
    // Alternatively, the API could accept userId in body. Let's assume we scan.
    
    let booking: BookingEntity | undefined;
    try {
        // OData filter
        const filter = `RowKey eq '${bookingId}'`;
        const iterator = bookingClient.listEntities<BookingEntity>({ queryOptions: { filter } });
        for await (const entity of iterator) {
            booking = entity;
            break;
        }
    } catch (e) {
        // ignore
    }

    if (!booking) {
        return { status: 404, body: "Booking not found" };
    }

    try {
        if (action === "collect") {
            if (booking.status !== "Reserved") {
                return { status: 400, body: "Booking is not in Reserved state" };
            }
            booking.status = "Collected";
            booking.collectedDate = new Date().toISOString();
            await bookingClient.updateEntity(booking);
        } 
        else if (action === "return") {
            if (booking.status !== "Collected") {
                return { status: 400, body: "Booking is not in Collected state" };
            }
            booking.status = "Returned";
            booking.actualReturnDate = new Date().toISOString();
            await bookingClient.updateEntity(booking);

            // Increase Inventory
            await fetch(`${INVENTORY_SERVICE_URL}/api/updateInventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand: booking.brand,
                    model: booking.model,
                    change: 1 // Increase by 1
                })
            });

            // Trigger Waitlist Notification (Mock)
            context.log(`[Notification] Device ${booking.brand} ${booking.model} returned. Notifying waitlist...`);
        } 
        else {
            return { status: 400, body: "Invalid action" };
        }

        return {
            status: 200,
            jsonBody: booking
        };

    } catch (error) {
        context.error("Error managing booking", error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('manageBooking', {
    methods: ['PUT'],
    route: 'bookings/{id}/{action}',
    authLevel: 'anonymous',
    handler: manageBooking
});
