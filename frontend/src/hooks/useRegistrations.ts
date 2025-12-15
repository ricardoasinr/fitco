import { useState, useEffect, useCallback } from 'react';
import { Registration } from '../types/event.types';
import { registrationsService } from '../services/registrations.service';

export const useRegistrations = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await registrationsService.getMyRegistrations();
            setRegistrations(data);
            setError('');
        } catch (err: any) {
            setError('Error al cargar inscripciones');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRegistrations();
    }, [loadRegistrations]);

    const cancelRegistration = async (registrationId: string) => {
        try {
            await registrationsService.cancel(registrationId);
            await loadRegistrations();
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cancelar inscripción');
            return false;
        }
    };

    return {
        registrations,
        loading,
        error,
        loadRegistrations,
        cancelRegistration,
    };
};
