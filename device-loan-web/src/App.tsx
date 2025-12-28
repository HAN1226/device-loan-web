import { useEffect, useState } from 'react';
import './App.css';
import { api } from './api';
import { Device, Booking, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Login State
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"student" | "staff">("student");

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
    }
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

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const data = await api.getBookings(user.token);
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      showNotify("Please enter a username", 'error');
      return;
    }
    try {
      const userData = await api.login(username, role);
      setUser(userData);
      showNotify(`Welcome, ${userData.username}!`);
    } catch (err) {
      showNotify("Login failed", 'error');
    }
  };

  const handleReserve = async (device: Device) => {
    if (!user) {
      showNotify("Please login first", 'error');
      return;
    }
    try {
      setLoading(true);
      await api.createBooking(user.token, device.partitionKey, device.rowKey);
      await fetchDevices();
      await fetchBookings();
      showNotify("Reservation successful!");
    } catch (err: any) {
      showNotify("Reservation failed: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async (bookingId: string, action: "collect" | "return") => {
    if (!user) return;
    try {
      setLoading(true);
      await api.manageBooking(user.token, bookingId, action);
      await fetchBookings();
      await fetchDevices(); // Update inventory count
      showNotify(`Device ${action}ed successfully!`);
    } catch (err: any) {
      showNotify(`Failed to ${action}: ` + err.message, 'error');
    } finally {
      setLoading(false);
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
            <select className="select-field" value={role} onChange={e => setRole(e.target.value as any)}>
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
                    disabled={loading || d.availableQuantity === 0}
                  >
                    {d.availableQuantity > 0 ? 'Reserve Now' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {user && (
          <section className="section-bookings">
             <div className="section-header">
              <h2>My Bookings</h2>
              <p className="subtitle">Manage your active reservations and loans.</p>
            </div>
            
            <div className="table-container">
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
                              <button className="btn btn-sm btn-success" onClick={() => handleManage(b.rowKey, 'collect')} disabled={loading}>Collect</button>
                            )}
                            {b.status === 'Collected' && (
                              <button className="btn btn-sm btn-warning" onClick={() => handleManage(b.rowKey, 'return')} disabled={loading}>Return</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
