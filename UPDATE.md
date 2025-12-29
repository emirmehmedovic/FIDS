# Uputstvo za Ažuriranje Aplikacije

Ovo uputstvo opisuje kako ažurirati postojeću instalaciju Flight Management sistema sa najnovijim promjenama.

## ⚡ Brzi Update (Kratak Pregled)

```bash
# 1. Pull novih promjena
git pull origin main

# 2. Backend - ažuriraj dependencije i migracije
cd backend
npm install
npx sequelize-cli db:migrate

# 3. Frontend - ažuriraj dependencije i rebuild
cd ../frontend
npm install
export REACT_APP_API_URL=/api  # Relativni path - Nginx će proksirati na backend
npm run build

# 4. Restart aplikacije
pm2 restart skyline-backend skyline-frontend
# ili
pm2 restart all
```

---

## 📍 Specifičnosti Vaše Instalacije

**Lokacije:**
- Root direktorij: `/home/adminaerodrom/FIDS/`
- Backend: `/home/adminaerodrom/FIDS/backend/`
- Frontend: `/home/adminaerodrom/FIDS/frontend/`
- Backend .env: `/home/adminaerodrom/FIDS/backend/.env`
- Nginx config: `/etc/nginx/sites-available/default`

**PM2 Procesi:**
- `skyline-backend` - Backend na portu 5001
- `skyline-frontend` - Frontend server na portu 3000

**Nginx Reverse Proxy:**
- `/api/...` → `http://localhost:5001/...` (uklanja `/api` prefix)
- `/uploads/...`, `/public/...`, `/content/...` → `http://localhost:5001` (sa prefiksom)
- Sve ostalo → `http://localhost:3000` (Frontend)

**Statički HTML fajlovi:**
- Koriste hardkodirane URL-ove: `http://192.168.18.15:5001/...` (bez `/api`)
- Lokacija: `frontend/public/` (originali) i `frontend/build/` (kopije)

---

## 📋 Detaljno Uputstvo za Update

### 1. Backup (Preporučeno)

**Napravite backup baze podataka prije update-a:**

```bash
# Backup baze podataka
pg_dump -U flight_user -d flight_management > backup_before_update_$(date +%Y%m%d_%H%M%S).sql

# Ili sa kompresijom
pg_dump -U flight_user -d flight_management | gzip > backup_before_update_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Provjerite trenutni status migracija:**

```bash
cd backend
npx sequelize-cli db:migrate:status
```

---

### 2. Pull Novih Promjena sa Git-a

```bash
# Navigirajte do root direktorijuma projekta
cd ~/FIDS

# Provjerite trenutnu granu i status
git status

# Pull najnovijih promjena
git pull origin main

# Provjerite šta je ažurirano
git log --oneline -10
```

---

### 3. Ažuriranje Backenda

```bash
cd ~/FIDS/backend

# Ažurirajte dependencije
npm install

# Provjerite da li postoje nove migracije
npx sequelize-cli db:migrate:status

# Pokrenite nove migracije
npx sequelize-cli db:migrate

# Provjerite da su sve migracije uspješno pokrenute
npx sequelize-cli db:migrate:status

# Restart backend procesa
pm2 restart skyline-backend
```

**Napomena o migracijama:**
- Većina migracija se pokreće automatski sa `npx sequelize-cli db:migrate`
- Prve dvije migracije (`001_create_tables.sql`, `002_add_display_sessions.sql`) su SQL fajlovi i moraju se izvršiti ručno preko `psql` ako se prvi put postavlja baza
- Za update postojeće instalacije, obično nije potrebno ručno izvršavanje

**Ako imate greške sa migracijama:**

```bash
# Provjerite status migracija
npx sequelize-cli db:migrate:status

# Ako trebate vratiti poslednju migraciju
npx sequelize-cli db:migrate:undo

# Zatim pokušajte ponovo
npx sequelize-cli db:migrate
```

---

### 4. Ažuriranje Frontenda

```bash
cd ~/FIDS/frontend

# Ažurirajte dependencije
npm install

# Postavite API URL - VAŽNO: koristite relativni path /api
# Nginx će automatski proksirati /api zahtjeve na backend (localhost:5001)
export REACT_APP_API_URL=/api

# Rebuild frontenda
npm run build

# Provjerite da je build uspješan
ls -la build/
ls -la build/static/

# Restart frontend procesa
cd ..
pm2 restart skyline-frontend
```

**Ako build ne radi:**

```bash
# Očistite cache i node_modules
rm -rf node_modules package-lock.json build
npm install
npm run build
```

---

### 5. Restart Aplikacije

**Ako koristite PM2:**

```bash
# Provjerite status
pm2 status

# Restart svih aplikacija
pm2 restart all

# Ili restart pojedinačno (prema imenima procesa u vašoj instalaciji)
pm2 restart skyline-backend
pm2 restart skyline-frontend

# Provjerite logove
pm2 logs skyline-backend --lines 50
pm2 logs skyline-frontend --lines 50

# Ili sve logove odjednom
pm2 logs --lines 50
```

**Ako koristite systemd (alternativa PM2):**

```bash
# Restart backend
sudo systemctl restart flight-backend

# Restart frontend
sudo systemctl restart flight-frontend

# Provjerite status
sudo systemctl status flight-backend
sudo systemctl status flight-frontend

# Provjerite logove
sudo journalctl -u flight-backend -n 50
sudo journalctl -u flight-frontend -n 50
```

**Napomena:** U vašoj instalaciji koristite PM2 procese `skyline-backend` i `skyline-frontend`.

**Ako koristite Nginx:**

```bash
# Reload Nginx konfiguracije (ako ste mijenjali)
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6. Provjera da Aplikacija Radi

**Provjerite backend:**

