import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types/event.types';
import { registrationsService } from '../services/registrations.service';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Registrations.css';
import '../styles/Wellness.css';

/**
 * MyRegistrations - Página para ver inscripciones del usuario
 *
 * Muestra:
 * - Vista resumida: Lista de inscripciones como tarjetas simples
 * - Vista detalle: QR code, wellness assessments, y acciones
 */
const MyRegistrations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

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

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await registrationsService.getMyRegistrations();
      setRegistrations(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;

    try {
      await registrationsService.cancel(registrationId);
      navigate('/my-registrations');
      await loadRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar inscripción');
    }
  };

  const getStatusBadge = (registration: Registration) => {
    const preAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'PRE',
    );
    const postAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'POST',
    );

    if (postAssessment?.status === 'COMPLETED') {
      return <span className="status-badge completed">✅ Completado</span>;
    }
    if (registration.attendance?.attended) {
      return (
        <span className="status-badge attended">🎯 Asistido - POST pendiente</span>
      );
    }
    if (preAssessment?.status === 'COMPLETED') {
      return <span className="status-badge pre-done">📋 PRE completado</span>;
    }
    return <span className="status-badge pending">⏳ PRE pendiente</span>;
  };

  const getPendingAction = (registration: Registration) => {
    const preAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'PRE',
    );
    const postAssessment = registration.wellnessAssessments.find(
      (w) => w.type === 'POST',
    );

    if (preAssessment?.status === 'PENDING') {
      return (
        <button
          onClick={() => navigate(`/wellness/${preAssessment.id}`)}
          className="btn-action btn-wellness"
        >
          📝 Completar PRE
        </button>
      );
    }

    if (postAssessment?.status === 'PENDING') {
      return (
        <button
          onClick={() => navigate(`/wellness/${postAssessment.id}`)}
          className="btn-action btn-wellness"
        >
          📝 Completar POST
        </button>
      );
    }

    if (postAssessment?.status === 'COMPLETED') {
      return (
        <button
          onClick={() => navigate(`/wellness/impact/${registration.id}`)}
          className="btn-action btn-impact"
        >
          📊 Ver Impacto
        </button>
      );
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isInstancePast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const handleCardClick = (registrationId: string) => {
    navigate(`/my-registrations/${registrationId}`);
  };

  const handleBackToList = () => {
    navigate('/my-registrations');
  };

  // Vista de detalle de una inscripción específica
  if (selectedRegistration) {
    const preAssessment = selectedRegistration.wellnessAssessments.find(w => w.type === 'PRE');
    const postAssessment = selectedRegistration.wellnessAssessments.find(w => w.type === 'POST');

    return (
      <div className="layout-with-sidebar">
        <Sidebar onLogout={handleLogout} />
        
        <div className="main-content">
          <div className="dashboard-content-wrapper">
            <button onClick={handleBackToList} className="btn-back">
              ← Volver a Mis Inscripciones
            </button>

            <div className="registration-detail-card">
              <div className="detail-header">
                <h2 className="detail-title">{selectedRegistration.event.name}</h2>
                <p className="detail-subtitle">
                  🏋️ {selectedRegistration.event.exerciseType.name}
                </p>
                {getStatusBadge(selectedRegistration)}
              </div>

              <div className="detail-sections">
                {/* Información del evento */}
                <div className="detail-section">
                  <h4>📅 Información del Evento</h4>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {formatDate(selectedRegistration.eventInstance.dateTime)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <span className="detail-text">
                      {formatTime(selectedRegistration.eventInstance.dateTime)}
                    </span>
                  </div>
                </div>

                {/* Código QR */}
                <div className="detail-section">
                  <h4>🎫 Tu Código QR</h4>
                  <div className="qr-code-large">
                    <code>{selectedRegistration.qrCode}</code>
                  </div>
                  <p className="qr-hint" style={{ marginTop: '12px', textAlign: 'center', color: '#7f8c8d', fontSize: '14px' }}>
                    Presenta este código al llegar al evento
                  </p>
                </div>

                {/* Estado Wellness */}
                <div className="detail-section">
                  <h4>🌟 Evaluaciones Wellness</h4>
                  <div className="wellness-section">
                    {preAssessment && (
                      <div className="wellness-item">
                        <div className="wellness-item-info">
                          <span className="wellness-item-type">📋 PRE</span>
                          <span className="wellness-item-status">
                            {preAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        {preAssessment.status === 'PENDING' && (
                          <button
                            onClick={() => navigate(`/wellness/${preAssessment.id}`)}
                            className="btn-action btn-wellness"
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    )}
                    {postAssessment && (
                      <div className="wellness-item">
                        <div className="wellness-item-info">
                          <span className="wellness-item-type">📝 POST</span>
                          <span className="wellness-item-status">
                            {postAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        {postAssessment.status === 'PENDING' && (
                          <button
                            onClick={() => navigate(`/wellness/${postAssessment.id}`)}
                            className="btn-action btn-wellness"
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="registration-actions" style={{ marginTop: '20px' }}>
                  {getPendingAction(selectedRegistration)}

                  {!selectedRegistration.attendance?.attended &&
                    !isInstancePast(selectedRegistration.eventInstance.dateTime) && (
                      <button
                        onClick={() => handleCancelRegistration(selectedRegistration.id)}
                        className="btn-action btn-cancel"
                      >
                        ❌ Cancelar Inscripción
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista resumida
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
                <div 
                  key={registration.id} 
                  className="registration-card registration-card-compact"
                  onClick={() => handleCardClick(registration.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="registration-header">
                    <h3>{registration.event.name}</h3>
                    {getStatusBadge(registration)}
                  </div>

                  <div className="registration-info">
                    <p className="event-type">
                      🏋️ {registration.event.exerciseType.name}
                    </p>
                    <p className="event-date">
                      📅 {formatDate(registration.eventInstance.dateTime)}
                    </p>
                    <p className="event-time">
                      🕐 {formatTime(registration.eventInstance.dateTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;
