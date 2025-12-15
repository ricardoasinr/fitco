import { useState, useEffect, useCallback } from 'react';
import { Event, CreateEventDto, UpdateEventDto } from '../types/event.types';
import { eventsService } from '../services/events.service';

export const useEventManagement = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await eventsService.getAll();
            const sortedEvents = data.sort(
                (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
            );
            setEvents(sortedEvents);
            setError('');
        } catch (error: any) {
            setError('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleCreateEvent = async (data: CreateEventDto | UpdateEventDto) => {
        try {
            await eventsService.create(data as CreateEventDto);
            await loadEvents();
            setShowEventForm(false);
            setEditingEvent(null);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Error al crear evento');
        }
    };

    const handleUpdateEvent = async (data: CreateEventDto | UpdateEventDto) => {
        if (!editingEvent) return;

        try {
            await eventsService.update(editingEvent.id, data);
            await loadEvents();
            setShowEventForm(false);
            setEditingEvent(null);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Error al actualizar evento');
        }
    };

    const handleDeleteEvent = async (id: string) => {
        try {
            await eventsService.delete(id);
            await loadEvents();
            setShowEventForm(false);
            setEditingEvent(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Error al eliminar evento');
        }
    };

    const handleStatusChange = async (id: string, isActive: boolean) => {
        try {
            await eventsService.update(id, { isActive });
            await loadEvents();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Error al cambiar estado del evento');
        }
    };

    const openCreateForm = () => {
        setEditingEvent(null);
        setShowEventForm(true);
    };

    const openEditForm = (event: Event) => {
        setEditingEvent(event);
        setShowEventForm(true);
    };

    const closeForm = () => {
        setShowEventForm(false);
        setEditingEvent(null);
    };

    const toggleForm = () => {
        if (showEventForm) {
            closeForm();
        } else {
            openCreateForm();
        }
    };

    return {
        events,
        loading,
        error,
        showEventForm,
        editingEvent,
        loadEvents,
        handleCreateEvent,
        handleUpdateEvent,
        handleDeleteEvent,
        handleStatusChange,
        openCreateForm,
        openEditForm,
        closeForm,
        toggleForm
    };
};
