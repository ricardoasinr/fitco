import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Registration } from '../../types/event.types';
import { StatusBadge } from './StatusBadge';
import { RegistrationActions } from './RegistrationActions';
import { useQRDownload } from '../../hooks/useQRDownload';

interface RegistrationDetailProps {
    registration: Registration;
    onBack: () => void;
    onCancel: (id: string) => void;
}

export const RegistrationDetail: React.FC<RegistrationDetailProps> = ({
    registration,
    onBack,
    onCancel,
}) => {
    const navigate = useNavigate();
    const { downloadQR } = useQRDownload();

    const preAssessment = registration.wellnessAssessments.find(w => w.type === 'PRE');
    const postAssessment = registration.wellnessAssessments.find(w => w.type === 'POST');

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
        <div className="dashboard-content-wrapper">
            <button onClick={onBack} className="btn-back">
                ← Volver a Mis Inscripciones
            </button>

            <div className="registration-detail-card">
                <div className="detail-header">
                    <h2 className="detail-title">{registration.event.name}</h2>
                    <p className="detail-subtitle">
                        🏋️ {registration.event.exerciseType.name}
                    </p>
                    <StatusBadge registration={registration} />
                </div>

                <div className="detail-sections">
                    {/* Información del evento */}
                    <div className="detail-section">
                        <h4>📅 Información del Evento</h4>
                        <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <span className="detail-text">
                                {formatDate(registration.eventInstance.dateTime)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-icon">🕐</span>
                            <span className="detail-text">
                                {formatTime(registration.eventInstance.dateTime)}
                            </span>
                        </div>
                    </div>

                    {/* Código QR */}
                    <div className="detail-section">
                        <h4>🎫 Tu Código QR</h4>
                        <div className="qr-code-large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                            <QRCodeSVG
                                value={registration.qrCode}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <p style={{ marginTop: '16px', textAlign: 'center', color: '#2c3e50', fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                            {registration.qrCode}
                        </p>
                        <p className="qr-hint" style={{ marginTop: '12px', textAlign: 'center', color: '#7f8c8d', fontSize: '14px' }}>
                            Presenta este código al llegar al evento
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                onClick={() => downloadQR(registration)}
                                className="btn-action"
                                style={{
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                📥 Descargar QR
                            </button>
                        </div>
                    </div>

                    {/* Estado Wellness */}
                    <div className="detail-section">
                        <h4>🌟 Evaluaciones Wellness</h4>
                        <div className="wellness-section">
                            {preAssessment && (
                                <div className="wellness-item">
                                    <div className="wellness-item-info">
                                        <span className="wellness-item-type">📋 PRE</span>
                                        <span className="wellness-item-status">
                                            {preAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    {preAssessment.status === 'PENDING' && (
                                        <button
                                            onClick={() => navigate(`/wellness/${preAssessment.id}`)}
                                            className="btn-action btn-wellness"
                                            style={{ padding: '8px 16px', fontSize: '14px' }}
                                        >
                                            Completar
                                        </button>
                                    )}
                                </div>
                            )}
                            {postAssessment && (
                                <div className="wellness-item">
                                    <div className="wellness-item-info">
                                        <span className="wellness-item-type">📝 POST</span>
                                        <span className="wellness-item-status">
                                            {postAssessment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    {postAssessment.status === 'PENDING' && (
                                        <button
                                            onClick={() => navigate(`/wellness/${postAssessment.id}`)}
                                            className="btn-action btn-wellness"
                                            style={{ padding: '8px 16px', fontSize: '14px' }}
                                        >
                                            Completar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <RegistrationActions registration={registration} onCancel={onCancel} />
                </div>
            </div>
        </div>
    );
};
