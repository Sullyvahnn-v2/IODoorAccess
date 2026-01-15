import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault(); // To zatrzymuje odświeżanie strony!
    try {
        console.log("Próba logowania...");
        const success = await login(email, password);

        if (success) {
            console.log("Logowanie udane, przenoszę do dashboardu");
            navigate('/dashboard'); // To Cię faktycznie przeniesie
        } else {
            alert('Nie udało się zalogować. Sprawdź dane.');
        }
    } catch (err) {
        console.error("Błąd logowania:", err);
        alert('Błąd logowania: ' + (err.response?.data?.message || 'Błąd połączenia'));
    }
};

    return (
        <div style={{ padding: '20px' }}>
            <h2>Panel Administratora - Logowanie</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                /><br/><br/>
                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                /><br/><br/>
                <button type="submit">Zaloguj się</button>
            </form>
        </div>
    );
};

export default Login;