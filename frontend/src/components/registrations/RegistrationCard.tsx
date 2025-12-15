import React from 'react';
import { Registration } from '../../types/event.types';
import { StatusBadge } from './StatusBadge';

interface RegistrationCardProps {
    registration: Registration;
    onClick: (id: string) => void;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
    registration,
    onClick
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

    return (
        <div
            className="registration-card registration-card-compact"
            onClick={() => onClick(registration.id)}
            style={{ cursor: 'pointer' }}
        >
            <div className="registration-header">
                <h3>{registration.event.name}</h3>
                <StatusBadge registration={registration} />
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
    );
};
