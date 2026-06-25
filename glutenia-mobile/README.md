# Glutenia Mobile

Expo React Native mobile app for the Glutenia gluten-free store.

## Run

Start the backend first:

```powershell
cd C:\Users\yassi\OneDrive\Desktop\glutenia\glutenia-backend
.\run.ps1 -Seed
.\run.ps1 -Start
```

Then start the mobile app:

```powershell
cd C:\Users\yassi\OneDrive\Desktop\glutenia\glutenia-mobile
.\run.ps1 -Start
```

Use Expo Go to scan the QR code, or press `a` for Android emulator.

If you use a physical phone, the app automatically tries to use the Expo host IP for the backend. You can override it:

```powershell
.\run.ps1 -Start -ApiUrl "http://YOUR-LAN-IP:5000/api"
```

Seed admin:

```text
admin@glutenia.tn / admin123
```

## Build APK

The APK uses the API URL configured in `app.json` under `extra.apiBaseUrl`.

```powershell
npm run build:apk
```

The final installable file is written to `Glutenia.apk`.
