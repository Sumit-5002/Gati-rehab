
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    getDocs,
    limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

/**
 * Send a notification to a user
 */
export const sendNotification = async (recipientId, data) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            recipientId,
            ...data,
            read: false,
            timestamp: serverTimestamp()
        });

        // Also attempt a push notification if permissions are granted
        if (Notification.permission === 'granted') {
            showPushNotification(data.title || 'Gati Rehab', data.message);
        }
    } catch (error) {
        console.error('[NotificationService] Send error:', error);
    }
};

/**
 * Request permission for browser/native push notifications
 */
export const requestPushPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

/**
 * Show a browser level push notification
 */
export const showPushNotification = (title, body, icon = '/logo.png') => {
    if (Notification.permission === 'granted') {
        // Use Service Worker if available for better PWA support
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: icon,
                    badge: icon,
                    vibrate: [200, 100, 200],
                    tag: 'gati-rehab-alert'
                });
            });
        } else {
            new Notification(title, { body, icon });
        }
    }
};

/**
 * Subscribe to notifications for a user
 */
export const subscribeToNotifications = (recipientId, callback) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef,
        where('recipientId', '==', recipientId),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            time: formatTime(doc.data().timestamp)
        }));

        notifications.sort((a, b) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
            return tB - tA;
        });

        callback(notifications);
    }, (error) => {
        console.error('[NotificationService] Subscribe error:', error);
    });
};

export const markAsRead = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error('[NotificationService] Mark as read error:', error);
    }
};

export const markAllAsRead = async (recipientId) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('recipientId', '==', recipientId),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);

        const promises = snapshot.docs.map(d =>
            updateDoc(doc(db, 'notifications', d.id), { read: true })
        );

        await Promise.all(promises);
    } catch (error) {
        console.error('[NotificationService] Mark all as read error:', error);
    }
};

const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
};
