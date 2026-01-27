import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import ChangePassword from '../components/ChangePassword';

const EmployeeGate = () => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('Oczekiwanie na skan...');

    // Tu będzie logika skanowania (taka sama jak w GateControl)
    const handleScan = () => {
        setStatus("Weryfikacja...");
        setTimeout(() => setStatus("Oczekiwanie na skan..."), 2000);
    };

    return (
        <div style={styles.pageWrapper}>
            {/* Specjalny nagłówek tylko dla bramki */}
            <header style={styles.header}>
                PUNKT KONTROLNY - WEJŚCIE GŁÓWNE
            </header>

            <div style={styles.contentContainer}>
                {/* KARTA Z KAMERĄ */}
                <div style={styles.cameraCard}>
                    <div style={styles.scannerFrame}>
                        <div style={styles.webcamContainer}>
                            <Webcam 
                                audio={false} 
                                ref={webcamRef} 
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "user" }}
                                style={styles.webcam}
                            />
                        </div>
                        <p style={styles.statusText}>{status}</p>
                        <button onClick={handleScan} style={styles.scanButton}>
                            Zeskanuj i wejdź
                        </button>
                    </div>
                </div>

                {/* KARTA ZMIANY HASŁA */}
                <ChangePassword />
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: {
        minHeight: '100vh',
        backgroundColor: '#eaf4ec',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: '#009746', // Zielone tło paska
        color: '#0033cc', // Niebieski tekst (jak na Twoim screenie)
        textAlign: 'center',
        padding: '20px',
        fontSize: '24px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    contentContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
    },
    cameraCard: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px',
        width: '100%',
        maxWidth: '800px', // Taka sama szerokość jak karta hasła
        display: 'flex',
        justifyContent: 'center'
    },
    scannerFrame: {
        border: '4px solid #009746',
        borderRadius: '30px',
        width: '320px',
        padding: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        paddingBottom: '20px'
    },
    webcamContainer: {
        width: '100%',
        height: '350px',
        backgroundColor: '#000',
        marginBottom: '10px'
    },
    webcam: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    statusText: {
        color: '#777',
        marginBottom: '10px'
    },
    scanButton: {
        backgroundColor: '#009746',
        color: 'white',
        border: 'none',
        padding: '12px 40px',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default EmployeeGate;