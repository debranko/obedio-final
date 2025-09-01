# OBEDIO Mobile App

React Native mobilna aplikacija za OBEDIO sistem upravljanja posadom i uređajima.

## 🚀 Pokretanje

### Preduslovi
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go aplikacija na telefonu
- OBEDIO_SYSTEM server pokrenut na localhost:3000

### Instalacija
```bash
cd obedio-mobile-app
npm install
```

### Pokretanje Development Servera
```bash
npx expo start
```

### Testiranje na Android/iOS
1. Instaliraj Expo Go aplikaciju na telefon
2. Skeniraj QR kod iz terminala ili Expo Dev Tools
3. Aplikacija će se automatski učitati

## 🔧 Konfiguracija

### API Konfiguracija
Aplikacija se automatski povezuje na lokalni OBEDIO_SYSTEM server:
- **Development URL**: `http://10.90.0.66:3000/api`
- **Production URL**: Konfiguriše se u `src/constants/config.ts`

### Promena IP Adrese
Ako se vaša lokalna IP adresa promeni, ažurirajte `src/constants/config.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://VASA_IP_ADRESA:3000/api' : 'https://production-api.com/api',
  // ...
};
```

## 📱 Funkcionalnosti

### ✅ Implementirane Funkcionalnosti
- **Dashboard**: Sistemski status, KPI kartice, aktivni zahtevi
- **Requests**: Lista zahteva sa real-time ažuriranjem
- **Devices**: Upravljanje uređajima sa filterima i pretragom
- **Crew**: Upravljanje posadom sa shift informacijama
- **More**: Podešavanja, profil, logout

### 🔄 Real-time Funkcionalnosti
- Auto-refresh svakih 15-60 sekundi
- Pull-to-refresh na svim ekranima
- Error handling sa retry logikom

### 🎨 UI/UX
- Tab navigacija sa badge notifikacijama
- Responsive dizajn optimizovan za mobilne uređaje
- Dark/Light theme podrška
- Loading states i error handling

## 🏗️ Arhitektura

```
src/
├── components/          # Reusable komponente
├── constants/          # Konfiguracija i konstante
├── navigation/         # React Navigation setup
├── screens/           # Screen komponente
├── services/          # API servisi
├── types/            # TypeScript tipovi
└── utils/            # Helper funkcije
```

### API Servisi
- `authService`: Autentifikacija
- `requestsService`: Upravljanje zahtevima
- `devicesService`: Upravljanje uređajima
- `crewService`: Upravljanje posadom
- `systemService`: Sistemski status

## 🔧 Development

### Dodavanje Novih Funkcionalnosti
1. Kreiraj novi screen u `src/screens/`
2. Dodaj API pozive u odgovarajući servis
3. Ažuriraj navigation ako je potrebno
4. Dodaj TypeScript tipove u `src/types/`

### Testing
```bash
# Unit testovi (kada budu implementirani)
npm test

# E2E testovi (kada budu implementirani)
npm run test:e2e
```

## 📦 Build za Production

### Expo Build
```bash
# Android APK
npx expo build:android

# iOS IPA
npx expo build:ios
```

### Standalone App
```bash
# Kreiranje standalone build-a
npx expo eject
# Zatim koristiti React Native CLI
```

## 🔔 Push Notifikacije

Push notifikacije su konfigurisane preko Expo Notifications:
- Automatska registracija za notifikacije
- Handling incoming notifikacija
- Badge count za tab navigaciju

## 🐛 Troubleshooting

### Network Error
- Proverite da li je OBEDIO_SYSTEM server pokrenut
- Proverite IP adresu u `config.ts`
- Proverite da li su telefon i računar na istoj WiFi mreži

### Expo Go Problemi
- Restartujte Expo Go aplikaciju
- Očistite cache: `npx expo start -c`
- Proverite da li je Expo CLI najnovija verzija

### API Errors
- Proverite console logove u Expo Dev Tools
- Testirajte API endpoints direktno u browseru
- Proverite da li su svi potrebni servisi pokrenuti

## 📝 TODO

- [ ] Implementirati push notifikacije
- [ ] Dodati offline support
- [ ] Implementirati audio playback za zahteve
- [ ] Dodati biometric authentication
- [ ] Implementirati real-time WebSocket konekcije
- [ ] Dodati unit i integration testove

## 🤝 Contributing

1. Fork projekat
2. Kreiraj feature branch (`git checkout -b feature/nova-funkcionalnost`)
3. Commit promene (`git commit -am 'Dodaj novu funkcionalnost'`)
4. Push na branch (`git push origin feature/nova-funkcionalnost`)
5. Kreiraj Pull Request

## 📄 License

Ovaj projekat je deo OBEDIO sistema i podleže istim licencnim uslovima.