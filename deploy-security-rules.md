# Firebase Security Rules Deployment

## KRITISCH: Manuelle Bereitstellung erforderlich

Die Sicherheitsregeln sind bereits konfiguriert, müssen aber manuell über die Firebase Console bereitgestellt werden.

### Schritte zur Bereitstellung:

1. **Firebase Console öffnen:**
   - Gehe zu https://console.firebase.google.com/
   - Wähle dein Projekt: `dev1-b3973`

2. **Firestore Security Rules:**
   - Navigiere zu "Firestore Database" → "Rules"
   - Kopiere den Inhalt aus `firestore.rules`
   - Klicke "Veröffentlichen"

3. **Storage Security Rules:**
   - Navigiere zu "Storage" → "Rules"  
   - Kopiere den Inhalt aus `storage.rules`
   - Klicke "Veröffentlichen"

### Konfigurierte Sicherheitsregeln:

#### Firestore Rules (firestore.rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer können nur ihre eigenen Daten verwalten
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
    }
    
    // Globale Collections mit userId-Filterung
    match /media/{mediaId} {
      allow read, write: if request.auth != null && 
                        resource.data.userId == request.auth.uid;
    }
    
    // Standard: Alles andere verweigern
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Storage Rules (storage.rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Benutzer können nur ihre eigenen Dateien verwalten
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
    }
    
    // Legacy galleries/ Pfad für Migration
    match /galleries/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
    }
    
    // Standard: Alles andere verweigern
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Nach der Bereitstellung:

- ✅ Vollständige Datenisolation zwischen Benutzern
- ✅ DSGVO-konforme Mandantentrennung  
- ✅ Schutz vor Cross-User Data Access
- ✅ Sicherheit vor manipulierten Clients

### Validierung:

Nach der Bereitstellung kannst du die Sicherheit testen:
1. Als Benutzer A anmelden und Medien hochladen
2. Als Benutzer B anmelden - Benutzer A's Medien sollten NICHT sichtbar sein
3. Entwicklertools öffnen und versuchen auf fremde Daten zuzugreifen - sollte fehlschlagen

**WICHTIG:** Ohne diese Regeln können alle authentifizierten Benutzer auf alle Daten zugreifen!