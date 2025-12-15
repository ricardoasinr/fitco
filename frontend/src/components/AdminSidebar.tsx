import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

interface AdminSidebarProps {
  onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin/events') {
      return location.pathname === '/admin' || location.pathname === '/admin/events';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">FITCO</h1>
        <span className="sidebar-role-badge admin">ADMIN</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${isActive('/admin/events') ? 'active' : ''}`}
          onClick={() => navigate('/admin/events')}
        >
          <span className="sidebar-icon">🏠</span>
          <span>Inicio</span>
        </button>

        <button
          className={`sidebar-item ${isActive('/admin/attendance') ? 'active' : ''}`}
          onClick={() => navigate('/admin/events')}
          title="Selecciona un evento para ver asistencia"
        >
          <span className="sidebar-icon">✅</span>
          <span>Asistencia</span>
        </button>

        <button
          className={`sidebar-item ${isActive('/admin/exercise-types') ? 'active' : ''}`}
          onClick={() => navigate('/admin/exercise-types')}
        >
          <span className="sidebar-icon">🏋️</span>
          <span>Ejercicios</span>
        </button>
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

export default AdminSidebar;

