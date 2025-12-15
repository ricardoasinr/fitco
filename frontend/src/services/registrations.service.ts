import api from './api';
import { Registration, EventAvailability, InstanceAvailability, CreateRegistrationDto } from '../types/event.types';

/**
 * RegistrationsService - Servicio para gestión de inscripciones
 *
 * Responsabilidades:
 * - Comunicación con el backend para operaciones de inscripciones
 * - Manejo de peticiones HTTP
 */
export const registrationsService = {
  /**
   * Inscribirse a un evento con instancia seleccionada (USER)
   */
  register: async (eventId: string, eventInstanceId: string): Promise<Registration> => {
    const data: CreateRegistrationDto = { eventId, eventInstanceId };
    const response = await api.post<Registration>('/registrations', data);
    return response.data;
  },

  /**
   * Obtener mis inscripciones (USER)
   */
  getMyRegistrations: async (): Promise<Registration[]> => {
    const response = await api.get<Registration[]>('/registrations/my');
    return response.data;
  },

  /**
   * Obtener inscripción por ID
   */
  getById: async (id: string): Promise<Registration> => {
    const response = await api.get<Registration>(`/registrations/${id}`);
    return response.data;
  },

  /**
   * Obtener inscripciones de un evento (ADMIN)
   */
  getByEventId: async (eventId: string): Promise<Registration[]> => {
    const response = await api.get<Registration[]>(`/registrations/event/${eventId}`);
    return response.data;
  },

  /**
   * Obtener inscripciones de una instancia (ADMIN)
   */
  getByInstanceId: async (instanceId: string): Promise<Registration[]> => {
    const response = await api.get<Registration[]>(`/registrations/instance/${instanceId}`);
    return response.data;
  },

  /**
   * Obtener disponibilidad de un evento (total)
   */
  getEventAvailability: async (eventId: string): Promise<EventAvailability> => {
    const response = await api.get<EventAvailability>(`/registrations/event/${eventId}/availability`);
    return response.data;
  },

  /**
   * Obtener disponibilidad de una instancia
   */
  getInstanceAvailability: async (instanceId: string): Promise<InstanceAvailability> => {
    const response = await api.get<InstanceAvailability>(`/registrations/instance/${instanceId}/availability`);
    return response.data;
  },

  /**
   * Obtener inscripción por QR code (ADMIN)
   */
  getByQrCode: async (qrCode: string): Promise<Registration> => {
    const response = await api.get<Registration>(`/registrations/qr/${qrCode}`);
    return response.data;
  },

  /**
   * Cancelar inscripción (USER)
   */
  cancel: async (id: string): Promise<void> => {
    await api.delete(`/registrations/${id}`);
  },
};
