# Obedio Admin Web App

Obedio Admin Web App je sistem za upravljanje IoT pametnim dugmadima, zaduženjima posade i zahtevima za usluge na jahtama i vilama. Ovaj sistem omogućava administratorima i posadi da efikasno upravljaju i odgovaraju na zahteve gostiju.

![Obedio Admin Dashboard](https://via.placeholder.com/1200x600?text=Obedio+Admin+Dashboard)

## Funkcionalnosti

- 👥 **Upravljanje korisnicima i smenama** - praćenje posade i njihovih zaduženja
- 📱 **Pregled uređaja** - status svih IoT uređaja na lokaciji
- 🔔 **Praćenje zahteva u realnom vremenu** - MQTT integracija za instant notifikacije
- 📊 **Analitika korišćenja** - statistika korišćenja i najaktivnijih uređaja
- 🔄 **SSE ažuriranja** - real-time status svih komponenti sistema
- 🔐 **Role-based pristup** - različiti nivoi pristupa za admina i posadu

## Tehnologije

- Next.js 14 (App Router)
- Prisma ORM
- PostgreSQL
- TypeScript
- Tailwind CSS
- MQTT
- Server-Sent Events (SSE)

## Instalacija i pokretanje

### Preduslovi

- Node.js 18+
- PostgreSQL
- MQTT broker (npr. Mosquitto, HiveMQ ili CloudMQTT)

### Koraci za instalaciju

1. **Kloniranje repozitorijuma**

```bash
git clone https://github.com/vasa-organization/obedio-admin.git
cd obedio-admin
```

2. **Instalacija zavisnosti**

```bash
npm install
```

3. **Podešavanje okruženja**

Napravite `.env` fajl u root direktorijumu sa sledećim varijablama:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/obedio?schema=public"

# MQTT
MQTT_URL="mqtt://localhost:1883"
MQTT_USERNAME="your_mqtt_username"
MQTT_PASSWORD="your_mqtt_password"
MQTT_CLIENT_ID="obedio-admin-server"

# App
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Migracija baze podataka**

```bash
npx prisma migrate dev
```

5. **Seed početnih podataka**

```bash
npm run seed
```

6. **Pokretanje aplikacije**

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`.

## Seed podaci

Sistem koristi seed skriptu za inicijalizaciju baze podataka sa testnim podacima. Seed skripta se nalazi u `prisma/seed.ts` i dodaje:

- **Korisnike**: admin i članove posade
- **Uređaje**: dugmad u raznim sobama/lokacijama
- **Zahteve**: primere prethodnih zahteva

### Default kredencijali

- **Admin**: admin@example.com / password123
- **Član posade**: crew@example.com / password123

### Prilagođavanje seed podataka

Možete prilagoditi seed podatke modifikovanjem `prisma/seed.ts` fajla prema vašim potrebama:

```typescript
// Dodavanje više korisnika
const customUser = await prisma.user.create({
  data: {
    email: "custom@example.com",
    name: "Custom User",
    role: "CREW",
    passwordHash: await hash("yourpassword", 10)
  }
})
```

## MQTT simulacija

Obedio Admin koristi MQTT protokol za komunikaciju sa IoT uređajima. Za testiranje bez fizičkih uređaja, uključena je MQTT simulacija.

### Pokretanje MQTT Bridge-a

MQTT Bridge je komponenta koja osluškuje događaje sa uređaja i prosleđuje ih aplikaciji:

```bash
npm run dev:mqtt
```

### Simulacija događaja dugmeta

Možete simulirati pritisak dugmeta slanjem MQTT poruke na odgovarajuću temu:

```bash
# Primer korišćenja mosquitto_pub za slanje test poruke
mosquitto_pub -h localhost -p 1883 -t "obedio/button/1/press" -m '{"deviceId": 1, "timestamp": "2025-05-05T10:30:00Z"}'
```

### Format MQTT poruka

Sistem očekuje sledeće MQTT teme i formate:

- **Pritisak dugmeta**: `obedio/button/{deviceId}/press`
```json
{
  "deviceId": 1,
  "timestamp": "2025-05-05T10:30:00Z"
}
```

- **Status baterije**: `obedio/device/{deviceId}/battery`
```json
{
  "deviceId": 1,
  "batteryLevel": 85,
  "timestamp": "2025-05-05T10:30:00Z"
}
```

## Arhitektura sistema

Obedio Admin je izgrađen kao moderna web aplikacija sa sledećim ključnim komponentama:

1. **Frontend (Next.js)**:
   - App Router za rutiranje stranica
   - Server komponente za optimalne performanse
   - Klijentske komponente za interaktivni UI

2. **Backend (Next.js API rute)**:
   - REST API za CRUD operacije
   - Server-Sent Events za real-time ažuriranja

3. **Integracije**:
   - MQTT Bridge za IoT komunikaciju
   - Prisma ORM za interakciju sa bazom podataka

4. **Baza podataka**:
   - PostgreSQL za perzistenciju podataka
   - Relacioni model za uređaje, zahteve i korisnike

## Doprinos projektu

Ako želite da doprinesete ovom projektu, molimo pratite ove korake:

1. Fork repozitorijuma
2. Kreiranje feature grane (`git checkout -b feature/amazing-feature`)
3. Commit promena (`git commit -m 'Add some amazing feature'`)
4. Push na granu (`git push origin feature/amazing-feature`)
5. Otvoriti Pull Request

## Licenca

Copyright © 2025 Obedio Organization
