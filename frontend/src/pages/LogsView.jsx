import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const LogsView = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/logs/'); 
                setLogs(response.data.logs || response.data || []);
            } catch (err) {
                console.error("Błąd pobierania logów", err);
                //dane testowe
                setLogs([
                    { id: 1, time: '2026-01-26 00:55:10', user_email: 'admin@admin.com', access_granted: true, error_log: '' },
                    { id: 2, time: '2026-01-26 00:58:45', user_email: 'test1@skw.pl', access_granted: false, error_log: 'Brak w bazie' }
                ]);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div style={styles.pageWrapper}>
            <Navbar />
            
            <div style={styles.contentContainer}>
                <div style={styles.card}>
                    <h2 style={styles.title}>Historia dostępu (Raporty)</h2>
                    
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Czas</th>
                                <th style={styles.th}>Email pracownika</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Szczegóły</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map((log, index) => (
                                    <tr key={log.id || index} style={{
                                        ...styles.tr,
                                        backgroundColor: log.access_granted ? 'white' : '#fff5f5'
                                    }}>
                                        <td style={styles.td}>{log.time}</td>
                                        <td style={styles.td}>{log.user_email || 'Nieznany'}</td>
                                        <td style={{
                                            ...styles.td, 
                                            fontWeight: 'bold',
                                            color: log.access_granted ? '#009051' : '#d32f2f'
                                        }}>
                                            {log.access_granted ? 'PRZYZNANO' : 'ODMOWA'}
                                        </td>
                                        <td style={{...styles.td, color: '#777'}}>
                                            {log.error_log || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#888'}}>
                                        Brak historii logowania.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: { //k głównego tła
        minHeight: '100vh',
        backgroundColor: '#eaf4ec',
    },
    contentContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '30px 40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        minHeight: '400px', 
    },
    title: {
        color: '#777',
        fontSize: '20px',
        fontWeight: 'bold',
        marginTop: 0,
        marginBottom: '30px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: { //nagłówek tabeli
        color: '#009051',
        borderTop: '2px solid #009051',
        borderBottom: '2px solid #009051',
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    td: { //reszta tabeli
        padding: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #eee',
        fontSize: '15px',
        color: '#333',
    },
    tr: {
        transition: 'background-color 0.2s',
    }
};

export default LogsView;