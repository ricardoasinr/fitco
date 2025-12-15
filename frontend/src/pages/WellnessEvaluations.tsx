import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useWellnessEvaluations } from '../hooks/useWellnessEvaluations';
import { PendingEvaluationCard } from '../components/wellness/PendingEvaluationCard';
import { CompletedEvaluationCard } from '../components/wellness/CompletedEvaluationCard';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Wellness.css';

/**
 * WellnessEvaluations - Página para gestionar evaluaciones PRE y POST
 * 
 * Refactorizada para SOLID y Clean Code:
 * - Lógica extraída a useWellnessEvaluations
 * - UI dividida en PendingEvaluationCard y CompletedEvaluationCard
 */
const WellnessEvaluations: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    pendingEvaluations,
    completedEvaluations,
    impacts,
    loading,
    error
  } = useWellnessEvaluations();

  const handleLogout = () => {
    logout();
    navigate('/');
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
                      <PendingEvaluationCard
                        key={evaluation.id}
                        evaluation={evaluation}
                      />
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
                      .map((evaluation) => (
                        <CompletedEvaluationCard
                          key={evaluation.id}
                          evaluation={evaluation}
                          impact={impacts.get(evaluation.registrationId)}
                        />
                      ))}
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
