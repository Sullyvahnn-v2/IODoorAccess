import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Zmieniamy na async, aby mieć pewność, że wylogowanie zakończyło się przed zmianą strony
    const handleLogout = async () => {
        try {
            console.log("Inicjacja wylogowania...");
            await logout(); 
            // KLUCZOWA ZMIANA: Przekierowanie na stronę z komunikatem, a nie na login
            navigate('/logout'); 
        } catch (error) {
            console.error("Błąd podczas wylogowywania:", error);
        }
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.menuContainer}>
                <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                <Link to="/gate" style={styles.link}>Bramka</Link>
                <Link to="/logs" style={styles.link}>Logi</Link>
            </div>
            
            <button 
                onClick={handleLogout} 
                style={styles.logoutBtn}
                onMouseOver={(e) => e.target.style.backgroundColor = '#ff4d4d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b6b'}
            >
                Wyloguj
            </button>
        </nav>
    );
};

const styles = {
    nav: {
        backgroundColor: '#009051',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    menuContainer: {
        display: 'flex',
        gap: '30px',
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '16px',
        transition: 'opacity 0.2s',
    },
    logoutBtn: {
        backgroundColor: '#ff6b6b',
        color: 'white',
        border: 'none',
        padding: '8px 25px',
        borderRadius: '5px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.3s',
    }
};

export default Navbar;