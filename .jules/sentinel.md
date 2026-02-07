## 2025-05-14 - [Insecure Direct Object Reference in Firebase Rules]
**Vulnerability:** Overly permissive Firestore and Storage rules allowed any authenticated user to read or modify any other user's data (profiles, routines, session recordings).
**Learning:** Broken access control is common in Firebase apps that rely on `isAuthenticated()` without proper ownership or relationship checks.
**Prevention:** Implement `isOwner(userId)` and relationship-based helpers like `isDoctorOf(patientId)` using `exists()` in Firestore rules and `firestore.exists()` in Storage rules.
