
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';

/**
 * Hook to handle session inactivity timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default 30 minutes)
 */
export const useSessionTimeout = (timeoutMs = 30 * 60 * 1000) => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log('[SessionTimeout] Inactivity detected. Logging out...');
        logout();
      }, timeoutMs);
    }
  }, [user, logout, timeoutMs]);

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleEvent = () => resetTimer();

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [user, resetTimer]);
};
