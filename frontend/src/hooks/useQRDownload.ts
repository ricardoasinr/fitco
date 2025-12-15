import QRCode from 'qrcode';
import { Registration } from '../types/event.types';

export const useQRDownload = () => {
    const downloadQR = async (registration: Registration) => {
        try {
            // Crear canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Configurar tamaño del canvas
            canvas.width = 600;
            canvas.height = 900;

            // Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Generar QR code como imagen
            const qrDataUrl = await QRCode.toDataURL(registration.qrCode, {
                width: 250,
                margin: 2,
                errorCorrectionLevel: 'H',
            });

            // Cargar imagen QR
            const qrImage = new Image();
            await new Promise((resolve, reject) => {
                qrImage.onload = resolve;
                qrImage.onerror = reject;
                qrImage.src = qrDataUrl;
            });

            // Configurar estilos de texto
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            let yPos = 40;

            // Título del evento
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(registration.event.name, canvas.width / 2, yPos);
            yPos += 50;

            // Tipo de ejercicio
            ctx.font = '24px Arial';
            ctx.fillText(`🏋️ ${registration.event.exerciseType.name}`, canvas.width / 2, yPos);
            yPos += 50;

            // Información del evento
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#2c3e50';
            ctx.fillText('📅 Información del Evento', canvas.width / 2, yPos);
            yPos += 40;

            // Formatear fecha y hora
            const date = new Date(registration.eventInstance.dateTime);
            const dateStr = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
            });
            const timeStr = date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
            });

            ctx.font = '18px Arial';
            ctx.fillStyle = '#34495e';
            ctx.fillText(`📅 ${dateStr}`, canvas.width / 2, yPos);
            yPos += 35;

            ctx.fillText(`🕐 ${timeStr}`, canvas.width / 2, yPos);
            yPos += 60;

            // Título del QR
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#2c3e50';
            ctx.fillText('🎫 Tu Código QR', canvas.width / 2, yPos);
            yPos += 40;

            // Dibujar QR code
            const qrSize = 250;
            const qrX = (canvas.width - qrSize) / 2;
            ctx.drawImage(qrImage, qrX, yPos, qrSize, qrSize);
            yPos += qrSize + 20;

            // ID de registro
            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = '#2c3e50';
            ctx.fillText(registration.qrCode, canvas.width / 2, yPos);

            // Descargar imagen
            const link = document.createElement('a');
            link.download = `QR-${registration.event.name.replace(/\s+/g, '-')}-${registration.qrCode}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error al generar QR:', error);
            throw new Error('Error al generar la imagen del QR');
        }
    };

    return { downloadQR };
};
