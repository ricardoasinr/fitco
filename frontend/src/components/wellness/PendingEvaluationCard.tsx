import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WellnessAssessment } from '../../types/event.types';

interface PendingEvaluationCardProps {
    evaluation: WellnessAssessment;
}

export const PendingEvaluationCard: React.FC<PendingEvaluationCardProps> = ({ evaluation }) => {
    const navigate = useNavigate();

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
        <div className="wellness-evaluation-card">
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
    );
};
