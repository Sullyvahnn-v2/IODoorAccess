import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Odliczanie 4 sekundy (4000 ms) przed powrotem do logowania
        const timer = setTimeout(() => {
            navigate('/login');
        }, 4000);

        return () => clearTimeout(timer); // Czyszczenie timera przy odmontowaniu
    }, [navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.text}>Nastąpiło poprawne wylogowanie</h2>
                <div style={styles.loaderBar}>
                    <div style={styles.loaderProgress}></div>
                </div>
                <p style={styles.subtext}>Za chwilę wrócisz do panelu logowania...</p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        backgroundColor: '#eaf4ec',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
    },
    card: {
        backgroundColor: 'white',
        padding: '50px',
        borderRadius: '30px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
    },
    text: {
        color: '#438e58',
        fontSize: '24px',
        marginBottom: '20px'
    },
    subtext: {
        color: '#777',
        fontSize: '14px'
    },
    loaderBar: {
        width: '100%',
        height: '4px',
        backgroundColor: '#eee',
        borderRadius: '2px',
        marginBottom: '15px',
        overflow: 'hidden'
    },
    loaderProgress: {
        width: '100%',
        height: '100%',
        backgroundColor: '#438e58',
        animation: 'shrink 4s linear forwards'
    }
};

// Dodaj ten styl do index.css, aby pasek się "kurczył":
// @keyframes shrink { from { width: 100%; } to { width: 0%; } }

export default LogoutPage;