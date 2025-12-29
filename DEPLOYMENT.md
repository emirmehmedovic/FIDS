# Uputstvo za Deployment

Ovaj dokument sadrži detaljne korake za postavljanje (deployment) Flight Management sistema u produkcijsko okruženje.

> **📌 Za ažuriranje postojeće instalacije**, pogledajte [UPDATE.md](./UPDATE.md) - kratko uputstvo za update proces.

## ⚡ Quick Start (Kratak Pregled)

Ako već imate iskustvo sa deploymentom, evo brzog pregleda koraka:

```bash
# 1. Baza podataka
createdb flight_management
createuser flight_user -P

# 2. Backend
cd backend
npm install
# Kreirajte .env fajl
npx sequelize-cli db:migrate

# 3. Frontend
cd ../frontend
npm install
export REACT_APP_API_URL=http://localhost:5001
npm run build

# 4. Pokretanje
cd ../backend && npm start &
cd ../frontend && npm run start:prod
```

Za detaljne uputstva, nastavite čitati dokument.

---

## 📋 Preduslovi

- Node.js (LTS verzija, preporučeno v18 ili novija)
- npm ili yarn
- PostgreSQL baza podataka (lokalna ili remote)
- Git (za kloniranje repozitorijuma)
- Pristup serveru gdje će se aplikacija pokretati

---

## 🗄️ 1. Priprema Baze Podataka

### 1.1. Kreiranje PostgreSQL Baze

Povežite se na PostgreSQL server i kreirajte bazu podataka:

```sql
-- Kreirajte bazu podataka
CREATE DATABASE flight_management;

-- Kreirajte korisnika (opcionalno, možete koristiti postojećeg)
CREATE USER flight_user WITH PASSWORD 'vaša_sigurna_lozinka';

-- Dodijelite privilegije
GRANT ALL PRIVILEGES ON DATABASE flight_management TO flight_user;

-- Postavite encoding i timezone
ALTER ROLE flight_user SET client_encoding TO 'utf8';
ALTER ROLE flight_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE flight_user SET timezone TO 'Europe/Sarajevo';
```

### 1.2. Provjera Konekcije

Provjerite da možete povezati se na bazu:

```bash
psql -h localhost -U flight_user -d flight_management
```

---

## 🔧 2. Postavljanje Backenda

### 2.1. Kloniranje i Navigacija

```bash
git clone <URL_REPOZITORIJUMA>
cd flight-management/backend
```

### 2.2. Instalacija Dependencija

```bash
npm install
```

### 2.3. Konfiguracija Environment Varijabli

Kreirajte `.env` fajl u `backend` direktorijumu:

**Opcija A: Pojedinačni parametri (Development/Lokalna Produkcija)**

```bash
# Development/Production okruženje
NODE_ENV=production

# PostgreSQL konfiguracija
DB_USER=flight_user
DB_PASS=vaša_sigurna_lozinka
DB_NAME=flight_management
DB_HOST=localhost  # ili IP adresa PostgreSQL servera
DB_PORT=5432

# JWT Secret (generišite jak, slučajan string)
JWT_SECRET=vaš_veoma_tajni_ključ_za_jwt_token_generisanje

# Port na kojem backend osluškuje
PORT=5001
```

**Opcija B: DATABASE_URL (Produkcija - Render, Heroku, itd.)**

Za produkciju, sistem automatski koristi `DATABASE_URL` ako je postavljen:

```bash
# Development/Production okruženje
NODE_ENV=production

# DATABASE_URL format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://flight_user:vaša_sigurna_lozinka@host:5432/flight_management

# JWT Secret (generišite jak, slučajan string)
JWT_SECRET=vaš_veoma_tajni_ključ_za_jwt_token_generisanje

# Port na kojem backend osluškuje
PORT=5001

# Za produkciju sa SSL baze (ako je potrebno)
# DB_SSL_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
```

**Napomena:** Ako je `NODE_ENV=production` i postoji `DATABASE_URL`, sistem će automatski koristiti `DATABASE_URL` umjesto pojedinačnih parametara.

**⚠️ VAŽNO:** 
- `JWT_SECRET` mora biti jak, slučajan string (minimalno 32 karaktera)
- Nikada ne commitajte `.env` fajl u Git
- Za produkciju koristite sigurne lozinke

### 2.4. Pokretanje Migracija Baze Podataka

**Ovo je kritičan korak!** Migracije će kreirati sve potrebne tabele u bazi:

```bash
# Provjerite da je NODE_ENV postavljen
export NODE_ENV=production  # ili development

# Pokrenite migracije
npx sequelize-cli db:migrate
```

**Provjera migracija:**

```bash
# Provjerite status migracija
npx sequelize-cli db:migrate:status
```

**Ako trebate vratiti migraciju:**

