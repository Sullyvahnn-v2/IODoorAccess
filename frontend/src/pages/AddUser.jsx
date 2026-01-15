import { useState } from 'react';
import api from '../api/axios';

const AddUser = ({ onUserAdded }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Rejestracja nowego pracownika w Twoim systemie
            await api.post('/auth/signup', {
                email,
                password,
                is_admin: isAdmin
            });
            setMessage('Pracownik dodany pomyślnie!');
            setEmail('');
            setPassword('');
            if (onUserAdded) onUserAdded();
        } catch (err) {
            setMessage('Błąd: ' + (err.response?.data?.message || 'Nie udało się dodać pracownika'));
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3>Zarejestruj Nowego Pracownika</h3>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{padding: '8px', marginRight: '10px'}} />
                <input type="password" placeholder="Hasło tymczasowe" value={password} onChange={(e) => setPassword(e.target.value)} required style={{padding: '8px', marginRight: '10px'}} />
                <button type="submit" style={{ marginLeft: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                    Dodaj do bazy
                </button>
            </form>
            {message && <p style={{ color: message.includes('Błąd') ? 'red' : 'green' }}>{message}</p>}
        </div>
    );
};

export default AddUser;