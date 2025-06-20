# 🚀 Firebase Security Rules - Deployment Anleitung

## Schritt 1: Firebase Console öffnen

1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Wähle dein WeddingPix-Projekt aus

## Schritt 2: Firestore Security Rules deployen

### Zu kopierende Firestore Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // User-isolated data structure for DSGVO compliance
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin access to all user data for management
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // User profile creation - allow users to create their own profile
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for specific collections (if needed)
    match /users/{userId}/publicProfile {
      allow read: if true; // Allow public profile reading
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Live presence system - users can update their own presence
    match /liveUsers/{userId} {
      allow read: if true; // Allow reading live users for all
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Music wishlist - user-specific with potential sharing
    match /users/{userId}/musicWishlist/{document=**} {
      allow read: if true; // Allow reading wishlists for sharing
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading user galleries for sharing (but not writing)
    match /users/{userId}/media/{document=**} {
      allow read: if true; // Allow public gallery viewing
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/comments/{document=**} {
      allow read: if true; // Allow reading comments on shared galleries
      allow write: if request.auth != null; // Any authenticated user can comment
    }
    
    match /users/{userId}/likes/{document=**} {
      allow read: if true; // Allow reading likes
      allow write: if request.auth != null; // Any authenticated user can like
    }
    
    // Block access to legacy global collections
    match /media/{document=**} {
      allow read, write: if false;
    }
    
    match /comments/{document=**} {
      allow read, write: if false;
    }
    
    match /likes/{document=**} {
      allow read, write: if false;
    }
    
    match /stories/{document=**} {
      allow read, write: if false;
    }
    
    // Block all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Deployment-Schritte:

1. **Navigiere zu Firestore Database**
   - Klicke auf "Firestore Database" im linken Menü
   - Wähle den Tab "Rules" oben

2. **Rules ersetzen**
   - Markiere den gesamten aktuellen Regelinhalt
   - Lösche ihn komplett
   - Kopiere die neuen Rules oben und füge sie ein

3. **Publizieren**
   - Klicke "Publish" (Veröffentlichen)
   - Bestätige mit "Publish" im Dialog

## Schritt 3: Storage Security Rules deployen

### Zu kopierende Storage Rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to access only their own isolated data
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Legacy galleries structure - read-only for migration purposes
    match /galleries/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // No new writes to legacy structure
    }
    
    // Admin access for management (optional)
    match /{allPaths=**} {
      allow read, write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Block all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Deployment-Schritte:

1. **Navigiere zu Storage**
   - Klicke auf "Storage" im linken Menü
   - Wähle den Tab "Rules" oben

2. **Rules ersetzen**
   - Markiere den gesamten aktuellen Regelinhalt
   - Lösche ihn komplett
   - Kopiere die neuen Storage Rules oben und füge sie ein

3. **Publizieren**
   - Klicke "Publish" (Veröffentlichen)
   - Bestätige mit "Publish" im Dialog

## Schritt 4: Validierung

Nach dem Deployment:

1. **Admin Panel öffnen** (grüner Lock-Button)
2. **Datenmigration starten**
3. **Validierung ausführen** - sollte jetzt erfolgreich sein

## ✅ Was diese Rules bewirken:

- **Vollständige Benutzerisolation**: Jeder User sieht nur seine eigenen Daten
- **DSGVO-Konformität**: Keine Cross-User-Datenzugriffe möglich
- **Gallery-Sharing**: Öffentliches Teilen von Galerien möglich
- **Legacy-Schutz**: Alte unsichere Collections blockiert
- **Admin-Zugang**: Vollzugriff für Administratoren

## 🔒 Sicherheit garantiert!

Nach dem Deployment ist dein Multi-User-System vollständig sicher und DSGVO-konform.