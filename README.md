# Sistem za Upravljanje Letovima (FIDS)

Ovaj projekat implementira sistem za upravljanje informacijama o letovima (Flight Information Display System - FIDS), uključujući pozadinski API (backend) i korisnički interfejs (frontend). Sistem je prvobitno podešen za postavljanje (deployment) na Vercel (frontend) i Render (backend/baza podataka), ali se može pokrenuti i lokalno ili unutar lokalne mreže.

## Tehnologije

*   **Pozadina (Backend):**
    *   Node.js
    *   Express.js (Web framework)
    *   Sequelize (ORM za PostgreSQL)
    *   PostgreSQL (Baza podataka)
    *   JSON Web Tokens (JWT) (za autentifikaciju)
    *   Bcrypt (za heširanje lozinki)
    *   Dotenv (za upravljanje varijablama okruženja)
*   **Frontend:**
    *   React.js (UI biblioteka)
    *   React Router (Navigacija)
    *   Redux Toolkit (Upravljanje stanjem aplikacije)
    *   Axios (HTTP klijent)
    *   React Bootstrap (UI komponente)
    *   Create React App (Osnova projekta)
*   **Alati:**
    *   Git (Verzionisanje koda)
    *   npm (Node Package Manager)
    *   Nodemon (Automatsko ponovno pokretanje backend servera u razvoju)
    *   Sequelize CLI (Upravljanje migracijama baze)

## Preduslovi

*   Node.js (LTS verzija preporučena)
*   npm (dolazi uz Node.js)
*   Git
*   PostgreSQL Server (instaliran lokalno ili dostupan preko mreže/Dockera)
*   `psql` ili drugi PostgreSQL klijent (opcionalno, za lakše upravljanje bazom)

## Podešavanje i Instalacija

1.  **Kloniranje Repozitorijuma:**
    ```bash
    git clone <URL_VAŠEG_REPOZITORIJUMA>
    cd <IME_DIREKTORIJA_PROJEKTA>
    ```

2.  **Podešavanje Baze Podataka (PostgreSQL):**
    *   Povežite se na Vaš PostgreSQL server.
    *   Kreirajte bazu podataka, korisnika i dodijelite mu privilegije:
        ```sql
        -- Primjer (zamijenite sa vašim vrijednostima)
        CREATE DATABASE moja_baza_letova;
        CREATE USER moj_korisnik_letova WITH PASSWORD 'sigurna_lozinka';
        GRANT ALL PRIVILEGES ON DATABASE moja_baza_letova TO moj_korisnik_letova;
        ALTER ROLE moj_korisnik_letova SET client_encoding TO 'utf8';
        ALTER ROLE moj_korisnik_letova SET default_transaction_isolation TO 'read committed';
        ALTER ROLE moj_korisnik_letova SET timezone TO 'Europe/Sarajevo'; -- Prilagodite po potrebi
        ```

3.  **Podešavanje Pozadine (Backend):**
    *   Navigirajte do `backend` direktorijuma: `cd backend`
    *   Kreirajte `.env` datoteku (`cp .env.example .env` ako postoji primjer, ili je kreirajte ručno):
        ```dotenv
        # Podešavanja za bazu podataka (zamijenite vrijednostima iz koraka 2)
        DB_USER=moj_korisnik_letova
        DB_PASS=sigurna_lozinka
        DB_NAME=moja_baza_letova
        DB_HOST=localhost  # Ili IP adresa servera baze
        DB_PORT=5432       # Podrazumijevani port za PostgreSQL

        # Tajni ključ za JWT (generišite jak, slučajan string)
        JWT_SECRET=VAS_VEOMA_TAJNI_KLJUC_ZA_JWT

        # Port na kojem backend server osluškuje
        PORT=5001
        ```
    *   Instalirajte zavisnosti: `npm install`
    *   Pokrenite migracije baze: `npx sequelize-cli db:migrate`
    *   (Opcionalno) Pokrenite seedere (ako postoje) za popunjavanje početnim podacima: `npx sequelize-cli db:seed:all`

4.  **Podešavanje Frontenda:**
    *   Navigirajte do `frontend` direktorijuma: `cd ../frontend`
    *   Instalirajte zavisnosti: `npm install`
    *   **Napomena:** Frontend koristi `frontend/src/config.js` za određivanje API URL-a. Za lokalno pokretanje, on podrazumijevano koristi `http://localhost:5001`. Ako želite da aplikacija bude dostupna unutar Vaše lokalne mreže, pogledajte odjeljak "Pokretanje u Lokalnoj Mreži".

