import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AttendanceWithRegistration } from '../../types/event.types';

interface UserDetailCardProps {
    user: AttendanceWithRegistration;
    onClose: () => void;
    onDownloadQR: () => void;
    qrCodeRef: React.RefObject<HTMLDivElement>;
}

export const UserDetailCard: React.FC<UserDetailCardProps> = ({
    user,
    onClose,
    onDownloadQR,
    qrCodeRef
}) => {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
        });
    };

    const getPreWellnessStatus = (attendance: AttendanceWithRegistration) => {
        const pre = attendance.registration.wellnessAssessments.find(w => w.type === 'PRE');
        return pre?.status === 'COMPLETED';
    };

    return (
        <div className="user-detail-card">
            <div className="detail-header">
                <h4>📋 Detalle del Participante</h4>
                <button
                    className="close-btn"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            <div className="detail-content">
                <div className="detail-row">
                    <span className="detail-label-text">ID Registro:</span>
                    <span className="detail-value-text">
                        <code style={{ background: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {user.registration.id}
                        </code>
                    </span>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">QR Code:</span>
                    <span className="detail-value-text">
                        <code style={{ background: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {user.registration.qrCode}
                        </code>
                    </span>
                </div>
                <div className="qr-code-section">
                    <h5 style={{ margin: '0 0 1rem 0', color: '#2c3e50', fontSize: '1.1rem' }}>🎫 Tu Código QR</h5>
                    <div
                        ref={qrCodeRef}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '1rem',
                            background: 'white',
                            borderRadius: '8px',
                            border: '2px solid #dee2e6'
                        }}>
                            <QRCodeSVG
                                value={user.registration.qrCode}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <button
                            onClick={onDownloadQR}
                            className="download-qr-btn"
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            📥 Descargar Imagen QR
                        </button>
                    </div>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">Nombre:</span>
                    <span className="detail-value-text">{user.registration.user.name}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">Email:</span>
                    <span className="detail-value-text">{user.registration.user.email}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">Evento:</span>
                    <span className="detail-value-text">{user.registration.event.name}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">Fecha del evento:</span>
                    <span className="detail-value-text">{formatDateTime(user.registration.eventInstance.dateTime)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label-text">Fecha de inscripción:</span>
                    <span className="detail-value-text">{formatDateTime(user.createdAt)}</span>
                </div>

                {getPreWellnessStatus(user) && (
                    <div className="wellness-detail">
                        <h5>Estado Wellness PRE</h5>
                        {user.registration.wellnessAssessments
                            .filter(w => w.type === 'PRE')
                            .map(w => (
                                <div key={w.id} className="wellness-grid">
                                    <div className="wellness-item">
                                        <span>😴 Sueño:</span>
                                        <strong>{w.sleepQuality}/10</strong>
                                    </div>
                                    <div className="wellness-item">
                                        <span>😰 Estrés:</span>
                                        <strong>{w.stressLevel}/10</strong>
                                    </div>
                                    <div className="wellness-item">
                                        <span>😊 Ánimo:</span>
                                        <strong>{w.mood}/10</strong>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};
