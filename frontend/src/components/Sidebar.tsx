import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">FITCO</h1>
        <span className="sidebar-role-badge">{user?.role}</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="sidebar-icon">🏠</span>
          <span>Inicio</span>
        </button>

        <button
          className={`sidebar-item ${isActive('/events') ? 'active' : ''}`}
          onClick={() => navigate('/events')}
        >
          <span className="sidebar-icon">📅</span>
          <span>Ver Eventos</span>
        </button>

        <button
          className={`sidebar-item ${isActive('/my-registrations') ? 'active' : ''}`}
          onClick={() => navigate('/my-registrations')}
        >
          <span className="sidebar-icon">🎫</span>
          <span>Mis Inscripciones</span>
        </button>

        <button
          className={`sidebar-item ${isActive('/wellness-evaluations') ? 'active' : ''}`}
          onClick={() => navigate('/wellness-evaluations')}
        >
          <span className="sidebar-icon">🌟</span>
          <span>Wellness Evaluation</span>
        </button>

        {user?.role === 'ADMIN' && (
          <>
            <div className="sidebar-divider"></div>
            <button
              className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <span className="sidebar-icon">👑</span>
              <span>Admin Panel</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button onClick={onLogout} className="sidebar-logout">
          <span className="sidebar-icon">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

