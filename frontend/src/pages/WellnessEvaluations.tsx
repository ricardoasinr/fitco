import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WellnessAssessment } from '../types/event.types';
import { wellnessService } from '../services/wellness.service';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Wellness.css';

/**
 * WellnessEvaluations - Página para gestionar evaluaciones PRE y POST
 * 
 * Muestra:
 * - Lista de evaluaciones pendientes (PRE y POST)
 * - Información del evento asociado
 * - Acciones para completar evaluaciones
 */
const WellnessEvaluations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pendingEvaluations, setPendingEvaluations] = useState<WellnessAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingEvaluations();
  }, []);

  const loadPendingEvaluations = async () => {
    try {
      setLoading(true);
      const data = await wellnessService.getPendingEvaluations();
      setPendingEvaluations(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar evaluaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const getEvaluationTypeLabel = (type: string) => {
    return type === 'PRE' ? '📋 Evaluación PRE' : '📝 Evaluación POST';
  };

  const getEvaluationTypeDescription = (type: string) => {
    return type === 'PRE' 
      ? 'Completa esta evaluación antes de asistir al evento'
      : 'Completa esta evaluación después de haber asistido';
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">🌟 Evaluaciones Wellness</h1>
            <p style={{ color: '#666', marginTop: '15px', fontSize: '16px' }}>
              Completa tus evaluaciones PRE y POST para medir el impacto de los eventos
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-card">
              <div className="loading">Cargando evaluaciones...</div>
            </div>
          ) : pendingEvaluations.length === 0 ? (
            <div className="empty-state-card">
              <h3>✅ ¡Estás al día!</h3>
              <p>No tienes evaluaciones pendientes en este momento</p>
              <button 
                onClick={() => navigate('/events')} 
                className="btn-primary" 
                style={{ marginTop: '20px', maxWidth: '250px' }}
              >
                Explorar Eventos
              </button>
            </div>
          ) : (
            <div className="wellness-evaluations-grid">
              {pendingEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="wellness-evaluation-card">
                  <div className="evaluation-header">
                    <div className="evaluation-type-badge" data-type={evaluation.type}>
                      {getEvaluationTypeLabel(evaluation.type)}
                    </div>
                    <span className="status-badge pending">⏳ Pendiente</span>
                  </div>

                  <div className="evaluation-event-info">
                    <h3>{evaluation.registration?.event.name}</h3>
                    <p className="evaluation-description">
                      {getEvaluationTypeDescription(evaluation.type)}
                    </p>
                  </div>

                  <div className="evaluation-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {evaluation.registration?.eventInstance
                          ? formatDate(evaluation.registration.eventInstance.dateTime)
                          : formatDate(evaluation.registration?.event.startDate || '')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🕐</span>
                      <span className="detail-text">
                        {evaluation.registration?.eventInstance
                          ? formatTime(evaluation.registration.eventInstance.dateTime)
                          : evaluation.registration?.event.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/wellness/${evaluation.id}`)}
                    className="btn-complete-evaluation"
                  >
                    Completar Evaluación
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellnessEvaluations;

