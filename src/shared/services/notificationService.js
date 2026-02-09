
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
 * @param {string} recipientId - UID of the recipient
 * @param {Object} data - Notification content { title, message, type, patientId?, actionUrl? }
 */
export const sendNotification = async (recipientId, data) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            recipientId,
            ...data,
            read: false,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('[NotificationService] Send error:', error);
    }
};

/**
 * Subscribe to notifications for a user
 * @param {string} recipientId - UID of the recipient
 * @param {function} callback - Callback with notifications list
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

        // Client-side sort by timestamp desc
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

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error('[NotificationService] Mark as read error:', error);
    }
};

/**
 * Mark all notifications as read
 */
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
