import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AddUser from '../components/AddUser';
import UserList from '../components/UserList'; 

const Dashboard = () => {
    const [refreshList, setRefreshList] = useState(false);

    const handleUserAdded = () => {
        setRefreshList(!refreshList);
    };

    return (
        <div style={styles.pageWrapper}>
            <Navbar />
            <div style={styles.contentContainer}>
                <h1 style={styles.welcomeTitle}>Witaj w panelu administratora!</h1>
                <AddUser onUserAdded={handleUserAdded} />
                <div style={{height: '40px'}}></div>
                <UserList refreshTrigger={refreshList} />
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: {
        minHeight: '100vh',
        backgroundColor: '#eaf4ec',
    },
    contentContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    welcomeTitle: {
        color: '#009746',
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '30px',
    }
};

export default Dashboard;