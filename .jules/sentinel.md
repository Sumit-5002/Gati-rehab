## 2025-05-14 - [Insecure Direct Object Reference in Firebase Rules]
**Vulnerability:** Overly permissive Firestore and Storage rules allowed any authenticated user to read or modify any other user's data (profiles, routines, session recordings).
**Learning:** Broken access control is common in Firebase apps that rely on `isAuthenticated()` without proper ownership or relationship checks.
**Prevention:** Implement `isOwner(userId)` and relationship-based helpers like `isDoctorOf(patientId)` using `exists()` in Firestore rules and `firestore.exists()` in Storage rules.

## 2025-05-15 - [Impersonation Prevention and Audit Trail Integrity]
**Vulnerability:** Firestore rules allowed any authenticated user to create documents (sessions, messages, audit logs) with arbitrary UIDs, facilitating impersonation. Audit logs also attributed actions to subjects rather than actors.
**Learning:** Enforcing field-level equality with `request.auth.uid` during creation is essential to prevent spoofing in multi-user systems.
**Prevention:** Use `request.resource.data.userId == request.auth.uid` in rules and ensure service logic uses the current authenticated UID as the actor for sensitive operations.
