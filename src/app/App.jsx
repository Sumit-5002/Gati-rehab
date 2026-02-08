
// App.jsx - Main application entry point
// Clean routing with centralized route configuration

import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from '../features/auth/context/AuthContext';
import PWAInstallPrompt from '../shared/components/PWAInstallPrompt';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { useSessionTimeout } from '../shared/hooks/useSessionTimeout';

function SessionManager({ children }) {
  useSessionTimeout();
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <SessionManager>
            <AppRoutes />
            <PWAInstallPrompt />
          </SessionManager>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
