import type { Booking } from '../../types';
import { createApiClient, setClientPage } from '../apiClient';
import { endpoints, BookingAction } from '../endpoints';

const client = createApiClient({
  baseURL: endpoints.base.booking,
});

export const BookingsService = {
  async list(token: string, signal?: AbortSignal): Promise<Booking[]> {
    setClientPage('Home');
    return client.get<Booking[]>(endpoints.booking.bookings, { tokenOverride: token, signal });
  },
  async create(token: string, brand: string, model: string): Promise<void> {
    setClientPage('Home');
    return client.post<void>(endpoints.booking.bookings, { brand, model }, { tokenOverride: token });
  },
  async manage(token: string, bookingId: string, action: BookingAction): Promise<void> {
    setClientPage('Home');
    return client.put<void>(endpoints.booking.manage(bookingId, action), undefined, { tokenOverride: token });
  },
};
