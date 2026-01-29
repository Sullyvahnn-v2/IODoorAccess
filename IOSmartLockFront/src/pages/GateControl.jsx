import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import Navbar from '../components/Navbar';
import { BrowserMultiFormatReader } from '@zxing/browser';
import api from '../api/axios';

const GateControl = () => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('Oczekiwanie na skan...');
    const [log, setLog] = useState([]);
    const [scanState, setScanState] = useState('idle');
    const [userEmail, setUserEmail] = useState(null); // email from QR
    const [faceMode, setFaceMode] = useState(false); // true after QR verified

    // --- SCAN QR FROM CAMERA ---
    const captureAndScanQR = async () => {
        setStatus('Skanowanie QR...');
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return handleScanError('Nie udało się pobrać obrazu z kamery');

        await scanImageForQR(imageSrc);
    };

    // --- SCAN QR FROM FILE ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setStatus('Skanowanie QR z pliku...');
        const reader = new FileReader();
        reader.onload = async (ev) => await scanImageForQR(ev.target.result);
        reader.readAsDataURL(file);
    };

    // --- SCAN IMAGE FOR QR ---
    const scanImageForQR = async (imageSrc) => {
        try {
            const img = document.createElement('img');
            img.src = imageSrc;
            await new Promise(res => (img.onload = res));

            const codeReader = new BrowserMultiFormatReader();
            const result = await codeReader.decodeFromImageElement(img);

            if (result) {
                const token = result.text;
                setStatus(`QR Odczytany: ${token}`);
                setScanState('success');
                addLog(`QR Code: ${token}`, true);

                await verifyToken(token); // verify token on backend
            } else handleScanError('Nie znaleziono QR code');
        } catch (err) {
            console.error(err);
            handleScanError('Błąd podczas skanowania QR');
        }
    };

    // --- VERIFY TOKEN ---
    const verifyToken = async (token) => {
        try {
            const response = await api.post('/auth/qr/verify', { token });
            setStatus(`Użytkownik zweryfikowany: ${response.data.user}`);
            setScanState('success');
            setUserEmail(response.data.user);
            setFaceMode(true); // switch to face mode
        } catch (err) {
            handleScanError('Błąd weryfikacji QR');
        }
    };

    // --- CAPTURE PHOTO AND SEND TO BACKEND FOR FACE VERIFICATION ---
    const captureAndVerifyFace = async () => {
        if (!userEmail) return setStatus('Brak użytkownika do weryfikacji');
        const imageBase64 = webcamRef.current.getScreenshot();
        if (!imageBase64) return setStatus('Nie udało się pobrać zdjęcia');

        setStatus('Weryfikacja twarzy...');
        try {
            const response = await api.post('/auth/face/verify', {
                email: userEmail,
                image: imageBase64
            });

            if (response.data.success) {
                setStatus(`Twarz zweryfikowana! Similarity: ${response.data.similarity}`);
                addLog(`Face verified: ${response.data.similarity}`, true);
            } else {
                setStatus('Nie udało się zweryfikować twarzy');
                addLog('Face verification failed', false);
            }
        } catch (err) {
            setStatus('Błąd weryfikacji twarzy');
            addLog('Face verification error', false);
        }
    };

    // --- UTILS ---
    const addLog = (msg, success) => {
        setLog(prev => [{ time: new Date().toLocaleTimeString(), msg, success }, ...prev]);
    };

    const handleScanError = (msg) => {
        setStatus(msg);
        setScanState('error');
        addLog(msg, false);
    };

    const getBorderColor = () => {
        if (scanState === 'success') return '#28a745';
        if (scanState === 'error') return '#dc3545';
        return '#009051';
    };

    // --- RENDER ---
    return (
        <div style={styles.pageWrapper}>
            <Navbar />
            <div style={styles.contentContainer}>
                <div style={styles.mainCard}>
                    <h1 style={styles.title}>PUNKT KONTROLNY - WEJŚCIE GŁÓWNE</h1>

                    <div style={{ ...styles.scannerFrame, borderColor: getBorderColor() }}>
                        <div style={styles.webcamContainer}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/png"
                                videoConstraints={{ facingMode: 'user' }}
                                style={styles.webcam}
                            />
                        </div>

                        <div style={styles.controlsContainer}>
                            <p style={styles.statusText}>{status}</p>

                            {!faceMode && (
                                <>
                                    <button
                                        onClick={captureAndScanQR}
                                        style={{ ...styles.scanButton, backgroundColor: getBorderColor() }}
                                        onMouseOver={e => (e.target.style.backgroundColor = '#357a46')}
                                        onMouseOut={e => (e.target.style.backgroundColor = '#009746')}
                                    >
                                        Skanuj QR z kamery
                                    </button>

                                    <div style={{ marginTop: '15px' }}>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} />
                                    </div>
                                </>
                            )}

                            {faceMode && (
                                <button
                                    onClick={captureAndVerifyFace}
                                    style={{ ...styles.scanButton, backgroundColor: '#4361ee' }}
                                    onMouseOver={e => (e.target.style.backgroundColor = '#2c47b0')}
                                    onMouseOut={e => (e.target.style.backgroundColor = '#4361ee')}
                                >
                                    Zweryfikuj twarz
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.logsCard}>
                    <h3 style={styles.logsTitle}>Ostatnie zdarzenia:</h3>
                    {log.length === 0 ? (
                        <p style={{ color: '#ccc', fontStyle: 'italic' }}>Brak nowych zdarzeń...</p>
                    ) : (
                        <ul style={styles.logList}>
                            {log.map((entry, i) => (
                                <li key={i} style={styles.logItem}>
                                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>[{entry.time}]</span>
                                    <span style={{ color: entry.success ? 'green' : 'red' }}>{entry.msg}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- STYLE ---
const styles = {
    pageWrapper: { minHeight: '100vh', backgroundColor: '#eaf4ec' },
    contentContainer: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' },
    mainCard: { backgroundColor: 'white', borderRadius: '30px', padding: '40px', boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    title: { color: '#4361ee', fontSize: '28px', fontWeight: 'bold', marginBottom: '40px', textTransform: 'uppercase', marginTop: 0 },
    scannerFrame: { border: '5px solid #009051', borderRadius: '30px', width: '350px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 15px rgba(0, 151, 70, 0.2)', backgroundColor: '#fff' },
    webcamContainer: { width: '100%', height: '300px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    webcam: { width: '100%', height: '100%', objectFit: 'cover' },
    controlsContainer: { padding: '20px', width: '100%' },
    statusText: { color: '#777', marginBottom: '15px', fontWeight: '500', marginTop: 0 },
    scanButton: { backgroundColor: '#009051', color: 'white', border: 'none', padding: '12px 0', width: '100%', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s' },
    logsCard: { backgroundColor: 'white', borderRadius: '30px', padding: '30px 40px', boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', minHeight: '200px' },
    logsTitle: { color: '#777', fontSize: '18px', marginTop: 0, marginBottom: '20px' },
    logList: { listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' },
    logItem: { padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '16px' },
};

export default GateControl;
