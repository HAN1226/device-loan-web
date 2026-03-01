import type { User } from '../../types';
import { createApiClient, setClientPage } from '../apiClient';
import { endpoints } from '../endpoints';

const client = createApiClient({
  baseURL: endpoints.base.booking,
});

export const AuthService = {
  async login(username: string, role: 'student' | 'staff'): Promise<User> {
    setClientPage('Home');
    return client.post<User>(endpoints.booking.login, { username, role });
  },
};
