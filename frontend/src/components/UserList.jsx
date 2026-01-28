import { useEffect, useState } from 'react';
import api from '../api/axios';

const UserList = ({ refreshTrigger }) => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            console.log("Dane z backendu:", response.data); // To zobaczysz w konsoli (F12)
            
            // Zabezpieczenie: Jeśli backend zwraca tablicę bezpośrednio
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } 
            // Jeśli backend zwraca obiekt (np. { users: [...] })
            else if (response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
            }
            else {
                console.error("Nieprawidłowy format danych:", response.data);
                setUsers([]); // Ustaw pustą listę, żeby nie wywalić aplikacji
            }

        } catch (error) {
            console.error("Błąd pobierania listy:", error);
            setError('Nie udało się pobrać listy pracowników.');
            //daene testowe
            //setUsers([
             //   { id: 1, email: 'admin@admin.com', created_at: '2026-01-25 12:00', qr_code: 'demo' }
            //]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [refreshTrigger]);

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>Lista pracowników</h3>
            
            {error && <p style={{color: 'red'}}>{error}</p>}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Data utworzenia</th>
                        <th style={styles.th}>Kod QR do wejścia</th>
                    </tr>
                </thead>
                <tbody>
                    {/* ZABEZPIECZENIE: Wyświetlaj tylko jeśli users to tablica i ma elementy */}
                    {Array.isArray(users) && users.length > 0 ? (
                        users.map((user, index) => (
                            <tr key={user.id || index} style={styles.tr}>
                                <td style={styles.td}>
                                    <span style={{textDecoration: 'underline'}}>{user.email}</span>
                                </td>
                                <td style={styles.td}>{user.created_at}</td>
                                <td style={styles.td}>
                                    <div style={styles.qrPlaceholder}>
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${user.email}`} 
                                            alt="QR" 
                                        />
                                        <span style={{fontSize: '10px', color: '#777'}}>Zeskanuj przy wejściu</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>
                                Brak pracowników do wyświetlenia lub problem z połączeniem.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '30px 40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        width: '100%',
        overflowX: 'auto'
    },
    header: {
        color: '#777',
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '18px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        color: '#009746',
        borderTop: '2px solid #009746',
        borderBottom: '2px solid #009746',
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    td: {
        padding: '20px 15px',
        textAlign: 'center',
        borderBottom: '1px solid #ddd',
        color: 'black',
        fontSize: '16px',
    },
    tr: {
        backgroundColor: 'white',
    },
    qrPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
    }
};

export default UserList;