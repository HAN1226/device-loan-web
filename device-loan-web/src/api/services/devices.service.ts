import type { Device } from '../../types';
import { createApiClient, setClientPage } from '../apiClient';
import { endpoints } from '../endpoints';

const client = createApiClient({
  baseURL: endpoints.base.inventory,
});

export const DevicesService = {
  async list(signal?: AbortSignal): Promise<Device[]> {
    setClientPage('Home');
    return client.get<Device[]>(endpoints.inventory.listDevices, { signal });
  },
};
