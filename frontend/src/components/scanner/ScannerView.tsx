import React from 'react';

interface ScannerViewProps {
    scanning: boolean;
    loading: boolean;
    onStart: () => void;
    onStop: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
    scanning,
    loading,
    onStart,
    onStop,
}) => {
    return (
        <div className="scanner-container" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
        }}>
            <div id="qr-reader" style={{
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto'
            }}></div>

            {!scanning && !loading && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={onStart}
                        className="btn-primary"
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: 600
                        }}
                    >
                        🎥 Iniciar Escáner
                    </button>
                </div>
            )}

            {scanning && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={onStop}
                        className="btn-secondary"
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        ⏹️ Detener Escáner
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <div className="loading">Buscando registro...</div>
                </div>
            )}
        </div>
    );
};
