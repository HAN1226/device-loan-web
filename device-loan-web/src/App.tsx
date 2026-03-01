import { useEffect, useState } from 'react';
import './App.css';
import { Device, Booking, User } from './types';
import { DevicesService } from './api/services/devices.service';
import { BookingsService } from './api/services/bookings.service';
import { AuthService } from './api/services/auth.service';
import { useRequest } from './hooks/useRequest';
import { setClientPage } from './api/apiClient';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Login State
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"student" | "staff">("student");

  // page name for request tracing
  useEffect(() => {
    setClientPage('Home');
  }, []);

  const devicesReq = useRequest<Device[]>(async (signal) => {
    return DevicesService.list(signal);
  }, []);

  const bookingsReq = useRequest<Booking[], [string]>(async (signal, token: string) => {
    return BookingsService.list(token, signal);
  }, []);

  useEffect(() => {
    devicesReq.run().then((data) => {
      if (data) setDevices(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      bookingsReq.run(user.token).then((data) => {
        if (data) setBookings(data);
      });
    } else {
      setBookings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
  };

  const reloadDevices = async () => {
    const data = await devicesReq.run();
    if (data) setDevices(data);
  };

  const reloadBookings = async () => {
    if (!user) return;
    const data = await bookingsReq.run(user.token);
    if (data) setBookings(data);
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      showNotify("Please enter a username", 'error');
      return;
    }
    try {
      const userData = await AuthService.login(username, role);
      setUser(userData);
      showNotify(`Welcome, ${userData.username}!`);
    } catch {
      showNotify("Login failed", 'error');
    }
  };

  const handleReserve = async (device: Device) => {
    if (!user) {
      showNotify("Please login first", 'error');
      return;
    }
    try {
      setLoadingAction(true);
      await BookingsService.create(user.token, device.partitionKey, device.rowKey);
      await reloadDevices();
      await reloadBookings();
      showNotify("Reservation successful!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showNotify("Reservation failed: " + msg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleManage = async (bookingId: string, action: "collect" | "return") => {
    if (!user) return;
    try {
      setLoadingAction(true);
      await BookingsService.manage(user.token, bookingId, action);
      await reloadBookings();
      await reloadDevices(); // Update inventory count
      showNotify(`Device ${action}ed successfully!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showNotify(`Failed to ${action}: ` + msg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <header className="app-header">
        <div className="logo">
          <h1>📱 Device Loan</h1>
        </div>
        {user ? (
          <div className="user-controls">
            <span className="user-badge">{user.username} <small>({user.role})</small></span>
            <button className="btn btn-outline" onClick={() => setUser(null)}>Logout</button>
          </div>
        ) : (
          <div className="login-controls">
            <input 
              className="input-field"
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
            <select className="select-field" value={role} onChange={e => setRole(e.target.value as 'student' | 'staff')}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
            <button className="btn btn-primary" onClick={handleLogin}>Login</button>
          </div>
        )}
      </header>

      <main className="main-content">
        <section className="section-inventory">
          <div className="section-header">
            <h2>Available Devices</h2>
            <p className="subtitle">Browse and reserve equipment for your projects.</p>
          </div>
          
          {devicesReq.loading && (
            <div className="loading-state">Loading devices...</div>
          )}
          {!devicesReq.loading && devicesReq.error && (
            <div className="error-state">
              <div>{devicesReq.error.message}</div>
              <button className="btn btn-outline" onClick={reloadDevices}>Retry</button>
            </div>
          )}
          {!devicesReq.loading && !devicesReq.error && devices.length === 0 && (
            <div className="empty-state">No devices available.</div>
          )}
          {!devicesReq.loading && !devicesReq.error && devices.length > 0 && (
          <div className="device-grid">
            {devices.map((d, i) => (
              <div key={i} className="device-card">
                <div className="card-icon">{d.category === 'Laptop' ? '💻' : '📱'}</div>
                <div className="card-body">
                  <h3>{d.rowKey}</h3>
                  <p className="brand">{d.partitionKey}</p>
                  <div className="stock-info">
                    <span className={`badge ${d.availableQuantity > 0 ? 'available' : 'out-stock'}`}>
                      {d.availableQuantity} / {d.totalQuantity} Available
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn btn-block btn-primary"
                    onClick={() => handleReserve(d)} 
                    disabled={loadingAction || d.availableQuantity === 0}
                  >
                    {d.availableQuantity > 0 ? 'Reserve Now' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        {user && (
          <section className="section-bookings">
             <div className="section-header">
              <h2>My Bookings</h2>
              <p className="subtitle">Manage your active reservations and loans.</p>
            </div>
            
            <div className="table-container">
              {bookingsReq.loading && (
                <div className="loading-state">Loading bookings...</div>
              )}
              {!bookingsReq.loading && bookingsReq.error && (
                <div className="error-state">
                  <div>{bookingsReq.error.message}</div>
                  <button className="btn btn-outline" onClick={reloadBookings}>Retry</button>
                </div>
              )}
              {!bookingsReq.loading && !bookingsReq.error && (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Reservation Date</th>
                    <th>Return Date</th>
                    {user.role === 'staff' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No bookings found.</td></tr>
                  ) : bookings.map((b, i) => (
                    <tr key={i}>
                      <td>
                        <div className="device-info-cell">
                          <span className="icon">{b.brand === 'Apple' ? '🍎' : '💻'}</span>
                          <div>
                            <span className="model-name">{b.brand} {b.model}</span>
                            <span className="booking-id">ID: {b.rowKey.substring(0, 6)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                      </td>
                      <td>{new Date(b.reservationDate).toLocaleDateString()}</td>
                      <td>{b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '-'}</td>
                      {user.role === 'staff' && (
                        <td>
                          <div className="action-buttons">
                            {b.status === 'Reserved' && (
                              <button className="btn btn-sm btn-success" onClick={() => handleManage(b.rowKey, 'collect')} disabled={loadingAction}>Collect</button>
                            )}
                            {b.status === 'Collected' && (
                              <button className="btn btn-sm btn-warning" onClick={() => handleManage(b.rowKey, 'return')} disabled={loadingAction}>Return</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
