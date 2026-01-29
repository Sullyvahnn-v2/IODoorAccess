import { useEffect, useState, useRef  } from 'react';
import api from '../api/axios';
import {useAuth} from "../context/AuthContext.jsx";
import styled from 'styled-components';
import DownloadableQR from './QRDownload.jsx'
import Webcam from 'react-webcam';


const isExpired = (expireTime) => {
    if (!expireTime) return false;
    return new Date(expireTime) < new Date();
};



const UserList = ({ refreshTrigger }) => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const {generateQR} = useAuth()
    const [expireInput, setExpireInput] = useState({});
    const [showWebcam, setShowWebcam] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const webcamRef = useRef(null);


    const openWebcam = (userId) => {
        setCurrentUserId(userId);
        setShowWebcam(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Na pewno chcesz usunąć tego użytkownika?")) return;

        try {
            await api.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            console.error(err);
            alert("Nie udało się usunąć użytkownika");
        }
    };

    const updateExpireTime = async (userId, days) => {
        await api.put(`/users/${userId}`, {
            days: days
        });
    };

    const handleExtendExpire = async (userId, days) => {
        try {
            await updateExpireTime(userId, days);

            const res = await api.get(`/users/${userId}`);
            const updatedUser = res.data;
            console.log(res.data)

            setUsers(prev =>
                prev.map(u => (u.id === userId ? updatedUser : u))
            );
        } catch (err) {
            alert('Failed to update expire time');
        }
    };

    const uploadPhoto = async (blob) => {
        const formData = new FormData();
        formData.append('photo', blob, 'photo.png');

        await api.post(`/users/${currentUserId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        const res = await api.get(`/users/${currentUserId}`);
        const updatedUser = res.data;

        setUsers(prev =>
            prev.map(u => (u.id === currentUserId ? updatedUser : u))
        );
    };

    const handleCapturePhoto = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot(); // base64

        try {
            const blob = await (await fetch(imageSrc)).blob(); // convert base64 to blob
            const formData = new FormData();
            formData.append('photo', blob, 'photo.png');

            await api.post(`/users/${currentUserId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            alert('Zdjęcie i embedding zapisane!');
            setShowWebcam(false);

            // Fetch updated user
            const res = await api.get(`/users/${currentUserId}`);
            const updatedUser = res.data;
            setUsers(prev => prev.map(u => (u.id === currentUserId ? updatedUser : u)));

        } catch (err) {
            console.error(err);
            alert('Błąd podczas robienia zdjęcia!');
        }
    };

    const handleGenerateQR = async (userId) => {
        try {
            await generateQR(userId);

            const res = await api.get(`/users/${userId}`);
            const updatedUser = res.data;

            setUsers(prev =>
                prev.map(user => (user.id === userId ? updatedUser : user))
            );
        } catch (err) {
            console.error(err);
            alert('Failed to generate QR');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            console.log("Dane z backendu:", response.data); // To zobaczysz w konsoli (F12)
            
            // Zabezpieczenie: Jeśli backend zwraca tablicę bezpośrednio
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } 
            // Jeśli backend zwraca obiekt (np. { users: [...] })
            else if (response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
            }
            else {
                console.error("Nieprawidłowy format danych:", response.data);
                setUsers([]); // Ustaw pustą listę, żeby nie wywalić aplikacji
            }

        } catch (error) {
            console.error("Błąd pobierania listy:", error);
            setError('Nie udało się pobrać listy pracowników.');
        }
    };

    useEffect(() => {
       fetchUsers();
    }, [refreshTrigger]);

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>Lista pracowników</h3>
            
            {error && <p style={{color: 'red'}}>{error}</p>}
            {showWebcam && (
                <WebcamModal>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/png"
                        width={400}
                        videoConstraints={{
                            facingMode: "user"
                        }}
                    />
                    <ModalButtons>
                        <button onClick={handleCapturePhoto}>Zrób zdjęcie</button>
                        <button onClick={() => setShowWebcam(false)}>Anuluj</button>
                    </ModalButtons>
                </WebcamModal>
            )}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Data Wygaśnięcia</th>
                        <th style={styles.th}>Kod QR do wejścia</th>
                        <th style={styles.th}>Aktywny</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(users) && users.length > 0 ? (
                        users.slice(1).map((user, index) => (

                            <tr key={user.id || index} style={{
                                ...styles.tr,
                                backgroundColor: isExpired(user.expire_time) ? '#ffe5e5' : 'white',
                                color: isExpired(user.expire_time) ? '#900' : 'black',
                            }} onMouseOver={e => e.currentTarget.style.backgroundColor = !isExpired(user.expire_time) ? 'white' : '#e1b6b6'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = !isExpired(user.expire_time) ? 'white' : '#ffe5e5'}>
                                <td style={styles.td}>
                                    <span style={{textDecoration: 'underline'}}>{user.email}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.daysContainer}>
                                        <span>
                                            {user.expire_time
                                                ? new Date(user.expire_time).toLocaleDateString()
                                                : '—'}
                                        </span>
                                        <div style={styles.expireInputRow}>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="dni"
                                                value={expireInput[user.id] || ''}
                                                onChange={(e) =>
                                                    setExpireInput(prev => ({
                                                        ...prev,
                                                        [user.id]: e.target.value
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleExtendExpire(user.id, Number(expireInput[user.id]));
                                                    }
                                                }}
                                                style={styles.expireInput}
                                            />
                                            <button
                                                style={styles.expireButton}
                                                onClick={() => handleExtendExpire(user.id, Number(expireInput[user.id]))}

                                            >
                                                dodaj
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.qrPlaceholder}>
                                        {user.qr_token == null ? (
                                            <QRButton onClick={() => handleGenerateQR(user.id)}>
                                                Generuj QR
                                            </QRButton>
                                        ) : (
                                            <div style={styles.qrPlaceholder}>
                                                <DownloadableQR
                                                    value={user.qr_token}
                                                    filename={`qr_${user.email}`}
                                                />
                                                <span style={{ fontSize: '10px', color: '#777' }}>
                                                    Zeskanuj przy wejściu
                                                </span>
                                            </div>
                                        )}

                                        <PhotoButton onClick={() => openWebcam(user.id)}>
                                            Dodaj zdjęcie
                                        </PhotoButton>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    {isExpired(user.expire_time) ? (
                                        <button
                                            style={{
                                                backgroundColor: '#c00',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            Usuń
                                        </button>
                                    ) : (
                                        <span style={{ color: '#777', fontSize: '12px' }}>Aktywny</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>
                                Brak pracowników do wyświetlenia lub problem z połączeniem.
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
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        color: '#009746',
        borderTop: '2px solid #009746',
        borderBottom: '2px solid #009746',
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
    },
    tr: {
        backgroundColor: 'white',
    },
    qrPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
    },
    daysContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    expireButton: {
        backgroundColor: '#009746',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        marginTop: '5px'
    },
    expireInput: {
        width: '70px',
        padding: '6px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '12px',
        textAlign: 'center',
    },
    expireInputRow: {
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
    },
};

const QRButton = styled.button`
  background-color: #009746;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover {
    background-color: #007633;
  }
`;

const PhotoButton = styled.button`
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  margin-top: 5px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #004999;
  }
`;

const WebcamModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(0,0,0,0.3);
  z-index: 1000;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;

  button {
    padding: 8px 16px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  button:first-child {
    background-color: #009746;
    color: white;
  }

  button:last-child {
    background-color: #c00;
    color: white;
  }
`;


export default UserList;