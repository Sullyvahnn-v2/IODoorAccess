import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { Download } from 'lucide-react';

const DownloadableQR = ({ value, filename = 'qr-code', size = 80, hint = 'Kliknij aby pobrać' }) => {
    const canvasRef = useRef(null);
    const [hover, setHover] = useState(false);

    const downloadQR = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        link.click();
    };

    if (!value) {
        return <span style={{ fontSize: '12px', color: '#999' }}>Brak QR</span>;
    }

    return (
        <div
            style={styles.wrapper}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div style={styles.qrContainer} onClick={downloadQR}>
                <QRCodeCanvas
                    ref={canvasRef}
                    value={value}
                    size={size * 4}
                    level="H"
                    style={{height: '80px', width: '80px'}}
                />

                {hover && (
                    <div style={styles.overlay}>
                        <Download size={24} color="#009746" />
                    </div>
                )}
            </div>

            {hint && <span style={styles.hint}>{hint}</span>}
        </div>
    );
};

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        userSelect: 'none',
    },
    qrContainer: {
        position: 'relative',
        cursor: 'pointer',
        display: 'inline-block',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
    },
    hint: {
        fontSize: '10px',
        color: '#777',
    },
};

export default DownloadableQR;
