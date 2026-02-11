# Gati-Rehab Detailed Project Structure

This document provides a comprehensive, file-by-file breakdown of the Gati-Rehab project. It is intended for developers who need to navigate the codebase efficiently.

## 📂 Root Directory
Configuration and environment setup.

| File | Purpose |
|---|---|
| `.env` | Environment variables (FIREBASE_API_KEY, etc.) |
| `.firebaserc` | Firebase project aliases |
| `.gitignore` | Files to exclude from Git |
| `firebase.json` | Hosting and Firestore configuration |
| `firestore.rules` | Security rules for database access |
| `index.html` | Application entry point (HTML) |
| `package.json` | Dependencies and scripts |
| `postcss.config.js` | CSS processing configuration |
| `tailwind.config.js` | Design system configuration |
| `vite.config.js` | Build tool options |

---

## 📂 Source Directory (`src/`)

### 1. Application Core (`src/app/`)
The heart of the React application.
- **`App.jsx`**: Root component. Wraps the app in Context Providers (Auth, Theme, Route).
- **`routes/`**: Centralized routing definition.
  - **`index.jsx`**: Defines all application routes (public, protected, role-based).

### 2. Global Contexts (`src/contexts/`)
State available throughout the entire application.
- **`ThemeContext.jsx`**: Manages Dark/Light mode preferences.

### 3. Feature Modules (`src/features/`)
Business logic is organized by domain (Authentication, Patient, Doctor, Admin, AI).

#### 🔐 Authentication (`features/auth/`)
- **`context/`**:
  - `AuthContext.jsx`: Manages user login state and session persistence.
- **`pages/`**:
  - `LandingPage.jsx`: The public-facing marketing page.
  - `LoginPage.jsx`: Unified login/signup for patients, doctors, and admins.

#### 👤 Patient Domain (`features/patient/`)
- **`pages/`**:
  - `PatientDashboard.jsx`: Main patient hub. Shows daily tasks, streaks, and navigation.
  - `WorkoutSession.jsx`: The core AI exercise interface. Uses webcam and MediaPipe.
  - `ProfilePage.jsx`: User settings and personal details.
  - `ProgressPhotos.jsx`: Visual tracking of recovery.
  - `Trends.jsx`: Detailed progress charts for the patient.
  - `MessagesPage.jsx`: Communication center.
  - `Reports.jsx`: Summary reports for the patient.
  - `PhysioLink.jsx`: Connection interface with assigned doctor.
  - `ExerciseHistory.jsx`: Log of past sessions.
- **`components/`**:
  - `ExerciseDemo.jsx`: Video/Animation showing how to perform an exercise.
  - `SessionReport.jsx`: Summary card displayed after a workout.
- **`engine/`**:
  - `AI_Engine.js`: The "brain" of the app. Handles pose detection, repetition counting, and form scoring.

#### 🩺 Doctor Domain (`features/doctor/`)
- **`pages/`**:
  - `DoctorDashboard.jsx`: Command center for clinicians.
  - `PatientDetailView.jsx`: In-depth analysis view for a specific patient.
- **`components/`**:
  - **`charts/`**: Visualization components using Recharts.
    - `AdherenceTrendChart.jsx`
    - `PatientROMProgressChart.jsx`
    - `PatientQualityTrendChart.jsx`
    - `ROMTrendChart.jsx`
    - `FormQualityChart.jsx`
  - **`modals/`**: Complex interactions.
    - `ManagePlanModal.jsx`: Assign exercises to patients.
    - `AddPatientModal.jsx`: Invite new patients.
    - `NeuralChatModal.jsx`: AI assistant interface.
    - `ReportsModal.jsx`: Generate clinical reports.
    - `SchedulerModal.jsx`: Manage appointments.
    - `SettingsModal.jsx`: Doctor profile settings.
- **`services/`**:
  - `doctorService.js`: Firestore operations tailored for doctor permissions (e.g., viewing all patients).

#### 🛡 Admin Domain (`features/admin/`)
- **`pages/`**:
  - `AdminDashboard.jsx`: Platform oversight and user management.
- **`components/modals/`**:
  - `CreateUserModal.jsx`: Admin tool to manually create accounts.

#### 🤖 AI & Logic (`features/ai/`)
- **`utils/`**:
  - `angleCalculations.js`: Math functions to calculate joint angles from coordinates.
  - `realTimeFeedback.js`: Logic to generate spoken/text feedback based on angles.
  - `secondaryExercises.js`: Database of supported exercises and their configuration.

#### 💬 Chat (`features/chat/`)
- **`services/`**:
  - `chatService.js`: Backend logic for real-time messaging.

#### 🔗 Shared Feature Components (`features/shared/`)
- **`components/`**:
  - `ChatWindow.jsx`: A reusable chat UI component used by both doctors and patients.

---

### 4. Shared Utilities (`src/shared/`)
Reusable code used across multiple features.

- **`components/`**:
  - `NavHeader.jsx`: The main navigation bar. Handles role-based links and theme toggling.
  - `Footer.jsx`: Application footer.
  - `ErrorBoundary.jsx`: Catches app crashes and displays a fallback UI.
  - `ProtectedRoute.jsx`: Security wrapper. Redirects unauthenticated users.
  - `PWAInstallPrompt.jsx`: "Install App" button for mobile users.
  - `NotificationBell.jsx`: Notification center in the header.
- **`hooks/`**:
  - `useSessionTimeout.js`: Security hook to auto-logout inactive users.
  - `useEscapeKey.js`: Accessibility hook for closing modals with 'Esc'.
- **`services/`**:
  - `notificationService.js`: Logic for push notifications.
  - `geminiService.js`: Integration with Google's Gemini AI API.
- **`utils/`**:
  - `auditLogger.js`: Security logging for critical actions.
  - `csvExport.js`: Helper function to download data tables as CSV.

### 5. Configuration (`src/lib/`)
- **`firebase/config.js`**: Initializes the Firebase app and exports auth, db, and storage instances.
