import { TableClient } from "@azure/data-tables";

const connectionString = process.env.AzureWebJobsStorage || "UseDevelopmentStorage=true";

export const deviceClient = TableClient.fromConnectionString(connectionString, "Devices");

export interface DeviceEntity {
    partitionKey: string; // Brand
    rowKey: string; // Model
    category: string;
    totalQuantity: number;
    availableQuantity: number;
}

export const initDatabase = async () => {
    await deviceClient.createTable();
    // Seed initial data if empty
    try {
        const iterator = deviceClient.listEntities();
        const first = await iterator.next();
        if (first.done) {
            console.log("Seeding database...");
            const devices: DeviceEntity[] = [
                { partitionKey: "Apple", rowKey: "iPhone 13", category: "Phone", totalQuantity: 10, availableQuantity: 10 },
                { partitionKey: "Samsung", rowKey: "Galaxy S21", category: "Phone", totalQuantity: 8, availableQuantity: 8 },
                { partitionKey: "Dell", rowKey: "XPS 15", category: "Laptop", totalQuantity: 5, availableQuantity: 5 },
                { partitionKey: "Apple", rowKey: "MacBook Pro", category: "Laptop", totalQuantity: 3, availableQuantity: 3 },
            ];
            for (const device of devices) {
                await deviceClient.createEntity(device);
            }
        }
    } catch (e) {
        console.error("Error initializing database:", e);
    }
};
