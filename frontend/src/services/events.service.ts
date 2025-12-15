import api from './api';
import { Event, CreateEventDto, UpdateEventDto, EventInstance } from '../types/event.types';

/**
 * EventsService - Servicio para gestión de eventos
 *
 * Responsabilidades:
 * - Comunicación con el backend para operaciones CRUD de eventos
 * - Manejo de peticiones HTTP
 * - Transformación de datos si es necesario
 */
export const eventsService = {
  /**
   * Obtener todos los eventos (público)
   */
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  /**
   * Obtener un evento por ID
   */
  getById: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo evento (ADMIN)
   */
  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  /**
   * Actualizar un evento (ADMIN)
   */
  update: async (id: string, data: UpdateEventDto): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un evento (ADMIN)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  /**
   * Obtener instancias de un evento
   */
  getInstances: async (eventId: string): Promise<EventInstance[]> => {
    const response = await api.get<EventInstance[]>(`/event-instances/event/${eventId}`);
    return response.data;
  },

  /**
   * Obtener instancias disponibles de un evento (futuras y con cupo)
   */
  getAvailableInstances: async (eventId: string): Promise<EventInstance[]> => {
    const response = await api.get<EventInstance[]>(`/event-instances/event/${eventId}/available`);
    return response.data;
  },

  /**
   * Obtener una instancia por ID
   */
  getInstanceById: async (instanceId: string): Promise<EventInstance> => {
    const response = await api.get<EventInstance>(`/event-instances/${instanceId}`);
    return response.data;
  },

  /**
   * Obtener disponibilidad de una instancia
   */
  getInstanceAvailability: async (instanceId: string): Promise<{
    capacity: number;
    registered: number;
    available: number;
  }> => {
    const response = await api.get(`/event-instances/${instanceId}/availability`);
    return response.data;
  },
};
