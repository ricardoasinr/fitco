import api from './api';
import { Event, CreateEventDto, UpdateEventDto } from '../types/event.types';

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
};