```bash
# Vratite poslednju migraciju
npx sequelize-cli db:migrate:undo

# Vratite sve migracije (OPREZ!)
npx sequelize-cli db:migrate:undo:all
```

### 2.5. Pokretanje Seeder-a (Opcionalno)

Ako imate seedere za početne podatke (npr. admin korisnik):

```bash
npx sequelize-cli db:seed:all
```

### 2.6. Testiranje Backenda

```bash
# Test pokretanje
npm start
```

Backend bi trebao biti dostupan na `http://localhost:5001` (ili portu iz `.env`).

**Provjera API endpointa:**

```bash
curl http://localhost:5001/api/health  # ili neki drugi endpoint
```

---

## 🎨 3. Postavljanje Frontenda

### 3.1. Navigacija i Instalacija

```bash
cd ../frontend
npm install
```

### 3.2. Konfiguracija API URL-a

Frontend koristi `src/config.js` koji čita `REACT_APP_API_URL` environment varijablu.

**Za produkciju na lokalnoj mreži**, postavite environment varijablu prije builda:

```bash
# Ako koristite Nginx reverse proxy (preporučeno)
export REACT_APP_API_URL=http://192.168.1.100/api
# Zamijenite 192.168.1.100 sa vašom statičkom IP adresom

# Ili ako pristupate direktno backend-u (bez Nginx)
export REACT_APP_API_URL=http://192.168.1.100:5001
```

**Ili kreirajte `.env` fajl u `frontend` direktorijumu:**

```bash
REACT_APP_API_URL=http://localhost:5001
```

### 3.3. Build Frontenda

```bash
npm run build
```

Ovo će kreirati optimizovanu produkcijsku verziju u `frontend/build` direktorijumu.

**Provjera builda:**

```bash
# Provjerite da build direktorij postoji
ls -la build/

# Provjerite da su fajlovi kreirani
ls -la build/static/
```

---

## 🚀 4. Pokretanje Aplikacije u Produkciji

