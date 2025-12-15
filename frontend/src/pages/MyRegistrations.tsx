import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types/event.types';
import { registrationsService } from '../services/registrations.service';
import '../styles/Dashboard.css';
import '../styles/Registrations.css';

/**
 * MyRegistrations - Página para ver inscripciones del usuario
 *
 * Muestra:
 * - Lista de inscripciones con QR code
 * - Fecha/hora de la instancia seleccionada
 * - Estado de wellness assessments
 * - Estado de asistencia
 * - Acciones disponibles
 */
const MyRegistrations: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

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

  const handleCancelRegistration = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;

    try {
      await registrationsService.cancel(id);
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>🎫 Mis Inscripciones</h1>
          <span className="role-badge">{user?.role}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/events')} className="btn-secondary">
            Ver Eventos
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Dashboard
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Tus Inscripciones</h2>
          <p>Gestiona tus inscripciones a eventos wellness y completa tus evaluaciones</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando inscripciones...</div>
        ) : registrations.length === 0 ? (
          <div className="empty-state">
            <h3>📭 No tienes inscripciones</h3>
            <p>Explora los eventos disponibles y regístrate</p>
            <button onClick={() => navigate('/events')} className="btn-primary">
              Ver Eventos
            </button>
          </div>
        ) : (
          <div className="registrations-grid">
            {registrations.map((registration) => (
              <div key={registration.id} className="registration-card">
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

                <div className="qr-section">
                  <h4>Tu código QR</h4>
                  <div className="qr-code-display">
                    <code>{registration.qrCode}</code>
                  </div>
                  <p className="qr-hint">Presenta este código al llegar al evento</p>
                </div>

                <div className="wellness-status">
                  <h4>Estado Wellness</h4>
                  <div className="wellness-indicators">
                    {registration.wellnessAssessments.map((assessment) => (
                      <div
                        key={assessment.id}
                        className={`wellness-indicator ${assessment.status.toLowerCase()}`}
                      >
                        <span className="indicator-type">{assessment.type}</span>
                        <span className="indicator-status">
                          {assessment.status === 'COMPLETED' ? '✅' : '⏳'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="registration-actions">
                  {getPendingAction(registration)}

                  {!registration.attendance?.attended &&
                    !isInstancePast(registration.eventInstance.dateTime) && (
                      <button
                        onClick={() => handleCancelRegistration(registration.id)}
                        className="btn-action btn-cancel"
                      >
                        ❌ Cancelar
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRegistrations;
