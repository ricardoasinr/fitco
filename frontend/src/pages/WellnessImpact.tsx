import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WellnessImpactResponse, Registration } from '../types/event.types';
import { wellnessService } from '../services/wellness.service';
import { registrationsService } from '../services/registrations.service';
import '../styles/Dashboard.css';
import '../styles/Registrations.css';

/**
 * WellnessImpact - Página para mostrar el impacto wellness
 * 
 * Muestra:
 * - Comparación PRE vs POST
 * - Cambios en cada métrica
 * - Impacto general
 */
const WellnessImpact: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [impact, setImpact] = useState<WellnessImpactResponse | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [registrationId]);

  const loadData = async () => {
    if (!registrationId) return;
    
    try {
      setLoading(true);
      const [impactData, regData] = await Promise.all([
        wellnessService.getImpact(registrationId),
        registrationsService.getById(registrationId),
      ]);
      setImpact(impactData);
      setRegistration(regData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los datos de impacto');
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
      day: 'numeric'
    });
  };

  const getChangeClass = (change: number | null, inverse: boolean = false) => {
    if (change === null) return 'neutral';
    const effectiveChange = inverse ? -change : change;
    if (effectiveChange > 0) return 'positive';
    if (effectiveChange < 0) return 'negative';
    return 'neutral';
  };

  const getChangeIcon = (change: number | null, inverse: boolean = false) => {
    if (change === null) return '—';
    const effectiveChange = inverse ? -change : change;
    if (effectiveChange > 0) return `↑ +${Math.abs(change)}`;
    if (effectiveChange < 0) return `↓ ${change}`;
    return '= 0';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando impacto wellness...</div>
      </div>
    );
  }

  if (!impact || !registration) {
    return (
      <div className="dashboard-container">
        <div className="error-message">Datos no encontrados</div>
      </div>
    );
  }

  const hasCompleteData = impact.preAssessment && impact.postAssessment;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>📊 Impacto Wellness</h1>
          <span className="role-badge">{user?.role}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/my-registrations')} className="btn-secondary">
            Mis Inscripciones
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="impact-container">
          <div className="impact-card">
            <h2>Tu Impacto Wellness</h2>
            <p className="subtitle">
              {registration.event.name} - {formatDate(registration.event.date)}
            </p>

            {!hasCompleteData ? (
              <div className="empty-state">
                <h3>📊 Datos incompletos</h3>
                <p>
                  Para ver tu impacto wellness, necesitas completar tanto la evaluación PRE como POST evento.
                </p>
                {!impact.preAssessment?.sleepQuality && (
                  <p>⏳ Evaluación PRE pendiente</p>
                )}
                {!impact.postAssessment?.sleepQuality && (
                  <p>⏳ Evaluación POST pendiente</p>
                )}
              </div>
            ) : (
              <>
                <div className="overall-impact">
                  <div className={`impact-value ${getChangeClass(impact.impact.overallImpact)}`}>
                    {impact.impact.overallImpact !== null 
                      ? (impact.impact.overallImpact > 0 ? '+' : '') + impact.impact.overallImpact.toFixed(1)
                      : '—'}
                  </div>
                  <div className="impact-label">Impacto General</div>
                </div>

                <div className="metrics-comparison">
                  <div className="metric-comparison">
                    <h4>😴 Calidad de Sueño</h4>
                    <div className="comparison-values">
                      <span className="pre-value">{impact.preAssessment?.sleepQuality}</span>
                      <span className="arrow">→</span>
                      <span className="post-value">{impact.postAssessment?.sleepQuality}</span>
                    </div>
                    <div className={`change-value ${getChangeClass(impact.impact.sleepQualityChange)}`}>
                      {getChangeIcon(impact.impact.sleepQualityChange)}
                    </div>
                  </div>

                  <div className="metric-comparison">
                    <h4>😰 Nivel de Estrés</h4>
                    <div className="comparison-values">
                      <span className="pre-value">{impact.preAssessment?.stressLevel}</span>
                      <span className="arrow">→</span>
                      <span className="post-value">{impact.postAssessment?.stressLevel}</span>
                    </div>
                    <div className={`change-value ${getChangeClass(impact.impact.stressLevelChange, true)}`}>
                      {getChangeIcon(impact.impact.stressLevelChange, true)}
                      <small style={{ marginLeft: '4px', opacity: 0.7 }}>(menos es mejor)</small>
                    </div>
                  </div>

                  <div className="metric-comparison">
                    <h4>😊 Estado de Ánimo</h4>
                    <div className="comparison-values">
                      <span className="pre-value">{impact.preAssessment?.mood}</span>
                      <span className="arrow">→</span>
                      <span className="post-value">{impact.postAssessment?.mood}</span>
                    </div>
                    <div className={`change-value ${getChangeClass(impact.impact.moodChange)}`}>
                      {getChangeIcon(impact.impact.moodChange)}
                    </div>
                  </div>
                </div>

                <div className="impact-summary">
                  {impact.impact.overallImpact !== null && impact.impact.overallImpact > 0 ? (
                    <p className="summary-text positive">
                      🎉 ¡Excelente! El evento tuvo un impacto positivo en tu bienestar.
                    </p>
                  ) : impact.impact.overallImpact !== null && impact.impact.overallImpact < 0 ? (
                    <p className="summary-text negative">
                      💪 Sigue participando en eventos wellness para mejorar tu bienestar.
                    </p>
                  ) : (
                    <p className="summary-text neutral">
                      📊 Tu bienestar se mantuvo estable durante el evento.
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="wellness-form-actions" style={{ marginTop: '32px' }}>
              <button 
                onClick={() => navigate('/my-registrations')}
                className="btn-back"
                style={{ flex: 1 }}
              >
                ← Volver a Mis Inscripciones
              </button>
              <button 
                onClick={() => navigate('/events')}
                className="btn-submit"
                style={{ flex: 1 }}
              >
                🎯 Ver Más Eventos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessImpact;

