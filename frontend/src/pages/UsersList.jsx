import { useEffect, useState } from 'react';
import api from '../api/axios';
import { QRCodeCanvas } from 'qrcode.react';
import AddUser from './AddUser'; // Import punktu 2

const UsersList = () => {
    const [users, setUsers] = useState([]);

    // Funkcja odświeżania listy po dodaniu nowego pracownika
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/'); //
            setUsers(response.data.users || []);
        } catch (err) {
            console.error("Błąd pobierania pracowników");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            {/* --- PUNKT 2: Sekcja dodawania użytkownika --- */}
            <div style={{ marginBottom: '40px' }}>
                <AddUser onUserAdded={fetchUsers} />
            </div>

            <hr />

            {/* --- LISTA PRACOWNIKÓW --- */}
            <h2>Panel Administratora - Lista Pracowników</h2>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th>Email</th>
                        <th>Data utworzenia</th>
                        <th>Kod QR do wejścia</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td style={{ padding: '10px' }}>{user.email}</td>
                            <td style={{ padding: '10px' }}>{user.created_at}</td>
                            <td style={{ textAlign: 'center', padding: '10px' }}>
                                {/* Spełnienie wymagania: Generowanie kodów QR */}
                                <QRCodeCanvas value={user.email} size={100} />
                                <p style={{ fontSize: '10px', margin: '5px 0' }}>Zeskanuj przy wejściu</p>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UsersList;