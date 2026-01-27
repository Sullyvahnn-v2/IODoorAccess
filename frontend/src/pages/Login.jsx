import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Próba logowania...");
            const success = await login(email, password);

            if (success) {
                console.log("Logowanie udane, przenoszę do dashboardu");
                navigate('/dashboard');
            } else {
                alert('Nie udało się zalogować. Sprawdź dane.');
            }
        } catch (err) {
            console.error("Błąd logowania:", err);
            alert('Błąd logowania: ' + (err.response?.data?.message || 'Błąd połączenia'));
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.logoPlaceholder}>
                miejsce na logo
            </div>
            
            <div style={styles.loginBox}>
                <h2 style={styles.title}>
                    Panel logowania<br />
                    administratora
                </h2>

                <p style={styles.description}>
                    Hej! Wprowadź poniżej swoje dane, aby zalogować się do panelu administratora.
                </p>
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />
                    
                    <input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    
                    <button 
                        type="submit" 
                        style={styles.button}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#357a46'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#438e58'}
                    >
                        Zaloguj
                    </button>
                </form>
            </div>
        </div>
    );
};

// Obiekt ze stylami (CSS w JS)
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#eaf4ec', // Jasnozielone tło całej strony
        fontFamily: 'Arial, sans-serif',
    },
    logoPlaceholder: {
        backgroundColor: 'white',
        padding: '40px 60px',
        marginBottom: '40px',
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#000',
        textTransform: 'lowercase',
        letterSpacing: '0.5px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Lekki cień pod logo
    },
    loginBox: {
        backgroundColor: 'white', // Białe tło pudełka
        borderRadius: '30px', // Mocno zaokrąglone rogi
        padding: '50px 60px',
        width: '450px',
        textAlign: 'left',
        boxSizing: 'border-box',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Lekki cień
    },
    title: {
        color: '#438e58', // Zielony kolor tekstu
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '20px',
        lineHeight: '1.2',
        textAlign: 'center', // Wyśrodkowanie tytułu
    },
    description: {
        color: '#777', // Szary kolor tekstu
        fontSize: '14px',
        marginBottom: '40px',
        textAlign: 'center', // Wyśrodkowanie opisu
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        border: 'none',
        borderBottom: '2px solid #438e58', // Tylko dolna linia
        padding: '10px 0',
        marginBottom: '30px',
        fontSize: '16px',
        outline: 'none',
        width: '100%',
        color: '#555',
    },
    button: {
        backgroundColor: '#438e58', // Zielone tło
        color: 'white',
        padding: '12px',
        border: 'none',
        borderRadius: '12px', // Zaokrąglone rogi
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        width: '100%',
        transition: 'background-color 0.3s',
    }
};

export default Login;