# Obedio Admin Web App - MVP Tasks

## Faza A: Temelji

### A-1: Init repo + alatke ✅
- [x] Inicijalizacija PNPM monorepo strukture
- [x] Podešavanje TypeScript 5 konfiguracije
- [x] Dodavanje ESLint + Prettier za linting i formatiranje
- [x] Instalacija i konfiguracija Tailwind CSS
- [x] Instalacija i podešavanje shadcn/ui komponenti
- [x] Kreiranje osnovne Next.js 14 aplikacije sa App Router-om

### A-2: Prisma + SQLite ✅
- [x] Konfiguracija Prisma ORM-a
- [x] Kreiranje schema.prisma sa osnovnim modelima (User, Device)
- [x] Definisanje relacija između modela
- [x] Kreiranje inicijalne migracije
- [x] Podešavanje Prisma klijenta kao singleton-a (lib/prisma.ts)

### A-3: Seed-skripta ✅
- [x] Kreiranje skripte za seed podatke
- [x] Dodavanje dummy administratorskog korisnika
- [x] Dodavanje dummy uređaja za testiranje
- [x] Omogućavanje lakog pokretanja seed skripte pri razvoju

### A-4: Global layout ✅
- [x] Kreiranje app/layout.tsx
- [x] Implementacija <SidebarNav> komponente sa linkovima
- [x] Implementacija <TopBanner> komponente
- [x] Podešavanje osnovnog UI skeleta
- [x] Implementacija ThemeProvider-a za dark/light mode

### A-5: Auth sistem ✅
- [x] Implementacija /api/auth/login API rute
- [x] Dodavanje JWT cookie autentifikacije
- [x] Kreiranje <LoginForm> komponente
- [x] Implementacija autentifikacionih middleware-a
- [x] Dodavanje redirect logike za neautentifikovane korisnike

### A-6: SSE infrastruktura 
- [x] Kreiranje lib/sseEmitter.ts za real-time događaje
- [x] Implementacija /api/events/stream endpoint-a
- [x] Razvoj useEventSource React hook-a
- [x] Testiranje osnovne SSE funkcionalnosti

### A-7: MQTT Bridge skeleton 
- [x] Kreiranje scripts/mqttBridge.ts
- [x] Podešavanje MQTT klijenta i povezivanje na broker
- [x] Dodavanje osnovne logike za logovanje poruka
- [x] Povezivanje MQTT bridge-a sa SSE emitter-om

### A-8: CI pipeline 
- [x] Podešavanje GitHub Action workflow-a
- [x] Dodavanje lint → type-check → build koraka
- [x] Testiranje CI pipeline-a

## Faza B: Dodavanje stranica

### B-1: Devices API ✅
- [x] Proširivanje Prisma Device modela (battery, signal)
- [x] Implementacija GET /api/devices endpointa
- [x] Implementacija PATCH /api/devices/:id endpointa
- [x] Dodavanje još 3 uređaja u seed skriptu
- [x] Testiranje Devices API-ja

### B-2: Stranica /devices 
- [x] Kreiranje <DeviceTable> Server Component-e
- [x] Implementacija paginacije i filtriranja
- [x] Stilizovanje tabele korišćenjem shadcn/ui
- [x] Dodavanje device stats panela i sortiranja uređaja
- [x] Stilizovanje tabele korišćenjem shadcn/ui komponenti

### B-3: MQTT → upsert Device 
- [x] Implementacija obrade /battery MQTT poruke
- [x] Implementacija obrade /signal MQTT poruke
- [x] Dodavanje auto-discovery for new devices
- [x] Testiranje Device MQTT → SSE pipeline-a na /devices stranici

### B-4: Requests modeli + API
- [x] Proširivanje Prisma modela (Request, Shift)
- [x] Implementacija GET /api/requests/active endpoint-a
- [x] Implementacija POST /api/requests/:id/accept endpoint-a
- [x] Testiranje Requests API-ja

### B-5: Stranica /requests/active
- [x] Kreiranje <RequestCard> komponente
- [x] Implementacija liste aktivnih zahteva
- [x] Dodavanje Accept akcije
- [x] Stilizovanje kartica zahteva korišćenjem shadcn/ui

### B-6: MQTT → create Request
- [x] Implementacija obrade /press MQTT poruke
- [x] Kreiranje novog Request zapisa u bazi
- [x] Emitovanje new_request događaja preko SSE
- [x] Testiranje real-time pristizanja zahteva na stranicu

