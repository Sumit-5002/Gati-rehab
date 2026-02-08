
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, subscribeToUserData, logout as firebaseLogout } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserData = null;

        const unsubscribeAuth = onAuthChange((data) => {
            if (data?.user) {
                setUser(data.user);

                // Clean up previous subscription if any
                if (unsubscribeUserData) unsubscribeUserData();

                // Start real-time subscription for Firestore data
                unsubscribeUserData = subscribeToUserData(data.user.uid, (firestoreData) => {
                    if (firestoreData) {
                        const normalizedUserData = {
                            ...firestoreData,
                            userType: firestoreData.userType || firestoreData.role || 'patient'
                        };
                        setUserData(normalizedUserData);
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                });
            } else {
                setUser(null);
                setUserData(null);
                if (unsubscribeUserData) unsubscribeUserData();
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserData) unsubscribeUserData();
        };
    }, []);

    const logout = async () => {
        await firebaseLogout();
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
