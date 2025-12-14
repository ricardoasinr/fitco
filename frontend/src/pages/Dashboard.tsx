import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
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
          <h1>FITCO</h1>
          <span className="role-badge">{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.name}!</h2>
          <p>Email: {user?.email}</p>
          <p className="user-info">You are logged in as a <strong>{user?.role}</strong></p>
        </div>

        <div className="info-card">
          <h3>Card 1</h3>
          <ul className="feature-list">
            <li>Item de relleno 1</li>
            <li>Item de relleno 2</li>
            <li>Item de relleno 3</li>
            <li>Item de relleno 4</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Card 2</h3>
          <ul className="feature-list">
            <li>Item de relleno 1</li>
            <li>Item de relleno 2</li>
            <li>Item de relleno 3</li>
            <li>Item de relleno 4</li>
          </ul>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="info-card admin-card">
            <h3>👑 Admin Access</h3>
            <p>As an admin, you have access to the admin panel.</p>
            <button 
              onClick={() => navigate('/admin')} 
              className="btn-primary"
            >
              Go to Admin Panel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

