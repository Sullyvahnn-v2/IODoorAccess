import { useEffect, useState } from 'react';
import api from '../api/axios';

const LogsView = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/logs/'); //
                setLogs(response.data.logs || []);
            } catch (err) {
                console.error("Błąd pobierania logów");
            }
        };
        fetchLogs();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Historia Dostępu (Raporty)</h2>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th>Czas</th>
                        <th>Email Pracownika</th>
                        <th>Status</th>
                        <th>Szczegóły</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} style={{ backgroundColor: log.access_granted ? '#eaffea' : '#ffeaea' }}>
                            <td style={{ padding: '8px' }}>{log.time}</td>
                            <td style={{ padding: '8px' }}>{log.user_email}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                {log.access_granted ? 'PRZYZNANO' : 'ODMOWA'}
                            </td>
                            <td style={{ padding: '8px' }}>{log.error_log || 'Brak błędów'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LogsView;