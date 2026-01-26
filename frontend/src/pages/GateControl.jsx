import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const GateControl = () => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('Oczekiwanie na skan...');
    const [log, setLog] = useState([]);

    const captureAndVerify = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setStatus('Weryfikacja...');

        try {
            const response = await api.post('/logs/', {
                image: imageSrc,
            });

            if (response.data.access_granted) {
                setStatus('DOSTĘP PRZYZNANY');
                const newLog = { 
                    time: new Date().toLocaleTimeString(), 
                    msg: "Wejście: Autoryzacja poprawna", 
                    success: true 
                };
                setLog([newLog, ...log]);
            } else {
                setStatus('DOSTĘP ZABRONIONY');
                const newLog = { 
                    time: new Date().toLocaleTimeString(), 
                    msg: "Odmowa: Błąd biometrii", 
                    success: false 
                };
                setLog([newLog, ...log]);
            }
        } catch (err) {
            setStatus('Błąd połączenia');
            console.error(err);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <Navbar />
            
            <div style={styles.contentContainer}>
                {/* GÓRNA KARTA - KAMERA */}
                <div style={styles.mainCard}>
                    <h1 style={styles.title}>PUNKT KONTROLNY - WEJŚCIE GŁÓWNE</h1>
                    
                    {/* Zielona ramka skanera */}
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
                        
                        {/* Kontener na przyciski  wewnątrz ramki */}
                        <div style={styles.controlsContainer}>
                            <p style={styles.statusText}>{status}</p>
                            
                            <button 
                                onClick={captureAndVerify} 
                                style={styles.scanButton}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#357a46'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#009746'}
                            >
                                Zeskanuj i wejdź
                            </button>
                        </div>
                    </div>
                </div>

                {/* dolna karta*/}
                <div style={styles.logsCard}>
                    <h3 style={styles.logsTitle}>Ostatnie zdarzenia:</h3>
                    
                    {log.length === 0 ? (
                        <p style={{color: '#ccc', fontStyle: 'italic'}}>Brak nowych zdarzeń...</p>
                    ) : (
                        <ul style={styles.logList}>
                            {log.map((entry, i) => (
                                <li key={i} style={styles.logItem}>
                                    <span style={{fontWeight: 'bold', marginRight: '10px'}}>[{entry.time}]</span> 
                                    <span style={{color: entry.success ? 'green' : 'red'}}>{entry.msg}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: {
        minHeight: '100vh',
        backgroundColor: '#eaf4ec',
    },
    contentContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    mainCard: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    title: {
        color: '#4361ee',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '40px',
        textTransform: 'uppercase',
        marginTop: 0,
    },
    scannerFrame: {
        border: '5px solid #009051',
        borderRadius: '30px',
        width: '350px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 0 15px rgba(0, 151, 70, 0.2)',
        backgroundColor: '#fff',
    },
    webcamContainer: {
        width: '100%',
        height: '300px',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    webcam: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    controlsContainer: {
        padding: '20px',
        width: '100%',
    },
    statusText: {
        color: '#777',
        marginBottom: '15px',
        fontWeight: '500',
        marginTop: 0,
    },
    scanButton: {
        backgroundColor: '#009051',
        color: 'white',
        border: 'none',
        padding: '12px 0',
        width: '100%',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    logsCard: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '30px 40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        minHeight: '200px',
    },
    logsTitle: {
        color: '#777',
        fontSize: '18px',
        marginTop: 0,
        marginBottom: '20px',
    },
    logList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        textAlign: 'left',
    },
    logItem: {
        padding: '10px 0',
        borderBottom: '1px solid #eee',
        fontSize: '16px',
    }
};

export default GateControl;