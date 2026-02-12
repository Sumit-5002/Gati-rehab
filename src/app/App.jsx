import { useRef, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import PWAInstallPrompt from '../shared/components/PWAInstallPrompt';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { useSessionTimeout } from '../shared/hooks/useSessionTimeout';

function SessionManager({ children }) {
  useSessionTimeout();

  // Watch for day rollover (Midnight Reset)
  const lastDate = useRef(new Date().toDateString());
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== lastDate.current) {
        console.log('[System] Day rollover detected (Midnight). Refreshing state...');
        lastDate.current = today;
        window.location.reload(); // Hard reset for simplicity and reliability
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <SessionManager>
              <AppRoutes />
              <PWAInstallPrompt />
            </SessionManager>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