```bash
# Lokalno (direktno na backend)
curl http://localhost:5001/api/health

# Kroz Nginx proxy (Nginx proksira /api na backend)
curl http://192.168.18.15/api/health

# Direktno sa statičke IP adrese (port 5001 je otvoren za statičke HTML fajlove)
curl http://192.168.18.15:5001/api/health
```

**Provjerite frontend:**

- Otvorite pretraživač i idite na: `http://192.168.18.15`
- Provjerite da se stranica učitava
- Provjerite da API pozivi rade (otvorite Developer Tools -> Network)

**Provjerite logove za greške:**

```bash
# PM2 logovi
pm2 logs --lines 100

# Systemd logovi
sudo journalctl -u flight-backend -f
sudo journalctl -u flight-frontend -f

# Nginx logovi
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Rollback (Ako Nešto Pođe Po Zlu)

Ako update ne radi kako treba, možete vratiti promjene:

### Rollback Migracija

```bash
cd backend

# Vratite poslednju migraciju
npx sequelize-cli db:migrate:undo

# Ili vratite do određene migracije
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-migration-name.js
```

### Rollback Git Promjena

```bash
# Vratite na prethodnu verziju
git log --oneline  # Pronađite commit hash prije update-a
git reset --hard <commit-hash>

# Zatim ponovite korake 3-5 (bez migracija ako ste ih već rollback-ovali)
```

### Restore Baze Podataka

```bash
# Restore iz backupa
psql -U flight_user -d flight_management < backup_before_update_YYYYMMDD_HHMMSS.sql

# Ili iz kompresovanog backupa
gunzip < backup_before_update_YYYYMMDD_HHMMSS.sql.gz | psql -U flight_user -d flight_management
```

---

## 📝 Checklist za Update

- [ ] Backup baze podataka kreiran
- [ ] Status migracija provjeren prije update-a
- [ ] Git pull uspješan
- [ ] Backend dependencije ažurirane (`npm install`)
- [ ] Nove migracije pokrenute (`npx sequelize-cli db:migrate`)
- [ ] Status migracija provjeren nakon update-a
- [ ] Frontend dependencije ažurirane (`npm install`)
- [ ] `REACT_APP_API_URL` provjeren i ispravan
- [ ] Frontend rebuildan (`npm run build`)
- [ ] Build direktorij provjeren
- [ ] Aplikacija restartovana (PM2 ili systemd)
- [ ] Backend API testiran
- [ ] Frontend testiran u pretraživaču
- [ ] Logovi provjereni za greške
- [ ] Nginx reload-ovan (ako je potrebno)

---

## 🐛 Česti Problemi i Rješenja

### Problem: Migracije ne prolaze

**Rješenje:**

```bash
# Provjerite status migracija
npx sequelize-cli db:migrate:status

# Provjerite konekciju sa bazom
psql -h localhost -U flight_user -d flight_management

# Provjerite .env fajl
cat backend/.env

# Ako je migracija već pokrenuta, možete je preskočiti ili rollback-ovati
```

### Problem: Build frontenda ne radi

**Rješenje:**

```bash
# Očistite sve i ponovite
cd frontend
rm -rf node_modules package-lock.json build
npm install
export REACT_APP_API_URL=http://192.168.18.15  # Provjerite da li treba /api ili ne
npm run build
```

### Problem: Aplikacija se ne restartuje

**Rješenje:**

```bash
# PM2 - provjerite imena procesa
pm2 list

# Restart pojedinačno
pm2 restart skyline-backend
pm2 restart skyline-frontend

# Ili restart sve
pm2 restart all

# Ako ne radi, pokušajte stop/start
pm2 stop all
pm2 start all

# Provjerite da su procesi sačuvani
pm2 save
```

### Problem: API ne radi nakon update-a

**Rješenje:**

1. Provjerite da backend radi: `curl http://localhost:5001/api/health`
2. Provjerite da Nginx proksira zahtjeve: `curl http://192.168.18.15/api/health`
3. Provjerite CORS postavke u `backend/src/index.js`
4. Provjerite da je `REACT_APP_API_URL=/api` korišten prije builda (relativni path!)
5. Provjerite Nginx konfiguraciju: `sudo nginx -t && sudo systemctl status nginx`
6. Provjerite logove:
   - Backend: `pm2 logs skyline-backend --lines 50`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

---

## 💡 Savjeti

1. **Uvijek napravite backup** prije update-a
2. **Provjerite status migracija** prije i nakon update-a
3. **Testirajte na test okruženju** prije produkcije (ako je moguće)
4. **Čitajte commit poruke** da znate šta je ažurirano
5. **Provjerite logove** nakon svakog update-a
6. **Ažurirajte redovno** da izbjegnete velike promjene odjednom

---

**Napomena:** 
- **Statička IP adresa:** `192.168.18.15`
- **Backend port:** `5001` (definisan kao `HOST=5001` u `backend/.env`, ali backend koristi `process.env.PORT`)
- **Frontend API URL:** Koristite `REACT_APP_API_URL=/api` (relativni path)
- **Nginx konfiguracija:**
  - `/api/...` → proksira se na `http://localhost:5001/...` (uklanja se `/api` prefix)
  - `/uploads/...`, `/public/...`, `/content/...` → direktno na `http://localhost:5001`
  - Svi ostali zahtjevi → `http://localhost:3000` (Frontend)
- **Statički HTML fajlovi** (rl.html, ekrani.html) koriste hardkodirane pune URL-ove bez `/api` prefiksa: `http://192.168.18.15:5001/...` (zbog WebOS kompatibilnosti)
- **PM2 procesi:** `skyline-backend` i `skyline-frontend`
- **Lokacija koda:** `/home/adminaerodrom/FIDS/`

