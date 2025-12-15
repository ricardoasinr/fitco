import React from 'react';
import { AttendanceWithRegistration } from '../../types/event.types';

interface AttendanceListProps {
    attendances: AttendanceWithRegistration[];
    emailFilter: string;
    onFilterChange: (value: string) => void;
    onSelectUser: (user: AttendanceWithRegistration) => void;
    onMarkAttendance: (attendance: AttendanceWithRegistration) => void;
    selectedUserId?: string;
    marking: boolean;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
    attendances,
    emailFilter,
    onFilterChange,
    onSelectUser,
    onMarkAttendance,
    selectedUserId,
    marking
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
        <div className="attendance-container-modern">
            <div className="attendance-list-section">
                <div className="list-header">
                    <h3 className="section-title">📋 Lista de Asistencia (Últimos 10 inscritos)</h3>
                    <div className="search-filter">
                        <input
                            type="text"
                            value={emailFilter}
                            onChange={(e) => onFilterChange(e.target.value)}
                            placeholder="🔍 Filtrar por email o nombre..."
                            className="filter-input"
                        />
                    </div>
                </div>

                {attendances.length > 0 ? (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID Registro</th>
                                    <th>Fecha y Hora Evento</th>
                                    <th>Email</th>
                                    <th>PRE</th>
                                    <th>Asistencia</th>
                                    <th>POST</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.map(att => {
                                    const hasPre = getPreWellnessStatus(att);
                                    const canMarkAttendance = !att.attended && hasPre;

                                    return (
                                        <tr
                                            key={att.id}
                                            className={selectedUserId === att.id ? 'selected-row' : ''}
                                            onClick={() => onSelectUser(att)}
                                        >
                                            <td className="id-cell">
                                                <code>{att.registration.qrCode.slice(0, 8)}</code>
                                            </td>
                                            <td className="date-cell">{formatDateTime(att.registration.eventInstance.dateTime)}</td>
                                            <td>
                                                <div className="user-cell">
                                                    <strong>{att.registration.user.name}</strong>
                                                    <small>{att.registration.user.email}</small>
                                                </div>
                                            </td>
                                            <td className="centered">
                                                {hasPre
                                                    ? <span className="status-badge active">✅</span>
                                                    : <span className="status-badge inactive">⏳</span>}
                                            </td>
                                            <td className="centered">
                                                {att.attended
                                                    ? <span className="status-badge active">✅ Sí</span>
                                                    : <span className="status-badge inactive">⏳ No</span>}
                                            </td>
                                            <td className="centered">
                                                {att.registration.wellnessAssessments.find(w => w.type === 'POST')?.status === 'COMPLETED'
                                                    ? <span className="status-badge active">✅</span>
                                                    : att.attended
                                                        ? <span className="status-badge inactive">⏳</span>
                                                        : <span>—</span>}
                                            </td>
                                            <td className="centered">
                                                {canMarkAttendance ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMarkAttendance(att);
                                                        }}
                                                        className="mark-btn"
                                                        disabled={marking}
                                                    >
                                                        {marking ? '...' : '✅ Marcar'}
                                                    </button>
                                                ) : att.attended ? (
                                                    <span className="done-text">✓ Marcado</span>
                                                ) : (
                                                    <span className="no-pre-text">Sin PRE</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {attendances.length === 0 && (
                            <div className="no-results">
                                No se encontraron resultados para "{emailFilter}"
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-data">
                        No hay registros de asistencia aún
                    </div>
                )}
            </div>
        </div>
    );
};
