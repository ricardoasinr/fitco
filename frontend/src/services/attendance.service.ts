import api from './api';
import { 
  AttendanceWithRegistration, 
  MarkAttendanceDto, 
  AttendanceStats 
} from '../types/event.types';

/**
 * AttendanceService - Servicio para gestión de asistencia
 * 
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de asistencia
 * - Manejo de peticiones HTTP
 */
export const attendanceService = {
  /**
   * Marcar asistencia (ADMIN)
   */
  mark: async (data: MarkAttendanceDto): Promise<AttendanceWithRegistration> => {
    const response = await api.post<AttendanceWithRegistration>('/attendance/mark', data);
    return response.data;
  },

  /**
   * Obtener asistencias de un evento (ADMIN)
   */
  getByEventId: async (eventId: string): Promise<AttendanceWithRegistration[]> => {
    const response = await api.get<AttendanceWithRegistration[]>(`/attendance/event/${eventId}`);
    return response.data;
  },

  /**
   * Obtener estadísticas de asistencia de un evento (ADMIN)
   */
  getStats: async (eventId: string): Promise<AttendanceStats> => {
    const response = await api.get<AttendanceStats>(`/attendance/event/${eventId}/stats`);
    return response.data;
  },

  /**
   * Buscar por QR code (ADMIN)
   */
  getByQrCode: async (qrCode: string): Promise<AttendanceWithRegistration> => {
    const response = await api.get<AttendanceWithRegistration>(`/attendance/qr/${qrCode}`);
    return response.data;
  },
};


