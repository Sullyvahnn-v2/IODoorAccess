import { useState } from 'react';
import api from '../api/axios';

const AddUser = ({ onUserAdded }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/signup', {
                email,
                password,
                is_admin: false 
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
        <div style={styles.card}>
            <h3 style={styles.cardTitle}>Zarejestruj nowego pracownika</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputContainer}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={styles.input} 
                    />
                    <input 
                        type="password" 
                        placeholder="Hasło tymczasowe" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={styles.input} 
                    />
                </div>
                <button 
                    type="submit" 
                    style={styles.button}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#357a46'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#438e58'}
                >
                    Dodaj do bazy
                </button>
            </form>
            {message && (
                <p style={{ 
                    ...styles.message, 
                    color: message.includes('Błąd') ? '#d32f2f' : '#438e58' 
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '30px 40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px',
        width: '100%',
        boxSizing: 'border-box',
    },
    cardTitle: {
        color: '#777',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '20px',
        marginTop: 0,
    },
    form: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
    },
    inputContainer: {
        display: 'flex',
        gap: '20px',
        flex: 1,
    },
    input: {
        flex: 1,
        border: 'none',
        borderBottom: '2px solid #438e58',
        padding: '10px 0',
        fontSize: '14px',
        outline: 'none',
        color: '#555',
        backgroundColor: 'transparent',
    },
    button: {
        backgroundColor: '#438e58',
        color: 'white',
        padding: '12px 40px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        minWidth: '200px',
    },
    message: {
        marginTop: '15px',
        fontSize: '14px',
        fontWeight: '500',
    }
};

export default AddUser;