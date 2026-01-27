import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

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
            <div style={styles.logoContainer}>
                <img src={logo} alt="SKW Logo" style={styles.logoImage} />
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
// style
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#eaf4ec',
        fontFamily: 'Arial, sans-serif',
    },
    //logoooo
    logoContainer: {
        backgroundColor: '#eaf4ec',
        padding: '20px 40px',
        marginBottom: '40px',
        //boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',            
        justifyContent: 'center',   
        alignItems: 'center',       
        borderRadius: '10px'
    },
    logoImage: {
        maxHeight: '100px',
        width: 'auto',
        display: 'block'
    },
    loginBox: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '50px 60px',
        width: '450px',
        textAlign: 'left',
        boxSizing: 'border-box',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
    },
    title: {
        color: '#438e58',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '20px',
        lineHeight: '1.2',
        textAlign: 'center',
    },
    description: {
        color: '#777',
        fontSize: '14px',
        marginBottom: '40px',
        textAlign: 'center',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        border: 'none',
        borderBottom: '2px solid #438e58',
        padding: '10px 0',
        marginBottom: '30px',
        fontSize: '16px',
        outline: 'none',
        width: '100%',
        color: '#555',
    },
    button: {
        backgroundColor: '#438e58',
        color: 'white',
        padding: '12px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        width: '100%',
        transition: 'background-color 0.3s',
    }
};

export default Login;