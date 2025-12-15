import React from 'react';
import { WellnessAssessment, WellnessImpactResponse } from '../../types/event.types';

interface CompletedEvaluationCardProps {
    evaluation: WellnessAssessment;
    impact?: WellnessImpactResponse;
}

export const CompletedEvaluationCard: React.FC<CompletedEvaluationCardProps> = ({
    evaluation,
    impact
}) => {
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

    const hasImpact = impact && impact.preAssessment && impact.postAssessment;

    return (
        <div className="wellness-evaluation-card completed">
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
};
