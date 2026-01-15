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

    return (
        <AuthContext.Provider value={{ user, login, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);