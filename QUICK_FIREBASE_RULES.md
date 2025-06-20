# Quick Firebase Rules Fix for Permission Errors

## Current Issue
Permission denied errors because Firebase rules are too restrictive for the current auth setup.

## Immediate Solution - Deploy These Rules:

### Firestore Rules (Firebase Console > Firestore Database > Rules):
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users for development
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow public read access for live users
    match /liveUsers/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules (Firebase Console > Storage > Rules):
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow all authenticated users for development
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Steps:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: dev1-b3973
3. Deploy Firestore rules (copy from above)
4. Deploy Storage rules (copy from above)
5. Test admin login again

This will fix the permission denied errors immediately.