## 2025-05-14 - [Insecure Direct Object Reference in Firebase Rules]
**Vulnerability:** Overly permissive Firestore and Storage rules allowed any authenticated user to read or modify any other user's data (profiles, routines, session recordings).
**Learning:** Broken access control is common in Firebase apps that rely on `isAuthenticated()` without proper ownership or relationship checks.
**Prevention:** Implement `isOwner(userId)` and relationship-based helpers like `isDoctorOf(patientId)` using `exists()` in Firestore rules and `firestore.exists()` in Storage rules.

## 2025-05-15 - [Impersonation Prevention and Audit Trail Integrity]
**Vulnerability:** Firestore rules allowed any authenticated user to create documents (sessions, messages, audit logs) with arbitrary UIDs, facilitating impersonation. Audit logs also attributed actions to subjects rather than actors.
**Learning:** Enforcing field-level equality with `request.auth.uid` during creation is essential to prevent spoofing in multi-user systems.
**Prevention:** Use `request.resource.data.userId == request.auth.uid` in rules and ensure service logic uses the current authenticated UID as the actor for sensitive operations.

## 2026-02-10 - [Privilege Escalation and Notification Spam in Firestore Rules]
**Vulnerability:** Permissive update rules on the 'users' collection allowed users to change their own 'userType' or 'role'. Additionally, any authenticated user could create notifications for any other user.
**Learning:** Checking for 'isOwner' is not enough for the 'users' collection; we must also ensure that sensitive identity fields are not modified during self-updates using 'request.resource.data.field == resource.data.field'.
**Prevention:** Implement a 'isNotChangingType()' helper and apply it to 'users' updates. Restrict 'notifications' creation to valid doctor-patient-admin relationships.
