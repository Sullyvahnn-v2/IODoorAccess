import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../api/axios';

const GateControl = () => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('Oczekiwanie na skan...');
    const [log, setLog] = useState([]);

    const captureAndVerify = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setStatus('Weryfikacja...');

        try {
            // Symulacja wysłania zdjęcia do Twojego log.py w celu autoryzacji
            const response = await api.post('/logs/', {
                image: imageSrc,
                // Tutaj w przyszłości dodasz odczytany z QR email
            });

            if (response.data.access_granted) {
                setStatus('DOSTĘP PRZYZNANY');
                setLog([{time: new Date().toLocaleTimeString(), msg: "Wejście: Autoryzacja poprawna"}, ...log]);
            } else {
                setStatus('DOSTĘP ZABRONIONY');
                setLog([{time: new Date().toLocaleTimeString(), msg: "Odmowa: Błąd biometrii"}, ...log]);
            }
        } catch (err) {
            setStatus('Błąd połączenia z bramką');
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Punkt Kontrolny - Wejście Główne</h2>
            <div style={{ margin: '0 auto', width: '400px', border: '5px solid', borderColor: status.includes('PRZYZNANY') ? 'green' : 'red' }}>
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width={400} />
            </div>
            <h3 style={{ color: status.includes('PRZYZNANY') ? 'green' : 'red' }}>{status}</h3>
            <button onClick={captureAndVerify} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>
                ZESKANUJ I WEJDŹ
            </button>

            <div style={{ marginTop: '30px', textAlign: 'left' }}>
                <h4>Ostatnie zdarzenia:</h4>
                <ul>
                    {log.map((entry, i) => <li key={i}>[{entry.time}] {entry.msg}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default GateControl;