import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { bookingClient, initBookingDatabase } from "../db";
import { verifyToken } from "../utils";

export async function getBookings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const user = verifyToken(request);
    if (!user) {
        return { status: 401, body: "Unauthorized" };
    }

    await initBookingDatabase();

    const bookings = [];
    try {
        if (user.role === "staff") {
            // Staff sees all bookings
            for await (const entity of bookingClient.listEntities()) {
                bookings.push(entity);
            }
        } else {
            // Student sees only their own
            const filter = `PartitionKey eq '${user.userId}'`;
            for await (const entity of bookingClient.listEntities({ queryOptions: { filter } })) {
                bookings.push(entity);
            }
        }

        return {
            status: 200,
            jsonBody: bookings
        };
    } catch (error) {
        return { status: 500, body: "Error fetching bookings" };
    }
}

app.http('getBookings', {
    methods: ['GET'],
    route: 'bookings',
    authLevel: 'anonymous',
    handler: getBookings
});
