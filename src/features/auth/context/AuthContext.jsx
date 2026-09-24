
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, subscribeToUserData, logout as firebaseLogout } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserData = null;

        // Safety net: never let the app hang blank forever if the auth
        // listener fails to resolve (e.g. stuck IndexedDB persistence).
        const safetyTimer = setTimeout(() => {
            console.warn('[AuthContext] Auth state took too long to resolve, unblocking UI');
            setLoading(false);
        }, 8000);

        const unsubscribeAuth = onAuthChange((data) => {
            clearTimeout(safetyTimer);
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
            clearTimeout(safetyTimer);
            unsubscribeAuth();
            if (unsubscribeUserData) unsubscribeUserData();
        };
    }, []);

    const logout = async () => {
        await firebaseLogout();
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {children}
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
