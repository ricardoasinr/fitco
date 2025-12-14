import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WellnessAssessment } from '../types/event.types';
import { wellnessService } from '../services/wellness.service';
import '../styles/Dashboard.css';
import '../styles/Registrations.css';

/**
 * WellnessForm - Página para completar cuestionario de bienestar
 * 
 * Muestra:
 * - Información del evento
 * - Sliders para métricas (1-10)
 * - Botón para enviar evaluación
 */
const WellnessForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<WellnessAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState(5);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await wellnessService.getById(id);
      setAssessment(data);
      
      // Si ya está completado, mostrar valores
      if (data.status === 'COMPLETED') {
        setSleepQuality(data.sleepQuality || 5);
        setStressLevel(data.stressLevel || 5);
        setMood(data.mood || 5);
      }
      
      setError('');
    } catch (err: any) {
      setError('Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      await wellnessService.complete(id, {
        sleepQuality,
        stressLevel,
        mood,
      });
      navigate('/my-registrations');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  const getValueLabel = (value: number, type: string) => {
    if (type === 'stress') {
      if (value <= 3) return 'Bajo';
      if (value <= 6) return 'Moderado';
      return 'Alto';
    }
    if (value <= 3) return 'Malo';
    if (value <= 6) return 'Regular';
    if (value <= 8) return 'Bueno';
    return 'Excelente';
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando evaluación...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="dashboard-container">
        <div className="error-message">Evaluación no encontrada</div>
      </div>
    );
  }

  const isCompleted = assessment.status === 'COMPLETED';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <h1>
            {assessment.type === 'PRE' ? '📋 Evaluación PRE-Evento' : '📊 Evaluación POST-Evento'}
          </h1>
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
        <div className="wellness-form-container">
          <div className="wellness-form-card">
            <h2>
              {assessment.type === 'PRE' 
                ? '¿Cómo te sientes antes del evento?' 
                : '¿Cómo te sientes después del evento?'}
            </h2>
            <p className="subtitle">
              {assessment.type === 'PRE'
                ? 'Completa esta evaluación antes de asistir al evento'
                : 'Ayúdanos a medir el impacto del evento en tu bienestar'}
            </p>

            {assessment.registration && (
              <div className="event-info-banner">
                <h3>{assessment.registration.event.name}</h3>
                <p>📅 {formatDate(assessment.registration.event.date)}</p>
                <p>🕐 {assessment.registration.event.time}</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {isCompleted ? (
              <div className="wellness-completed">
                <div className="success-message">
                  ✅ Esta evaluación ya fue completada
                </div>
                <div className="completed-values">
                  <div className="metric-display">
                    <span>😴 Calidad de Sueño</span>
                    <strong>{assessment.sleepQuality}/10</strong>
                  </div>
                  <div className="metric-display">
                    <span>😰 Nivel de Estrés</span>
                    <strong>{assessment.stressLevel}/10</strong>
                  </div>
                  <div className="metric-display">
                    <span>😊 Estado de Ánimo</span>
                    <strong>{assessment.mood}/10</strong>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="wellness-form">
                <div className="metric-group">
                  <label>
                    😴 Calidad de Sueño
                  </label>
                  <p className="metric-description">
                    ¿Cómo calificarías la calidad de tu sueño recientemente?
                  </p>
                  <div className="slider-container">
                    <div className="slider-value">
                      <span className="value-display">{sleepQuality}</span>
                      <span className="value-label">{getValueLabel(sleepQuality, 'sleep')}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(Number(e.target.value))}
                      className="wellness-slider"
                    />
                    <div className="scale-labels">
                      <span>1 - Muy malo</span>
                      <span>10 - Excelente</span>
                    </div>
                  </div>
                </div>

                <div className="metric-group">
                  <label>
                    😰 Nivel de Estrés
                  </label>
                  <p className="metric-description">
                    ¿Cuál es tu nivel de estrés actualmente?
                  </p>
                  <div className="slider-container">
                    <div className="slider-value">
                      <span className="value-display">{stressLevel}</span>
                      <span className="value-label">{getValueLabel(stressLevel, 'stress')}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(Number(e.target.value))}
                      className="wellness-slider stress"
                    />
                    <div className="scale-labels">
                      <span>1 - Sin estrés</span>
                      <span>10 - Muy estresado</span>
                    </div>
                  </div>
                </div>

                <div className="metric-group">
                  <label>
                    😊 Estado de Ánimo
                  </label>
                  <p className="metric-description">
                    ¿Cómo describirías tu estado de ánimo general?
                  </p>
                  <div className="slider-container">
                    <div className="slider-value">
                      <span className="value-display">{mood}</span>
                      <span className="value-label">{getValueLabel(mood, 'mood')}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={mood}
                      onChange={(e) => setMood(Number(e.target.value))}
                      className="wellness-slider"
                    />
                    <div className="scale-labels">
                      <span>1 - Muy bajo</span>
                      <span>10 - Excelente</span>
                    </div>
                  </div>
                </div>

                <div className="wellness-form-actions">
                  <button 
                    type="button" 
                    onClick={() => navigate('/my-registrations')}
                    className="btn-back"
                  >
                    ← Volver
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : '✅ Enviar Evaluación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessForm;