### 4.1. Opcija 1: Pokretanje sa Node.js (Razvoj/Test)

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run start:prod  # Ovo pokreće build + server.js
```

### 4.2. Opcija 2: Korištenje PM2 (Preporučeno za Produkciju)

**Instalacija PM2:**

```bash
npm install -g pm2
```

**Kreiranje PM2 konfiguracije (`ecosystem.config.js` u root direktorijumu):**

```javascript
module.exports = {
  apps: [
    {
      name: 'flight-backend',
      cwd: './backend',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'flight-frontend',
      cwd: './frontend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

**Pokretanje sa PM2:**

```bash
# Kreirajte logs direktorij
mkdir -p logs

# Pokrenite aplikacije
pm2 start ecosystem.config.js

# Provjerite status
pm2 status

# Pregled logova
pm2 logs

# Restart aplikacije
pm2 restart all

# Zaustavljanje
pm2 stop all

# Brisanje iz PM2
pm2 delete all
```

**PM2 na sistem restart:**

```bash
# Sačuvajte trenutnu konfiguraciju
pm2 save

# Postavite PM2 da se pokrene na sistem restart
pm2 startup
# Slijedite uputstva koja PM2 prikaže
```

### 4.3. Opcija 3: Korištenje Nginx kao Reverse Proxy

**Nginx konfiguracija (`/etc/nginx/sites-available/flight-management`):**

```nginx
server {
    listen 80;
    server_name 192.168.1.100;  # Vaša statička IP adresa
    # Ili možete koristiti: server_name _; za prihvat svih IP adresa

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Povećaj timeout za duže zahtjeve
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Aktivacija:**

```bash
sudo ln -s /etc/nginx/sites-available/flight-management /etc/nginx/sites-enabled/
sudo nginx -t  # Provjera konfiguracije
sudo systemctl reload nginx
```

---

## 💾 5. Backup i Rollback

### 5.1. Backup Baze Podataka

**Preporučeno:** Napravite backup prije svake migracije ili važne promjene:

```bash
# Backup baze podataka
pg_dump -h localhost -U flight_user -d flight_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Ili sa kompresijom
pg_dump -h localhost -U flight_user -d flight_management | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Restore backupa:**

```bash
# Restore iz SQL fajla
psql -h localhost -U flight_user -d flight_management < backup_20250101_120000.sql

# Restore iz kompresovanog fajla
gunzip < backup_20250101_120000.sql.gz | psql -h localhost -U flight_user -d flight_management
```

### 5.2. Rollback Migracija

**Vraćanje poslednje migracije:**

```bash
cd backend
npx sequelize-cli db:migrate:undo
```

**Vraćanje do specifične migracije:**

```bash
# Provjerite status migracija
npx sequelize-cli db:migrate:status

# Vratite do određene migracije (koristite ime fajla bez ekstenzije)
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-migration-name.js
```

**⚠️ OPREZ:** Rollback može izbrisati podatke! Uvijek napravite backup prije rollback-a.

---

## 🔄 6. Ažuriranje Aplikacije (Update)

Kada imate nove promjene:

### 5.1. Pull Novih Promjena

```bash
cd /path/to/flight-management
git pull origin main
```

### 5.2. Ažuriranje Dependencija

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5.3. Pokretanje Novih Migracija

```bash
cd backend
npx sequelize-cli db:migrate
```

### 5.4. Rebuild Frontenda

```bash
cd ../frontend
npm run build
```

### 5.5. Restart Aplikacije

**Sa PM2:**

```bash
pm2 restart all
```

**Ili ručno:**

```bash
# Zaustavite trenutne procese
# Pokrenite ponovo
```

---

## 🐛 7. Troubleshooting

### Problem: Migracije ne prolaze

**Rješenje:**

```bash
# Provjerite status migracija
npx sequelize-cli db:migrate:status

# Provjerite konekciju sa bazom
psql -h localhost -U flight_user -d flight_management

# Provjerite .env fajl
cat backend/.env

# Provjerite da je NODE_ENV postavljen
echo $NODE_ENV
```

### Problem: Backend se ne povezuje na bazu

**Rješenje:**

1. Provjerite da PostgreSQL server radi: `sudo systemctl status postgresql`
2. Provjerite da su kredencijali u `.env` tačni
3. Provjerite firewall: `sudo ufw status`
4. Provjerite da je baza kreirana i da korisnik ima privilegije

### Problem: Frontend ne može pristupiti API-ju

**Rješenje:**

1. Provjerite da je `REACT_APP_API_URL` postavljen prije builda (koristite statičku IP adresu)
2. Provjerite da backend radi: `curl http://localhost:5001/api/health`
3. Provjerite da možete pristupiti sa drugih uređaja: `curl http://192.168.1.100:5001/api/health`
4. Provjerite CORS postavke u backend `src/index.js`
5. Provjerite firewall i portove
6. Provjerite da Nginx proxy radi: `curl http://192.168.1.100/api/health`
7. Provjerite da je statička IP adresa ispravno konfigurisana u Nginx konfiguraciji

### Problem: Build frontenda ne radi

**Rješenje:**

```bash
# Očistite cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 8. Checklist za Deployment

- [ ] PostgreSQL baza kreirana i konfigurisana
- [ ] Backend `.env` fajl kreiran sa svim potrebnim varijablama
- [ ] Backend dependencije instalirane (`npm install`)
- [ ] Migracije baze pokrenute (`npx sequelize-cli db:migrate`)
- [ ] Status migracija provjeren (`npx sequelize-cli db:migrate:status`)
- [ ] Backend testiran i radi (`npm start`)
- [ ] Frontend `.env` kreiran (ako je potrebno) sa `REACT_APP_API_URL`
- [ ] Frontend dependencije instalirane (`npm install`)
- [ ] Frontend buildan (`npm run build`)
- [ ] Build direktorij provjeren
- [ ] Aplikacija pokrenuta (PM2, Node.js, ili Nginx)
- [ ] API endpointi testirani
- [ ] Frontend pristupa API-ju
- [ ] Logovi provjereni za greške
- [ ] Firewall konfigurisan (ako je potrebno)
- [ ] Nginx konfigurisan sa statičkom IP adresom
- [ ] Firewall konfigurisan za lokalnu mrežu

---

## 🔐 9. Sigurnosne Preporuke

1. **Nikada ne commitajte `.env` fajlove**
2. **Koristite jak JWT_SECRET** (minimalno 32 karaktera, slučajan)
3. **Koristite sigurne lozinke za bazu podataka**
4. **Konfigurišite firewall** da dozvoljava samo potrebne portove
5. **Ograničite pristup na lokalnu mrežu** (ako je moguće, koristite UFW rules sa IP range-om)
6. **Redovno ažurirajte dependencije** (`npm audit`, `npm update`)
7. **Koristite environment varijable** umjesto hardkodiranih vrijednosti
8. **Backup baze podataka** redovno
9. **Za lokalnu mrežu, HTTP je prihvatljivo**, ali razmislite o VPN-u za dodatnu sigurnost

---

## 📞 10. Dodatne Napomene

- **Migracije su idempotentne** - možete ih pokrenuti više puta bez problema
- **Seedere pokrenite samo jednom** (ili koristite `--seed` flag sa oprezom)
- **PM2 je preporučeno** za produkcijsko okruženje zbog automatskog restart-a
- **Nginx reverse proxy** je dobar izbor za produkciju sa SSL
- **Provjerite logove** redovno za potencijalne probleme

---

## 🖥️ 12. Deployment na Privatni Server (Lokalna Mreža)

Ovo uputstvo je optimizovano za deployment na privatni server unutar lokalne mreže sa statičkom IP adresom.

### 12.1. Preporučena Arhitektura

```
┌─────────────┐
│   Nginx     │  Port 80 (HTTP)
│ (Reverse    │  Statička IP: 192.168.x.x
│   Proxy)    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  Frontend   │ │  Backend  │ │ PostgreSQL│
│  (Port 3000)│ │ (Port 5001)│ │ (Port 5432)│
└─────────────┘ └───────────┘ └───────────┘
```

**Primjer pristupa:**
- Frontend: `http://192.168.1.100` (ili statička IP adresa)
- Backend API: `http://192.168.1.100/api` (proksiran kroz Nginx)

### 12.2. Konfiguracija Firewalla (UFW)

```bash
# Omogućite UFW
sudo ufw enable

# Dozvolite SSH (VAŽNO - prije zatvaranja pristupa!)
sudo ufw allow 22/tcp

# Dozvolite HTTP (za lokalnu mrežu)
sudo ufw allow 80/tcp

# Dozvolite pristup samo iz lokalne mreže (opcionalno, npr. 192.168.1.0/24)
# sudo ufw allow from 192.168.1.0/24 to any port 80

# Provjerite status
sudo ufw status
```

**Napomena:** 
- Ne otvarajte portove 3000 i 5001 javno - Nginx će ih koristiti interno
- Za dodatnu sigurnost, možete ograničiti pristup samo na lokalnu mrežu

### 12.3. Nginx Konfiguracija za Lokalnu Mrežu

**Nginx konfiguracija (`/etc/nginx/sites-available/flight-management`):**

```nginx
server {
    listen 80;
    server_name 192.168.1.100;  # Vaša statička IP adresa
    # Ili možete koristiti: server_name _; za prihvat svih IP adresa

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Povećaj timeout za duže zahtjeve
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Aktivacija:**

```bash
sudo ln -s /etc/nginx/sites-available/flight-management /etc/nginx/sites-enabled/
sudo nginx -t  # Provjera konfiguracije
sudo systemctl reload nginx
```

### 12.4. Automatski Backup Baze Podataka

**Kreiranje Backup Skripte (`/usr/local/bin/backup-flight-db.sh`):**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/flight-management"
DB_NAME="flight_management"
DB_USER="flight_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Kreirajte direktorij ako ne postoji
mkdir -p $BACKUP_DIR

# Napravite backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Obrišite backupove starije od 30 dana
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup kreiran: $BACKUP_FILE"
```

**Postavljanje Cron Joba:**

```bash
# Uredite crontab
sudo crontab -e

# Dodajte za dnevni backup u 2:00 AM
0 2 * * * /usr/local/bin/backup-flight-db.sh >> /var/log/backup-flight-db.log 2>&1
```

### 12.5. Monitoring i Logovi

**PM2 Monitoring:**

```bash
# Pregled statusa
pm2 status

# Pregled logova
pm2 logs

# Monitoring dashboard
pm2 monit

# Pregled resursa
pm2 list
```

**Nginx Logovi:**

```bash
# Access logovi
sudo tail -f /var/log/nginx/access.log

# Error logovi
sudo tail -f /var/log/nginx/error.log
```

**PostgreSQL Logovi:**

```bash
# Provjerite lokaciju log fajlova u postgresql.conf
sudo grep log_directory /etc/postgresql/*/main/postgresql.conf
```

### 12.6. Systemd Service (Alternativa PM2)

Ako preferirate systemd umjesto PM2, možete kreirati service fajlove:

**Backend Service (`/etc/systemd/system/flight-backend.service`):**

```ini
[Unit]
Description=Flight Management Backend
After=network.target postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/flight-management/backend
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/flight-management/backend/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Frontend Service (`/etc/systemd/system/flight-frontend.service`):**

```ini
[Unit]
Description=Flight Management Frontend
After=network.target flight-backend.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/flight-management/frontend
Environment="NODE_ENV=production"
Environment="REACT_APP_API_URL=http://localhost:5001"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Upravljanje Service-ima:**

```bash
# Učitajte nove service fajlove
sudo systemctl daemon-reload

# Pokrenite service
sudo systemctl start flight-backend
sudo systemctl start flight-frontend

# Omogućite automatski start na boot
sudo systemctl enable flight-backend
sudo systemctl enable flight-frontend

# Provjerite status
sudo systemctl status flight-backend
sudo systemctl status flight-frontend
```

---

## 📚 11. Korisni Linkovi i Resursi

- [Sequelize Migrations Documentation](https://sequelize.org/docs/v6/other-topics/migrations/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [React Build Documentation](https://create-react-app.dev/docs/production-build/)

---

**Napomena:** Ovo uputstvo pretpostavlja Linux/Unix okruženje. Za Windows, neke komande se mogu razlikovati (npr. `export` umjesto `set`).

