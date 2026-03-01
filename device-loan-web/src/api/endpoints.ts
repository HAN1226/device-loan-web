const INVENTORY_BASE = import.meta.env.VITE_INVENTORY_API as string;
const BOOKING_BASE = import.meta.env.VITE_BOOKING_API as string;

export const endpoints = {
  base: {
    inventory: INVENTORY_BASE,
    booking: BOOKING_BASE,
  },
  inventory: {
    listDevices: '/getDevices',
  },
  booking: {
    login: '/login',
    bookings: '/bookings',
    manage: (id: string, action: 'collect' | 'return') => `/bookings/${id}/${action}`,
  },
};

export type BookingAction = 'collect' | 'return';
