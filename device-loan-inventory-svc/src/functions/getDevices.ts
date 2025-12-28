import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { deviceClient, initDatabase } from "../db";

export async function getDevices(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function processed request for getDevices.');
    
    // Ensure DB is initialized (simple lazy init for demo)
    await initDatabase();

    const devices = [];
    try {
        for await (const entity of deviceClient.listEntities()) {
            devices.push(entity);
        }
        return {
            status: 200,
            jsonBody: devices
        };
    } catch (error) {
        context.error("Error fetching devices", error);
        return {
            status: 500,
            body: "Internal Server Error"
        };
    }
}

app.http('getDevices', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getDevices
});
