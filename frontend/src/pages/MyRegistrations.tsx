import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types/event.types';
import Sidebar from '../components/Sidebar';
import { RegistrationCard } from '../components/registrations/RegistrationCard';
import { RegistrationDetail } from '../components/registrations/RegistrationDetail';
import { useRegistrations } from '../hooks/useRegistrations';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Registrations.css';
import '../styles/Wellness.css';

/**
 * MyRegistrations - Página para ver inscripciones del usuario
 *
 * Refactorizada para SOLID y Clean Code:
 * - Lógica de datos extraída a useRegistrations
 * - Lógica de QR extraída a useQRDownload
 * - UI dividida en componentes pequeños (RegistrationCard, RegistrationDetail)
 */
const MyRegistrations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    registrations,
    loading,
    error,
    cancelRegistration
  } = useRegistrations();

  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    if (id && registrations.length > 0) {
      const registration = registrations.find(r => r.id === id);
      if (registration) {
        setSelectedRegistration(registration);
      }
    } else {
      setSelectedRegistration(null);
    }
  }, [id, registrations]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCardClick = (registrationId: string) => {
    navigate(`/my-registrations/${registrationId}`);
  };

  const handleBackToList = () => {
    navigate('/my-registrations');
  };

  const handleCancel = async (registrationId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;

    const success = await cancelRegistration(registrationId);
    if (success) {
      navigate('/my-registrations');
    }
  };

  // Vista de detalle
  if (selectedRegistration) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar onLogout={handleLogout} />
        <div className="main-content">
          <RegistrationDetail
            registration={selectedRegistration}
            onBack={handleBackToList}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="layout-with-sidebar">
      <Sidebar onLogout={handleLogout} />

      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">🎫 Mis Inscripciones</h1>
            <p style={{ color: '#666', marginTop: '15px', fontSize: '16px' }}>
              Haz clic en una inscripción para ver los detalles y tu código QR
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-card">
              <div className="loading">Cargando inscripciones...</div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="empty-state-card">
              <h3>📭 No tienes inscripciones</h3>
              <p>Explora los eventos disponibles y regístrate</p>
              <button onClick={() => navigate('/events')} className="btn-primary" style={{ marginTop: '20px', maxWidth: '250px' }}>
                Ver Eventos
              </button>
            </div>
          ) : (
            <div className="registrations-grid">
              {registrations.map((registration) => (
                <RegistrationCard
                  key={registration.id}
                  registration={registration}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;
