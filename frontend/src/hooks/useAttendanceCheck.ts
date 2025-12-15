import { useState, useEffect, useRef, useCallback } from 'react';
import {
    AttendanceWithRegistration,
    AttendanceStats,
    Event
} from '../types/event.types';
import { attendanceService } from '../services/attendance.service';
import { eventsService } from '../services/events.service';

export const useAttendanceCheck = (eventId?: string) => {
    const [event, setEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [attendances, setAttendances] = useState<AttendanceWithRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search state
    const [emailFilter, setEmailFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState<AttendanceWithRegistration | null>(null);
    const [marking, setMarking] = useState(false);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const loadEventData = useCallback(async () => {
        if (!eventId) return;

        try {
            setLoading(true);
            const [eventData, statsData, attendanceData] = await Promise.all([
                eventsService.getById(eventId),
                attendanceService.getStats(eventId),
                attendanceService.getByEventId(eventId),
            ]);
            setEvent(eventData);
            setStats(statsData);
            setAttendances(attendanceData);
            setError('');
        } catch (err: any) {
            setError('Error al cargar datos del evento');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (eventId) {
            loadEventData();
        }
    }, [eventId, loadEventData]);

    const handleMarkAttendance = async (attendance: AttendanceWithRegistration) => {
        setError('');
        setSuccess('');

        // Verificar que tenga PRE completado
        const hasPre = attendance.registration.wellnessAssessments.find(
            w => w.type === 'PRE' && w.status === 'COMPLETED'
        );

        if (!hasPre) {
            setError('⚠️ El usuario no ha completado la evaluación PRE');
            return;
        }

        if (attendance.attended) {
            setError('Este usuario ya tiene asistencia marcada');
            return;
        }

        try {
            setMarking(true);
            await attendanceService.mark({
                registrationId: attendance.registration.id
            });
            setSuccess(`✅ Asistencia marcada para ${attendance.registration.user.name}`);
            setSelectedUser(null);
            await loadEventData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al marcar asistencia');
        } finally {
            setMarking(false);
        }
    };

    const downloadQRCode = async () => {
        if (!qrCodeRef.current || !selectedUser) return;

        try {
            const svgElement = qrCodeRef.current.querySelector('svg');
            if (!svgElement) return;

            // Crear un canvas para convertir SVG a imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Obtener las dimensiones del SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = () => {
                // Configurar el tamaño del canvas (más grande para mejor calidad)
                canvas.width = 400;
                canvas.height = 400;

                // Dibujar la imagen en el canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convertir a PNG y descargar
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `QR-${selectedUser.registration.user.name.replace(/\s+/g, '-')}-${selectedUser.registration.qrCode.slice(0, 8)}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }
                }, 'image/png');

                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (error) {
            console.error('Error al generar imagen QR:', error);
            setError('Error al generar imagen QR');
        }
    };

    // Filtrar y ordenar attendances: últimos 10 inscritos
    const getFilteredAttendances = () => {
        let filtered = [...attendances];

        // Filtrar por email si hay búsqueda
        if (emailFilter.trim()) {
            filtered = filtered.filter(att =>
                att.registration.user.email.toLowerCase().includes(emailFilter.toLowerCase()) ||
                att.registration.user.name.toLowerCase().includes(emailFilter.toLowerCase())
            );
        }

        // Ordenar por fecha de creación descendente (más recientes primero)
        filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Mostrar solo los últimos 10
        return filtered.slice(0, 10);
    };

    return {
        event,
        stats,
        attendances,
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
    };
};
