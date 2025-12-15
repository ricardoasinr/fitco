import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WellnessAssessment, WellnessImpactResponse } from '../types/event.types';
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
 * - Lista de evaluaciones realizadas con sus métricas
 * - Información del evento asociado
 * - Acciones para completar evaluaciones
 */
const WellnessEvaluations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pendingEvaluations, setPendingEvaluations] = useState<WellnessAssessment[]>([]);
  const [completedEvaluations, setCompletedEvaluations] = useState<WellnessAssessment[]>([]);
  const [impacts, setImpacts] = useState<Map<string, WellnessImpactResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWellnessEvaluations();
  }, []);

  const loadWellnessEvaluations = async () => {
    try {
      setLoading(true);
      const [pending, completed] = await Promise.all([
        wellnessService.getPendingEvaluations(),
        wellnessService.getCompletedEvaluations(),
      ]);
      setPendingEvaluations(pending);
      setCompletedEvaluations(completed);
      
      // Cargar impactos para las evaluaciones completadas
      const impactsMap = new Map<string, WellnessImpactResponse>();
      const registrationIds = new Set<string>();
      
      // Agrupar evaluaciones por registrationId
      completed.forEach((evaluation) => {
        if (evaluation.registrationId) {
          registrationIds.add(evaluation.registrationId);
        }
      });
      
      // Cargar impactos en paralelo
      const impactPromises = Array.from(registrationIds).map(async (registrationId) => {
        try {
          const impact = await wellnessService.getImpact(registrationId);
          impactsMap.set(registrationId, impact);
        } catch (error) {
          // Si no hay impacto disponible (por ejemplo, falta PRE o POST), ignorar
          console.log(`No impact available for registration ${registrationId}`);
        }
      });
      
      await Promise.all(impactPromises);
      setImpacts(impactsMap);
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
      timeZone: 'UTC',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
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
          ) : pendingEvaluations.length === 0 && completedEvaluations.length === 0 ? (
            <div className="empty-state-card">
              <h3>✅ ¡Estás al día!</h3>
              <p>No tienes evaluaciones en este momento</p>
              <button 
                onClick={() => navigate('/events')} 
                className="btn-primary" 
                style={{ marginTop: '20px', maxWidth: '250px' }}
              >
                Explorar Eventos
              </button>
            </div>
          ) : (
            <>
              {/* Evaluaciones Pendientes */}
              {pendingEvaluations.length === 0 ? (
                <div className="empty-state-card" style={{ marginBottom: '30px' }}>
                  <h3>✅ ¡Estás al día!</h3>
                  <p>No tienes evaluaciones pendientes en este momento</p>
                </div>
              ) : (
                <div className="evaluations-subsection">
                  <h2 className="subsection-title">⏳ Pendientes</h2>
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
                </div>
              )}

              {/* Evaluaciones Realizadas */}
              {completedEvaluations.filter(evaluation => evaluation.type === 'POST').length > 0 && (
                <div className="evaluations-subsection">
                  <h2 className="subsection-title">✅ Realizadas</h2>
                  <div className="wellness-evaluations-grid">
                    {completedEvaluations
                      .filter(evaluation => evaluation.type === 'POST')
                      .map((evaluation) => {
                        const impact = impacts.get(evaluation.registrationId);
                        const hasImpact = impact && impact.preAssessment && impact.postAssessment;
                        
                        return (
                          <div key={evaluation.id} className="wellness-evaluation-card completed">
                            <div className="evaluation-event-info">
                              <h3>{evaluation.registration?.event.name}</h3>
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

                          {hasImpact && impact.preAssessment && impact.postAssessment ? (
                            <div className="evaluation-impact-summary">
                              {impact.impact.sleepQualityChange !== null && impact.preAssessment.sleepQuality !== null && impact.postAssessment.sleepQuality !== null && (
                                <div className="impact-metric-item">
                                  <span className="impact-label">😴 Calidad de Sueño</span>
                                  <div className="impact-values">
                                    <span className="impact-value">{impact.preAssessment.sleepQuality}</span>
                                    <span className="impact-arrow">→</span>
                                    <span className="impact-value">{impact.postAssessment.sleepQuality}</span>
                                    <span className={`impact-change ${impact.impact.sleepQualityChange >= 0 ? 'positive' : 'negative'}`}>
                                      {impact.impact.sleepQualityChange >= 0 ? '↑' : '↓'} {Math.abs(impact.impact.sleepQualityChange).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {impact.impact.stressLevelChange !== null && impact.preAssessment.stressLevel !== null && impact.postAssessment.stressLevel !== null && (
                                <div className="impact-metric-item">
                                  <span className="impact-label">😰 Nivel de Estrés</span>
                                  <div className="impact-values">
                                    <span className="impact-value">{impact.preAssessment.stressLevel}</span>
                                    <span className="impact-arrow">→</span>
                                    <span className="impact-value">{impact.postAssessment.stressLevel}</span>
                                    <span className={`impact-change ${impact.impact.stressLevelChange >= 0 ? 'positive' : 'negative'}`}>
                                      {impact.impact.stressLevelChange >= 0 ? '↓' : '↑'} {impact.impact.stressLevelChange >= 0 ? '-' : '+'}{Math.abs(impact.impact.stressLevelChange).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {impact.impact.moodChange !== null && impact.preAssessment.mood !== null && impact.postAssessment.mood !== null && (
                                <div className="impact-metric-item">
                                  <span className="impact-label">😊 Estado de Ánimo</span>
                                  <div className="impact-values">
                                    <span className="impact-value">{impact.preAssessment.mood}</span>
                                    <span className="impact-arrow">→</span>
                                    <span className="impact-value">{impact.postAssessment.mood}</span>
                                    <span className={`impact-change ${impact.impact.moodChange >= 0 ? 'positive' : 'negative'}`}>
                                      {impact.impact.moodChange >= 0 ? '↑' : '↓'} {Math.abs(impact.impact.moodChange).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="evaluation-metrics">
                              {evaluation.sleepQuality !== null && (
                                <div className="metric-item">
                                  <span className="metric-label">Calidad del Sueño:</span>
                                  <span className="metric-value">{evaluation.sleepQuality}/10</span>
                                </div>
                              )}
                              {evaluation.stressLevel !== null && (
                                <div className="metric-item">
                                  <span className="metric-label">Nivel de Estrés:</span>
                                  <span className="metric-value">{evaluation.stressLevel}/10</span>
                                </div>
                              )}
                              {evaluation.mood !== null && (
                                <div className="metric-item">
                                  <span className="metric-label">Estado de Ánimo:</span>
                                  <span className="metric-value">{evaluation.mood}/10</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="evaluation-completed-date">
                            <span className="detail-icon">📝</span>
                            <span className="detail-text">
                              Completada el {formatDate(evaluation.updatedAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellnessEvaluations;

