import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>FITCO Admin</h1>
          <span className="role-badge role-admin">ADMIN</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card admin-card">
          <h2>👑 Admin Panel</h2>
          <p>Welcome, {user?.name}</p>
          <p className="user-info">Email: {user?.email}</p>
        </div>

        <div className="info-card">
          <h3>🔐 Admin Features</h3>
          <p>This panel is only accessible to administrators.</p>
          <ul className="feature-list">
            <li>✅ Role-based access control working</li>
            <li>✅ Protected admin routes</li>
            <li>✅ JWT validation</li>
            <li>✅ User role verification</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📊 Admin Capabilities (Future)</h3>
          <p>Features to be implemented:</p>
          <ul className="feature-list">
            <li>👥 User management</li>
            <li>📅 Session creation and management</li>
            <li>✅ Mark session attendance</li>
            <li>📈 View aggregated impact reports</li>
            <li>📊 Analytics and metrics dashboard</li>
          </ul>
        </div>

        <div className="info-card">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