## Pokretanje Aplikacije (Lokalno)

1.  **Pokretanje Pozadine (Backend):**
    *   Otvorite terminal u `backend` direktorijumu.
    *   Pokrenite razvojni server:
        ```bash
        npm run dev
        ```
    *   Backend će biti dostupan na `http://localhost:5001` (ili portu definisanom u `.env`).

2.  **Pokretanje Frontenda:**
    *   Otvorite **novi** terminal u `frontend` direktorijumu.
    *   Pokrenite razvojni server:
        ```bash
        npm start
        ```
    *   Frontend će se automatski otvoriti u pretraživaču na `http://localhost:3000` (ili nekom drugom dostupnom portu).

## Pokretanje u Lokalnoj Mreži (VM ili Lokalni Server)

Da bi aplikacija bila dostupna sa drugih uređaja u Vašoj lokalnoj mreži:

1.  **Pronađite IP Adresu Servera/VM:**
    *   Na mašini gdje se pokreće aplikacija, koristite `ip a` (Linux) ili `ipconfig` (Windows) da pronađete lokalnu IP adresu (npr. `192.168.1.105`). Označimo je kao `<SERVER_IP_ADRESA>`.

2.  **Konfigurišite Firewall (Zaštitni Zid):**
    *   Osigurajte da firewall na serveru/VM dozvoljava dolazne konekcije na portovima koje koriste frontend (`3000` podrazumijevano) i backend (`5001` podrazumijevano).
    *   Primjer za UFW (Ubuntu/Debian):
        ```bash
        sudo ufw allow 3000/tcp
        sudo ufw allow 5001/tcp
        sudo ufw enable # Ako je potrebno
        ```

3.  **Pokrenite Pozadinu (Backend):**
    *   Pokrenite backend kao za lokalno pokretanje (`npm run dev` u `backend` direktorijumu). On bi trebalo da osluškuje na `0.0.0.0:5001`, što omogućava prihvatanje konekcija sa mreže.

4.  **Pokrenite Frontend (sa specifičnim API URL-om):**
    *   Otvorite terminal u `frontend` direktorijumu.
    *   Potrebno je reći React aplikaciji da koristi IP adresu servera za API pozive umjesto `localhost`. Preporučeni način je korištenjem varijable okruženja `REACT_APP_API_URL`. Prije pokretanja, izmijenite `frontend/src/config.js` da čita ovu varijablu (ako već nije podešeno):
        ```javascript
        // Unutar frontend/src/config.js
        const config = {
          // ... ostala podešavanja ...
          // Koristi REACT_APP_API_URL ako je postavljen, inače podrazumijevani localhost
          apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001',
        };
        export default config;
        ```
    *   Sada pokrenite frontend server postavljajući ovu varijablu:
        ```bash
        # Zamijenite <SERVER_IP_ADRESA> sa stvarnom IP adresom
        export REACT_APP_API_URL=http://<SERVER_IP_ADRESA>:5001
        npm start
        ```
    *   **Napomena za Windows:** Umjesto `export`, koristite `set REACT_APP_API_URL=http://<SERVER_IP_ADRESA>:5001` prije `npm start`, ili koristite alat kao `cross-env`.

5.  **Pristupite Aplikaciji:**
    *   Na bilo kom uređaju u istoj mreži, otvorite pretraživač i unesite: `http://<SERVER_IP_ADRESA>:3000`.

## Izgradnja za Produkciju (Frontend)

Da biste kreirali optimizovanu verziju frontenda za postavljanje (deployment):

```bash
cd frontend
npm run build
```
Ovo će kreirati statičke datoteke u `frontend/build` direktorijumu. Ove datoteke se zatim mogu servirati pomoću statičkog servera (kao što je Nginx, Apache, ili čak `serve` npm paket). Projekat sadrži i `frontend/server.js` koji može služiti izgrađene datoteke (`npm run start:prod` skripta u `package.json`).

## Dodatne Napomene

*   Provjerite `backend/.sequelizerc` za tačne putanje do modela, migracija, seedera i konfiguracione datoteke baze.
*   Za detalje o API krajnjim tačkama (endpoints), pogledajte datoteke ruta u `backend/src/routes/` i odgovarajuće kontrolere u `backend/src/controllers/`. 