import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { useAttendanceCheck } from '../hooks/useAttendanceCheck';
import { EventInfoCard } from '../components/attendance/EventInfoCard';
import { AttendanceStats } from '../components/attendance/AttendanceStats';
import { AttendanceList } from '../components/attendance/AttendanceList';
import { UserDetailCard } from '../components/attendance/UserDetailCard';
import '../styles/Dashboard.css';
import '../styles/Registrations.css';

/**
 * AttendanceCheck - Página para que admin marque asistencia
 * 
 * Refactorizada para SOLID y Clean Code:
 * - Lógica extraída a useAttendanceCheck
 * - UI dividida en componentes: EventInfoCard, AttendanceStats, AttendanceList, UserDetailCard
 */
const AttendanceCheck: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    event,
    stats,
    loading,
    error,
    success,
    emailFilter,
    selectedUser,
    marking,
    qrCodeRef,
    setEmailFilter,
    setSelectedUser,
    handleMarkAttendance,
    downloadQRCode,
    getFilteredAttendances
  } = useAttendanceCheck(eventId);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/admin/events');
  };

  if (loading) {
    return (
      <div className="layout-with-sidebar">
        <AdminSidebar onLogout={handleLogout} />
        <div className="main-content">
          <div className="dashboard-content-wrapper">
            <div className="loading-card">
              <div className="loading">Cargando datos del evento...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-with-sidebar">
      <AdminSidebar onLogout={handleLogout} />

      <div className="main-content">
        <div className="dashboard-content-wrapper">
          <div className="welcome-section">
            <h1 className="welcome-title">✅ Control de Asistencia</h1>
          </div>

          {event && (
            <EventInfoCard event={event} onBack={handleBack} />
          )}

          {stats && (
            <AttendanceStats stats={stats} />
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <AttendanceList
            attendances={getFilteredAttendances()}
            emailFilter={emailFilter}
            onFilterChange={setEmailFilter}
            onSelectUser={setSelectedUser}
            onMarkAttendance={handleMarkAttendance}
            selectedUserId={selectedUser?.id}
            marking={marking}
          />

          {selectedUser && (
            <UserDetailCard
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onDownloadQR={downloadQRCode}
              qrCodeRef={qrCodeRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCheck;
