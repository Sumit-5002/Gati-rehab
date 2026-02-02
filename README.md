# Gati Rehab App - AI-Powered Virtual Rehabilitation Assistant

A Progressive Web Application (PWA) for remote physical therapy using AI-powered pose detection.

## 🎯 Project Overview

Gati is a functional prototype that uses smartphone cameras and MediaPipe AI to provide real-time feedback during rehabilitation exercises. The app works **offline** for core sessions and syncs data to the cloud when connectivity is available.

**Live Demo**: `https://YOUR_PROJECT_ID.web.app` (after deployment)

## 🚀 Tech Stack

- **Frontend**: React.js + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v3
- **AI Engine**: MediaPipe Pose Landmarker (33 keypoints, client-side)
- **Camera**: react-webcam
- **Charts**: Recharts
- **Backend/DB**: Firebase (Spark Plan - Free)
  - Authentication (Email/Password)
  - Firestore NoSQL Database
  - Cloud Storage
  - Firebase Hosting
- **Offline**: Service Workers + LocalStorage
- **Icons**: Lucide React
- **CI/CD**: GitHub Actions for auto-deployment

## 📁 Project Structure

```
gati-rehab-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── service-worker.js      # Offline functionality
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── AIEngine.jsx       # Core AI/Camera view
│   │   ├── NavHeader.jsx      # Navigation header
│   │   ├── PatientCard.jsx    # Patient info card
│   │   └── SessionReport.jsx  # Session summary
│   ├── pages/                 # Main application views
│   │   ├── LoginPage.jsx      # Authentication
│   │   ├── PatientDashboard.jsx    # Patient home
│   │   ├── WorkoutSession.jsx      # Exercise session with AI
│   │   ├── DoctorDashboard.jsx     # Doctor's patient list
│   │   └── PatientDetailView.jsx   # Patient progress charts
│   ├── utils/                 # Core logic utilities
│   │   ├── angleCalculations.js    # Pose angle calculations
│   │   ├── scoring.js              # Form quality scoring
│   │   ├── sync.js                 # Offline sync logic
│   │   └── localStorage.js         # Local storage handlers
│   ├── App.jsx                # Router setup
│   ├── firebase.js            # Firebase configuration
│   └── main.jsx               # App entry point
└── package.json
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Enable Cloud Storage
6. Enable Firebase Hosting
7. Copy your Firebase config from Project Settings

8. Create a `.env` file in the root directory:
   ```bash
   copy .env.example .env
   ```

9. Fill in your Firebase credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

10. Update `.firebaserc` with your Firebase project ID:
    ```json
    {
      "projects": {
        "default": "your_project_id"
      }
    }
    ```

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

### 6. Deploy to Firebase

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Firebase deployment instructions.

**Quick Deploy:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
npm run build
firebase deploy
```

## 👥 Team Responsibilities

| Member | Component | Status |
|--------|-----------|--------|
| Sumit Prasad | Firebase Config, Auth, AIEngine.jsx, Router | ✅ Initial Setup |
| Member 2 | angleCalculations.js (getAngle, calculateAngles) | ✅ Function Shell |
| Yash Singhal | scoring.js (form quality, ROM tracking) | ✅ Function Shell |
| Aaditya Mittal | LoginPage, PatientDashboard, PWA Manifest | ✅ UI Ready |
| Aaditya Pawar | DoctorDashboard, PatientDetailView, Recharts | ✅ UI Ready |
| Member 6 | service-worker.js, sync.js, offline features | ✅ PWA Shell |

## 🎮 Application Pages

### Public:
1. **Landing Page** (`/`) - Marketing/splash page with features

### For Patients:
1. **Login** (`/login`) - Authentication
2. **Dashboard** (`/patient-dashboard`) - Current routine, stats
3. **Workout Session** (`/workout`) - Camera + AI tracking

### For Doctors:
1. **Login** (`/login`) - Authentication  
2. **Patient List** (`/doctor-dashboard`) - All patients overview
3. **Patient Detail** (`/patient/:id`) - Progress charts & history

## 🌐 Firebase Deployment

This project is configured for automatic deployment to Firebase Hosting via GitHub Actions.

### Files Included:
- ✅ `firebase.json` - Firebase hosting configuration
- ✅ `.firebaserc` - Firebase project configuration
- ✅ `firestore.rules` - Database security rules
- ✅ `firestore.indexes.json` - Database indexes
- ✅ `storage.rules` - Storage security rules
- ✅ `.github/workflows/firebase-hosting.yml` - Auto-deployment workflow
- ✅ `.env.example` - Environment variables template

### Deployment Methods:

#### Method 1: Automatic (via GitHub Actions)
1. Push code to GitHub
2. Add Firebase secrets to GitHub repository
3. Every push to `main` triggers auto-deployment

#### Method 2: Manual (via CLI)
```bash
npm run build
firebase deploy
```

📖 **Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions

## 🔧 Next Steps

### Priority 1: AI Integration (Sumit + Member 2)
- [ ] Implement MediaPipe Pose model loading in AIEngine.jsx
- [ ] Complete the prediction loop with landmark detection
- [ ] Integrate angleCalculations.js with real keypoints
- [ ] Test pose detection with camera

### Priority 2: Scoring Logic (Member 3)
- [ ] Complete form quality assessment functions
- [ ] Add exercise-specific validation rules
- [ ] Implement rep counting logic
- [ ] Test scoring with mock angle data

### Priority 3: Firebase Integration (Sumit)
- [ ] Set up Firebase Authentication
- [ ] Create Firestore data structure
- [ ] Implement login/logout functionality
- [ ] Add user session management

### Priority 4: Offline Sync (Member 6)
- [ ] Test service worker caching
- [ ] Implement background sync
- [ ] Handle online/offline transitions
- [ ] Add sync status indicators

### Priority 5: Doctor Dashboard (Member 5)
- [ ] Connect to Firestore for patient data
- [ ] Implement real-time chart updates
- [ ] Add filtering and search functionality
- [ ] Export patient reports

## 📱 PWA Features

- ✅ Offline capability
- ✅ Install to home screen
- ✅ App-like experience
- ✅ Background sync
- ⏳ Push notifications (future)

## 🔒 Security Notes

- Never commit Firebase credentials to git
- Add `.env` file for sensitive data
- Use Firebase security rules
- Implement proper authentication

## 🔐 Demo Credentials

Use the following credentials to test the application:

### Doctor Account
**Email**: `doctor@demo.com`  
**Password**: `Demo123!`

### Patient Accounts
**Patient 1 (Post-Knee Surgery)**:
**Email**: `rajesh@demo.com`  
**Password**: `Demo123!`

**Patient 2 (Hip Replacement)**:
**Email**: `priya@demo.com`  
**Password**: `Demo123!`

### Features to Test
- **Doctor View**: View patient list, check progress charts, assign routines.
- **Patient View**: Start workout sessions, view daily streak, check compliance.
- **Offline Mode**: Try disconnecting the internet after initial load; the app will continue to function.

## 🐛 Known Issues

- [ ] MediaPipe model not yet loaded (TODO in AIEngine.jsx)
- [ ] Firebase authentication not connected
- [ ] Service worker needs testing
- [ ] Charts show mock data only

## 📚 Resources

- [MediaPipe Pose Documentation](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router v7](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)

## 📄 License

This project is part of a health hackathon prototype.

---

**Built with ❤️ for better rehabilitation outcomes**
