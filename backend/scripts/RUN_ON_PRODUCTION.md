# Komande za Pokretanje Skripti na Produkciji

**Napomena:** Skripte koriste `development` okruženje jer production konfiguracija očekuje `DATABASE_URL`, a vaša instalacija koristi pojedinačne parametre u `.env` fajlu.

## 1. Preview (Pregled - bez promjena)

```bash
cd ~/FIDS/backend
NODE_ENV=development node scripts/preview-flight-number-airlines.js
```

## 2. Update (Ažuriranje - stvarne promjene)

**VAŽNO:** Prvo pokrenite preview da vidite šta će se promijeniti!

```bash
cd ~/FIDS/backend
NODE_ENV=development node scripts/update-flight-number-airlines.js
```

---

## Brzi Copy-Paste

**Preview:**
```bash
cd ~/FIDS/backend && NODE_ENV=development node scripts/preview-flight-number-airlines.js
```

**Update:**
```bash
cd ~/FIDS/backend && NODE_ENV=development node scripts/update-flight-number-airlines.js
```

---

## Alternativa: Kreiranje DATABASE_URL

Ako želite koristiti `NODE_ENV=production`, možete kreirati `DATABASE_URL` iz postojećih parametara:

```bash
# Iz .env fajla: DB_USER, DB_PASS, DB_NAME, DB_HOST, DB_PORT
export DATABASE_URL="postgresql://flight_user:aerodrom1995aerodrom@localhost:5432/flight_management"

# Zatim pokrenite sa production
NODE_ENV=production node scripts/preview-flight-number-airlines.js
```

