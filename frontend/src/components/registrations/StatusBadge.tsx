import React from 'react';
import { Registration } from '../../types/event.types';

interface StatusBadgeProps {
    registration: Registration;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ registration }) => {
    const preAssessment = registration.wellnessAssessments.find(w => w.type === 'PRE');
    const postAssessment = registration.wellnessAssessments.find(w => w.type === 'POST');

    let statusClass = 'pending';
    let statusText = '⏳ PRE pendiente';

    if (postAssessment?.status === 'COMPLETED') {
        statusClass = 'completed';
        statusText = '✅ Completado';
    } else if (registration.attendance?.attended) {
        statusClass = 'attended';
        statusText = '🎯 Asistido - POST pendiente';
    } else if (preAssessment?.status === 'COMPLETED') {
        statusClass = 'pre-done';
        statusText = '📋 PRE completado';
    }

    return <span className={`status-badge ${statusClass}`}>{statusText}</span>;
};
