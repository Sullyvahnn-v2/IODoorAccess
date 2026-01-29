import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            return true; // Zwracamy sukces
        } catch (error) {
            setUser(null);
            return false; // Zwracamy porażkę
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const response = await api.post('/auth/logout');
            console.log('Wylogowano:', response.data);
            // tutaj możesz np. wyczyścić stan użytkownika lub przekierować:
            // setUser(null);
            // navigate('/login');
        } catch (err) {
            console.error('Błąd przy wylogowaniu:', err.response?.data || err.message);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.status === 200) {
                // POPRAWKA: Czekamy na wynik weryfikacji tożsamości
                const isAuthenticated = await checkAuth();

                // Zwracamy true TYLKO jeśli checkAuth też się udało (user został ustawiony)
                return isAuthenticated;
            }
        } catch (err) {
            console.error("Login error details:", err.response?.data);
            throw err;
        }
        return false;
    };

    const generateQR = async (userId) => {
        try {
            const response = await api.post('/auth/qr/generate', {
                user_id: userId
            });

            return response.data.token;
        } catch (err) {
            console.error("QR generate error:", err.response?.data);
            throw err;
        }
    };

    const verifyQR = async (token) => {
        try {
            const response = await api.post('/auth/qr/verify', { token });

            if (response.status === 200) {
                return true;
            }
        } catch (err) {
            console.error("QR verify error:", err.response?.data);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                generateQR,
                verifyQR,
                loading,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);