### B-7: System status agregat
- [x] Implementacija /api/system/status endpoint-a
- [x] Dodavanje statistike za uređaje (online, offline, battery low)
- [x] Dodavanje statistike za zahteve (active, completed, by day)
- [x] SSE integracija za real-time ažuriranje dashboarda
- [x] Kreiranje <SystemStatusPanel> komponente
- [x] Implementacija <ActiveRequestsMiniList> komponente
- [x] Povezivanje sa status API-jem
- [x] Dodavanje SSE ažuriranja za real-time status

### B-8: Stranica /dashboard
- [x] Kreiranje <SystemStatusPanel> komponente
- [x] Implementacija <ActiveRequestsMiniList> komponente
- [x] Povezivanje sa status API-jem
- [x] Dodavanje SSE ažuriranja za real-time status

### B-9: Shift logika + transfer API
- [x] Implementacija POST /api/requests/:id/transfer endpoint-a
- [x] Kreiranje DutyService helper klase
- [x] Implementacija getNextOnDuty() funkcije
- [x] Testiranje Transfer API-ja

### B-10: Stranica /duty
- [x] Kreiranje komponente za pregled smena
- [x] Implementacija "End shift now" dugmeta
- [x] Povezivanje sa transfer API-jem
- [x] Testiranje funkcionalnosti smena

## Faza C: Finš & testovi

### C-1: Playwright e2e
- [x] Kreiranje Playwright e2e testa
- [x] Testiranje "login → open /devices → vidi battery update" scenarija
- [x] Osiguravanje pouzdanosti testova

### C-2: Vitest unit
- [x] Dodavanje Vitest konfiguracije
- [x] Implementacija unit testova za auth util
- [x] Implementacija unit testova za device service
- [x] Pokretanje i verifikacija testova

### C-3: WCAG check & Tailwind brand colors
- [x] Provera i osiguravanje WCAG pristupačnosti
- [x] Konfiguracija Tailwind brand boja
- [x] Testiranje kontrastnih odnosa 
- [x] Verifikacija pristupačnosti

### C-4: README update
- [x] Ažuriranje README.md sa setup koracima
- [x] Dodavanje instrukcija za seed podatke
- [x] Dokumentovanje MQTT simulacije
- [x] Finalizacija dokumentacije

## Provisioning Tasks (nakon Faze A)

### P-1: Provisioning Models
- [x] Kreiranje Prisma modela ProvisionToken i ProvisionLog
- [x] Rešeno korišćenjem String tipova umesto enumeracija (zbog SQLite ograničenja)
- [x] Kreiranje migracije za nove modele
- [x] Testiranje rada sa modelima

### P-2: Provision Request API
- [x] Implementacija POST /api/provision/request server action-a
- [x] Dodavanje Zod schema validacije
- [x] Testiranje kreiranja tokena za provision
- [x] Verifikacija vraćanja ispravnog QR payload-a

### P-3: UI "Add Device" modal
- [x] Kreiranje modala za dodavanje uređaja
- [x] Implementacija izbora sobe (Room select)
- [x] Dodavanje generisanja QR koda
- [x] Stilizovanje modala korišćenjem shadcn/ui

### P-4: MQTT Bridge - Provisioning
- [x] Proširivanje scripts/mqttBridge.ts za obradu obedio/provision/request
- [x] Implementacija logike za validaciju tokena
- [x] Dodavanje logike za kreiranje uređaja
- [x] Slanje odgovora nazad na MQTT topic

### P-5: SSE device_added event
- [x] Dodavanje device_added događaja u SSE emitter (kroz ProvisionHandler)
- [x] Implementacija frontend ažuriranja
- [x] Testiranje automatskog ažuriranja UI-ja
- [x] Verifikacija kompletnog toka dodavanja uređaja

### P-6: Token Management
- [x] Implementacija soft-delete tokena API-ja
- [x] Dodavanje UI "Cancel" dugmeta na modal
- [x] Povezivanje UI-ja sa API-jem za poništenje tokena
- [x] Testiranje upravljanja tokenima

### P-7: BLE fallback (opciono MVP+)
- [ ] Implementacija BLE fallback servisa
- [ ] Dodavanje UI podrške za BLE provisioniranje
- [ ] Testiranje BLE fallback scenarija
- [ ] Verifikacija kompletnog BLE toka

### P-8: Provisioning Tests
- [x] Kreiranje Playwright testa za "happy provisioning path"
- [x] Implementacija mock MQTT funkcionalnosti za testiranje
- [x] Testiranje kompletnog provisioning toka
- [ ] Verifikacija robusnosti provisioning procesa