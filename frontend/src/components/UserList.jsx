import { useEffect, useState } from 'react';
import api from '../api/axios';
import downloadIcon from '../assets/download.png';
import deleteIcon from '../assets/delete.png';

const UserList = ({ refreshTrigger }) => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else if (response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Błąd pobierania listy:", error);
            setError('Nie udało się pobrać listy pracowników.');
        }
    };

    // funkcja usuwania
    const handleDelete = async (userId, userEmail) => {
        // Zabezpieczenie na froncie: Nie pozwól usunąć admina
        if (userEmail === 'admin@admin.com') {
            alert("Nie można usunąć głównego administratora!");
            return;
        }

        const confirmDelete = window.confirm(`Czy na pewno chcesz usunąć pracownika: ${userEmail}?`);
        if (!confirmDelete) return;

        //usuanie
        try {
            await api.delete(`/users/${userId}`); // Wywołanie backendu
            setUsers(users.filter(user => user.id !== userId));
            alert("Pracownik został usunięty.");
        } catch (err) {
            console.error("Błąd usuwania:", err);
            alert("Wystąpił błąd podczas usuwania. Sprawdź uprawnienia.");
        }
    };

    const generateAndDownloadCard = async (qrUrl, email) => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const qrBitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            const width = 1011;
            const height = 638;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const cornerRadius = 60; 
            ctx.fillStyle = "#ffffff"; 
            ctx.beginPath();
            ctx.roundRect(0, 0, width, height, cornerRadius);
            ctx.fill();
            const qrSize = 400; 
            const qrX = (width - qrSize) / 2;
            const qrY = (height - qrSize) / 2 - 30; 
            ctx.drawImage(qrBitmap, qrX, qrY, qrSize, qrSize);
            ctx.fillStyle = "#000000";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText(email, width / 2, qrY + qrSize + 70);
            const cardUrl = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = cardUrl;
            link.download = `Karta_Dostepu_${email}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Błąd generowania karty:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [refreshTrigger]);

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>Lista pracowników</h3>
            
            {error && <p style={{color: 'red'}}>{error}</p>}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Data utworzenia</th>
                        <th style={styles.th}>Kod QR do wejścia</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(users) && users.length > 0 ? (
                        users.map((user, index) => {
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${user.email}`;
                            // sprawdzenie - czy to nie admin?
                            const isAdmin = user.email === 'admin@admin.com';
                            
                            return (
                                <tr key={user.id || index} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.emailContainer}>
                                            <span style={{textDecoration: 'underline'}}>{user.email}</span>
                                            
                                            {/* kosz - tylko jeśli to nie admin*/}
                                            {!isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    style={styles.deleteBtn}
                                                    title="Usuń pracownika"
                                                >
                                                    <img 
                                                        src={deleteIcon} 
                                                        alt="Usuń" 
                                                        style={{width: '24px', height: '24px'}} 
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={styles.td}>{user.created_at}</td>
                                    <td style={styles.td}>
                                        <div style={styles.qrContainer}>
                                            <div style={styles.qrWrapper}>
                                                <img 
                                                    src={qrUrl} 
                                                    alt="QR" 
                                                    style={{width: '80px', height: '80px'}}
                                                />
                                                <span style={styles.scanHint}>Zeskanuj przy wejściu</span>
                                            </div>
                                            <button 
                                                onClick={() => generateAndDownloadCard(qrUrl, user.email)}
                                                style={styles.downloadBtn}
                                                title="Pobierz kartę dostępową"
                                            >
                                                <img 
                                                    src={downloadIcon} 
                                                    alt="Pobierz" 
                                                    style={{width: '32px', height: '32px'}} 
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>
                                Brak pracowników do wyświetlenia.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '30px 40px',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        width: '100%',
        overflowX: 'auto' 
    },
    header: {
        color: '#777',
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 'bold'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        color: '#438e58',
        borderTop: '2px solid #438e58',
        borderBottom: '2px solid #438e58',
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    td: {
        padding: '20px 15px',
        textAlign: 'center',
        borderBottom: '1px solid #ddd',
        color: 'black',
        fontSize: '16px',
        verticalAlign: 'middle',
    },
    tr: {
        backgroundColor: 'white',
    },
    // email i kosz xd
    emailContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px', // Odstęp między elementami
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        transition: 'opacity 0.2s',
    },
    qrContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
    },
    qrWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    scanHint: {
        fontSize: '10px', 
        color: '#777', 
        marginTop: '5px'
    },
    downloadBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default UserList;