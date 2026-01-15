import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <nav style={{ padding: '15px', background: '#2c3e50', color: 'white', display: 'flex', gap: '20px' }}>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Pracownicy</Link>
            <Link to="/gate" style={{ color: 'white', textDecoration: 'none' }}>Bramka</Link>
            <Link to="/logs" style={{ color: 'white', textDecoration: 'none' }}>Logi</Link>
        </nav>
    );
};

export default Navbar;