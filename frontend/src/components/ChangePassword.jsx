import { useState } from 'react';

const ChangePassword = () => {
    // Stany dla formularza
    const [formData, setFormData] = useState({
        email: '',
        tempPassword: '',
        newPassword: '',
        repeatPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Funkcja zmiany hasła zostanie podpięta pod backend w kolejnym etapie.");
    };

    return (
        <div style={styles.card}>
            <h3 style={styles.title}>Zmiana hasła do konta pracownika</h3>
            
            <form onSubmit={handleSubmit}>
                <div style={styles.row}>
                    <input 
                        type="email" 
                        name="email"
                        placeholder="Email" 
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input} 
                    />
                    <input 
                        type="password" 
                        name="tempPassword"
                        placeholder="Hasło tymczasowe" 
                        value={formData.tempPassword}
                        onChange={handleChange}
                        style={styles.input} 
                    />
                </div>
                
                <div style={styles.row}>
                    <input 
                        type="password" 
                        name="newPassword"
                        placeholder="Nowe hasło" 
                        value={formData.newPassword}
                        onChange={handleChange}
                        style={styles.input} 
                    />
                    <input 
                        type="password" 
                        name="repeatPassword"
                        placeholder="Powtórz nowe hasło" 
                        value={formData.repeatPassword}
                        onChange={handleChange}
                        style={styles.input} 
                    />
                </div>

                <div style={styles.buttonContainer}>
                    <button type="submit" style={styles.button}>
                        Zmień hasło
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '800px', // Szerokość formularza
        marginTop: '30px'
    },
    title: {
        color: '#777',
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '30px',
        marginTop: 0
    },
    row: {
        display: 'flex',
        gap: '30px',
        marginBottom: '30px'
    },
    input: {
        flex: 1,
        border: 'none',
        borderBottom: '2px solid #009746',
        padding: '10px 0',
        fontSize: '14px',
        outline: 'none',
        color: '#555'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    button: {
        backgroundColor: '#009746',
        color: 'white',
        padding: '12px 60px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default ChangePassword;