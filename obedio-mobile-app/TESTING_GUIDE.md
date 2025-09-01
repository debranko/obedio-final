# OBEDIO Mobile App - Testing Guide

## 🚀 Quick Start

### 1. Pokretanje OBEDIO_SYSTEM Servera
```bash
cd OBEDIO_SYSTEM
npm run dev
```
Server će se pokrenuti na `http://localhost:3000`

### 2. Pokretanje Mobile App
```bash
cd obedio-mobile-app
npx expo start
```

### 3. Testiranje na Android Telefonu
1. Instaliraj **Expo Go** aplikaciju iz Google Play Store
2. Skeniraj QR kod iz terminala ili Expo Dev Tools
3. Aplikacija će se učitati na telefonu

## 🔧 Rešavanje Network Error-a

### Problem: "Network error - please check your connection"

**Uzrok**: Aplikacija ne može da se poveže na OBEDIO_SYSTEM server

**Rešenje**:

1. **Proverite da li server radi**:
   ```bash
   curl http://10.90.0.66:3000/api/system/status
   ```

2. **Ako server ne radi, pokrenite ga**:
   ```bash
   cd OBEDIO_SYSTEM
   npm run dev
   ```

3. **Proverite IP adresu**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   Ako je IP adresa drugačija od `10.90.0.66`, ažurirajte:
   `obedio-mobile-app/src/constants/config.ts`

4. **Proverite WiFi konekciju**:
   - Telefon i računar moraju biti na istoj WiFi mreži
   - Restartujte WiFi na telefonu ako je potrebno

## 📱 Testiranje Funkcionalnosti

### Dashboard Screen
- ✅ Prikazuje sistemski status
- ✅ KPI kartice sa brojevima
- ✅ Alerts za low battery uređaje
- ✅ Pull-to-refresh funkcionalnost
- ✅ Auto-refresh svakih 30 sekundi

### Requests Screen
- ✅ Lista svih zahteva
- ✅ Status badges (PENDING, IN_PROGRESS, COMPLETED)
- ✅ Tap na zahtev za detalje
- ✅ Mark as complete funkcionalnost
- ✅ Pull-to-refresh
- ✅ Auto-refresh svakih 15 sekundi

### Devices Screen
- ✅ Lista svih uređaja
- ✅ Search funkcionalnost
- ✅ Battery i signal indikatori
- ✅ Status indicators (online/offline)
- ✅ Tap na uređaj za detalje
- ✅ Ping device funkcionalnost

### Crew Screen
- ✅ Lista crew members
- ✅ Search funkcionalnost
- ✅ Status badges (On Duty, Off Duty, On Leave)
- ✅ Shift informacije
- ✅ Active requests count
- ✅ Avatar placeholders

### More Screen
- ✅ User profile informacije
- ✅ App settings (notifications, dark mode)
- ✅ Test connection funkcionalnost
- ✅ About informacije
- ✅ Logout funkcionalnost

## 🔔 Push Notifications

### Testiranje Notifikacija
1. Aplikacija će automatski zatražiti dozvolu za notifikacije
2. Prihvatite dozvolu kada se pojavi popup
3. Push token će biti logovan u console
4. Notifikacije će se prikazivati kada:
   - Novi zahtev stigne
   - Zahtev bude dodeljen
   - Uređaj ima low battery
   - Sistemski alert

## 🐛 Česti Problemi

### 1. "API Error: undefined undefined"
**Uzrok**: Server nije pokrenut ili nije dostupan
**Rešenje**: Pokrenite OBEDIO_SYSTEM server

### 2. Aplikacija se ne učitava u Expo Go
**Uzrok**: QR kod nije valjan ili network problem
**Rešenje**: 
- Restartujte Expo development server
- Proverite WiFi konekciju
- Očistite cache: `npx expo start -c`

### 3. TypeScript greške
**Uzrok**: Nedostaju dependencies
**Rešenje**: 
```bash
cd obedio-mobile-app
npm install
```

### 4. Notifikacije ne rade
**Uzrok**: Dozvole nisu date ili device nije fizički
**Rešenje**: 
- Proverite da li ste dali dozvolu
- Testirajte na fizičkom uređaju (ne simulator)

## 📊 Performance Testing

### Testiranje Load Time-a
- Dashboard treba da se učita za < 3 sekunde
- API pozivi trebaju da se završe za < 5 sekundi
- Pull-to-refresh treba da bude responsivan

### Testiranje Memory Usage
- Aplikacija ne treba da koristi > 100MB RAM-a
- Nema memory leak-ova pri navigaciji

### Testiranje Battery Usage
- Aplikacija ne treba da troši > 5% baterije po satu
- Background refresh treba da bude optimizovan

## 🔍 Debug Informacije

### Console Logs
Otvorite Expo Dev Tools da vidite console logove:
```bash
npx expo start --dev-client
```

### Network Monitoring
Sve API pozive možete pratiti u console-u:
- Request URL-ovi
- Response status kodovi
- Error poruke

### State Debugging
React Query dev tools su uključeni u development mode-u.

## ✅ Test Checklist

### Pre Release Testing
- [ ] Svi screen-ovi se učitavaju bez grešaka
- [ ] API pozivi rade ispravno
- [ ] Navigation funkcioniše između tab-ova
- [ ] Pull-to-refresh radi na svim screen-ovima
- [ ] Search funkcionalnost radi
- [ ] Notifikacije se prikazuju
- [ ] Error handling prikazuje korisne poruke
- [ ] Loading states su implementirani
- [ ] Aplikacija radi na različitim veličinama ekrana

### Performance Testing
- [ ] Aplikacija se učitava za < 5 sekundi
- [ ] Smooth scrolling kroz liste
- [ ] Nema lag-a pri navigaciji
- [ ] Memory usage je stabilan

### User Experience Testing
- [ ] Intuitivna navigacija
- [ ] Jasne error poruke
- [ ] Consistent design kroz aplikaciju
- [ ] Accessibility features rade

## 📞 Support

Za tehničku podršku ili pitanja:
1. Proverite ovaj guide
2. Proverite console logove
3. Proverite da li je server pokrenut
4. Kontaktirajte development tim