import React from 'react';
import { AttendanceWithRegistration } from '../../types/event.types';

interface ConfirmationModalProps {
    registration: AttendanceWithRegistration;
    marking: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    registration,
    marking,
    onConfirm,
    onClose,
}) => {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasPre = registration.registration.wellnessAssessments.find(
        w => w.type === 'PRE' && w.status === 'COMPLETED'
    );

    const canMark = !registration.attended && hasPre;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #dee2e6'
                }}>
                    <h2 style={{ margin: 0, color: '#2c3e50' }}>📋 Confirmar Asistencia</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#6c757d',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <DetailRow label="Nombre" value={registration.registration.user.name} />
                    <DetailRow label="Email" value={registration.registration.user.email} />
                    <DetailRow label="Evento" value={registration.registration.event.name} />
                    <DetailRow label="Fecha" value={formatDateTime(registration.registration.eventInstance.dateTime)} />

                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>QR Code:</span>
                        <code style={{
                            background: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            color: '#495057',
                            fontSize: '0.9rem'
                        }}>
                            {registration.registration.qrCode}
                        </code>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Estado PRE:</span>
                        {hasPre ? (
                            <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Completado</span>
                        ) : (
                            <span style={{ color: '#dc3545', fontWeight: 600 }}>⏳ Pendiente</span>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>Asistencia:</span>
                        {registration.attended ? (
                            <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Ya marcada</span>
                        ) : (
                            <span style={{ color: '#ffc107', fontWeight: 600 }}>⏳ Pendiente</span>
                        )}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={marking || !canMark}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: !canMark ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: !canMark ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: marking ? 0.7 : 1
                        }}
                    >
                        {marking ? 'Marcando...' : '✅ Confirmar Asistencia'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem',
        background: '#f8f9fa',
        borderRadius: '8px'
    }}>
        <span style={{ fontWeight: 600, color: '#6c757d', minWidth: '120px' }}>{label}:</span>
        <span style={{ color: '#2c3e50' }}>{value}</span>
    </div>
);
