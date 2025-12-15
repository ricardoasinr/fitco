import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Registration } from '../../types/event.types';

interface RegistrationActionsProps {
    registration: Registration;
    onCancel: (id: string) => void;
}

export const RegistrationActions: React.FC<RegistrationActionsProps> = ({
    registration,
    onCancel
}) => {
    const navigate = useNavigate();
    const preAssessment = registration.wellnessAssessments.find(w => w.type === 'PRE');
    const postAssessment = registration.wellnessAssessments.find(w => w.type === 'POST');

    const isInstancePast = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const renderMainAction = () => {
        if (preAssessment?.status === 'PENDING') {
            return (
                <button
                    onClick={() => navigate(`/wellness/${preAssessment.id}`)}
                    className="btn-action btn-wellness"
                >
                    📝 Completar PRE
                </button>
            );
        }

        if (postAssessment?.status === 'PENDING') {
            return (
                <button
                    onClick={() => navigate(`/wellness/${postAssessment.id}`)}
                    className="btn-action btn-wellness"
                >
                    📝 Completar POST
                </button>
            );
        }

        if (postAssessment?.status === 'COMPLETED') {
            return (
                <button
                    onClick={() => navigate(`/wellness/impact/${registration.id}`)}
                    className="btn-action btn-impact"
                >
                    📊 Ver Impacto
                </button>
            );
        }

        return null;
    };

    return (
        <div className="registration-actions" style={{ marginTop: '20px' }}>
            {renderMainAction()}

            {!registration.attendance?.attended &&
                !isInstancePast(registration.eventInstance.dateTime) && (
                    <button
                        onClick={() => onCancel(registration.id)}
                        className="btn-action btn-cancel"
                    >
                        ❌ Cancelar Inscripción
                    </button>
                )}
        </div>
    );
};
