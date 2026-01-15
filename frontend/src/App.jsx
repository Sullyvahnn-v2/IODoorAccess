import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import UsersList from './pages/UsersList';
import GateControl from './pages/GateControl'; // ZOSTAW TYLKO JEDNĄ TAKĄ LINIĘ
import Navbar from './components/Navbar';
import LogsView from './pages/LogsView';

// Komponent chroniący dostęp - weryfikuje sesję użytkownika
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: '20px' }}>Ładowanie systemu...</div>;
    if (!user) return <Navigate to="/login" />;

    return (
        <>
            <Navbar /> {/* Navbar widoczny tylko dla zalogowanych */}
            {children}
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div style={{ padding: '20px' }}>
                                    <h1>Witaj w Panelu Administratora!</h1>
                                    <UsersList />
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/gate"
                        element={
                            <ProtectedRoute>
                                <GateControl />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/logs"
                        element={
                            <ProtectedRoute>
                                <LogsView />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;