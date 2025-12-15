import React from 'react';
import { AttendanceStats as StatsType } from '../../types/event.types';

interface AttendanceStatsProps {
    stats: StatsType;
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
    return (
        <div className="stats-container">
            <h3 className="stats-title">📊 Estadísticas del Evento</h3>
            <div className="stats-grid-modern">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Inscritos</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.attended}</span>
                        <span className="stat-label">Asistieron</span>
                        <span className="stat-percentage">
                            {stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}%
                        </span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Pendientes</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🌟</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.preCompleted}</span>
                        <span className="stat-label">PRE Completado</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💫</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.postCompleted}</span>
                        <span className="stat-label">POST Completado</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
