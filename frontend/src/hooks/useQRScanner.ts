import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceService } from '../services/attendance.service';
import { AttendanceWithRegistration } from '../types/event.types';

export const useQRScanner = () => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundRegistration, setFoundRegistration] = useState<AttendanceWithRegistration | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [marking, setMarking] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && scanning) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, [scanning]);

    const stopScanning = useCallback(async () => {
        try {
            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }
            setScanning(false);
        } catch (err) {
            console.error('Error al detener escáner:', err);
        }
    }, []);

    const handleQRCodeScanned = useCallback(async (qrCode: string) => {
        try {
            await stopScanning();
            setLoading(true);
            setError('');

            const attendance = await attendanceService.getByQrCode(qrCode);

            setFoundRegistration(attendance);
            setShowConfirmModal(true);
            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.message || 'No se encontró un registro con este código QR');
            // Restart scanning after error
            setTimeout(() => {
                startScanning();
            }, 2000);
        }
    }, [stopScanning]);

    const startScanning = useCallback(async () => {
        try {
            setError('');
            setSuccess('');
            setFoundRegistration(null);
            setShowConfirmModal(false);

            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                } catch (e) {
                    // Ignore stop errors
                }
                html5QrCodeRef.current = null;
            }

            const html5QrCode = new Html5Qrcode('qr-reader');
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await handleQRCodeScanned(decodedText);
                },
                () => { } // Ignore continuous errors
            );

            setScanning(true);
        } catch (err: any) {
            console.error('Error al iniciar escáner:', err);
            setError('Error al iniciar la cámara. Asegúrate de dar permisos de cámara.');
            setScanning(false);
        }
    }, [handleQRCodeScanned]);

    const confirmAttendance = async () => {
        if (!foundRegistration) return;

        const hasPre = foundRegistration.registration.wellnessAssessments.find(
            w => w.type === 'PRE' && w.status === 'COMPLETED'
        );

        if (!hasPre) {
            setError('⚠️ El usuario no ha completado la evaluación PRE');
            setShowConfirmModal(false);
            return;
        }

        if (foundRegistration.attended) {
            setError('Este usuario ya tiene asistencia marcada');
            setShowConfirmModal(false);
            return;
        }

        try {
            setMarking(true);
            setError('');

            await attendanceService.mark({
                registrationId: foundRegistration.registration.id
            });

            setSuccess(`✅ Asistencia marcada para ${foundRegistration.registration.user.name}`);
            setShowConfirmModal(false);
            setFoundRegistration(null);

            setTimeout(() => {
                startScanning();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al marcar asistencia');
        } finally {
            setMarking(false);
        }
    };

    const closeModal = useCallback(() => {
        setShowConfirmModal(false);
        setFoundRegistration(null);
        setTimeout(() => {
            startScanning();
        }, 500);
    }, [startScanning]);

    return {
        scanning,
        error,
        success,
        loading,
        foundRegistration,
        showConfirmModal,
        marking,
        startScanning,
        stopScanning,
        confirmAttendance,
        closeModal
    };
};
