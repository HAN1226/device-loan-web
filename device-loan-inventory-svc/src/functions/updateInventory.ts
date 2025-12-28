import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { deviceClient, initDatabase } from "../db";

export async function updateInventory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function processed request for updateInventory.');

    // Ensure DB is initialized
    await initDatabase();

    const { brand, model, change } = await request.json() as { brand: string, model: string, change: number };

    if (!brand || !model || change === undefined) {
        return { status: 400, body: "Missing brand, model, or change amount" };
    }

    try {
        const device = await deviceClient.getEntity(brand, model) as any;
        
        const newQuantity = device.availableQuantity + change;

        if (newQuantity < 0 || newQuantity > device.totalQuantity) {
            return { status: 409, body: "Inventory update failed: Invalid quantity" };
        }

        device.availableQuantity = newQuantity;
        await deviceClient.updateEntity(device);

        return {
            status: 200,
            jsonBody: { success: true, newAvailableQuantity: newQuantity }
        };
    } catch (error) {
        context.error("Error updating inventory", error);
        return { status: 404, body: "Device not found or error updating" };
    }
}

app.http('updateInventory', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: updateInventory
});
