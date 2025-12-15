import React from 'react';
import { Event } from '../../types/event.types';

interface EventInfoCardProps {
    event: Event;
    onBack: () => void;
}

export const EventInfoCard: React.FC<EventInfoCardProps> = ({ event, onBack }) => {
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

    return (
        <div className="event-info-card">
            <div className="event-header">
                <h2>{event.name}</h2>
                <button onClick={onBack} className="btn-back">
                    ← Volver
                </button>
            </div>
            <div className="event-details-grid">
                <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <div>
                        <span className="detail-label">Creado</span>
                        <span className="detail-value">{formatDate(event.startDate)}</span>
                    </div>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <div>
                        <span className="detail-label">Hora</span>
                        <span className="detail-value">{event.time}</span>
                    </div>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">🏋️</span>
                    <div>
                        <span className="detail-label">Tipo</span>
                        <span className="detail-value">{event.exerciseType.name}</span>
                    </div>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <div>
                        <span className="detail-label">Capacidad</span>
                        <span className="detail-value">{event.capacity}</span>
                    </div>
                </div>
                {event.recurrenceType !== 'SINGLE' && (
                    <div className="detail-item">
                        <span className="detail-icon">🔄</span>
                        <div>
                            <span className="detail-label">Recurrente</span>
                            <span className="detail-value">{event._count?.instances || 0} fechas</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
