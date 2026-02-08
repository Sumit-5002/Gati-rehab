
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

/**
 * Send a message
 */
export const sendMessage = async (chatId, senderId, text, senderName) => {
  try {
    await addDoc(collection(db, 'messages'), {
      chatId,
      senderId,
      senderName,
      text,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[ChatService] Error sending message:', error);
    throw error;
  }
};

/**
 * Subscribe to messages in a chat
 */
export const subscribeToMessages = (chatId, callback) => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

/**
 * Generate a consistent chatId between two users
 */
export const getChatId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};
