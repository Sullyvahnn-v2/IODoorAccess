import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GateControl from './pages/GateControl'; 
import LogsView from './pages/LogsView';

// Komponent chroniący dostęp
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: '20px' }}>Ładowanie systemu...</div>;
    if (!user) return <Navigate to="/login" />;

    return (
        <>
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
                                <Dashboard />
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