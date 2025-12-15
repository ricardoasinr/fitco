import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import ExerciseTypeManager from '../components/ExerciseTypeManager';
import '../styles/Dashboard.css';

/**
 * ExerciseTypeManagement - Página de administración de tipos de ejercicio (ADMIN only)
 */
const ExerciseTypeManagement: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout-with-sidebar">
      <AdminSidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">Gestión de Tipos de Ejercicio</h1>
          </div>

          <div className="admin-section-content">
            <ExerciseTypeManager />
          </div>
        </div>
      </div>

      <style>{`
        .admin-section-content {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ExerciseTypeManagement;

