import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { generateToken } from "../utils";

export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { username: string, role: "student" | "staff" };
        
        if (!body.username || !body.role) {
            return { status: 400, body: "Missing username or role" };
        }

        const token = generateToken({ userId: body.username, role: body.role });

        return {
            status: 200,
            jsonBody: { token, role: body.role, username: body.username }
        };
    } catch (error) {
        return { status: 400, body: "Invalid request" };
    }
}

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: login
});
