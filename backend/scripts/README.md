# Flight Number Airline Mapping Scripts

Ove skripte automatski mapiraju aviokompaniju na brojeve letova na osnovu prefiksa broja leta.

## Mapiranje

| Prefiks | IATA Kod | Aviokompanija |
|---------|----------|---------------|
| W4*, W6* | W6 | Wizz Air |
| VF* | VF | Ajet |
| PC* | PC | Pegasus Airlines |
| FR* | FR | Ryanair |
| RK* | RK | Ryanair UK |
| CAI* | XC | Corendon Airlines |
| FH*, FHY* | FH | Freebird Airlines |
| XY* | XY | Flynas |

## Dostupne Skripte

### 1. Preview Script (Pregled)
Prikazuje šta bi se promijenilo **bez** stvarnog mijenjanja podataka.

```bash
cd /Users/emir_mw/flight-management/backend
node scripts/preview-flight-number-airlines.js
```

**Output:**
- Lista svih brojeva letova koji bi bili ažurirani
- Sumirani pregled po aviokompaniji
- Ukupan broj promijena

### 2. Update Script (Ažuriranje)
Stvarno ažurira podatke u bazi.

```bash
cd /Users/emir_mw/flight-management/backend
node scripts/update-flight-number-airlines.js
```

**Output:**
- Prikazuje svaku promjenu u realnom vremenu
- Sumirani pregled izvršenih promijena
- Lista neizmapiranih brojeva letova (ako ih ima)

## Sigurnosne Provjere

Obje skripte:
- ✅ Ne brišu postojeće podatke
- ✅ Ne dodaju duplikate
- ✅ Preskaču već pravilno mapirane zapise
- ✅ Prikazuju detaljne logove svih promijena
- ✅ Rade sa development i production bazom

## Kako koristiti na produkciji

1. **Prvo pokreni preview:**
```bash
NODE_ENV=production node scripts/preview-flight-number-airlines.js
```

2. **Provjeri output** - uvjeri se da su promjene ispravne

3. **Pokreni update:**
```bash
NODE_ENV=production node scripts/update-flight-number-airlines.js
```

4. **Provjeri rezultat** u admin panelu

## Što skripte rade?

1. **Spajaju se na bazu** (development ili production ovisno o NODE_ENV)
2. **Traže brojeve letova** koji počinju sa određenim prefiksom (npr. W4, W6, VF...)
3. **Ažuriraju `airline_code`** polje u `flight_numbers` tabeli
4. **Preskaču zapise** koji već imaju ispravan `airline_code`
5. **Prikazuju sumirani izvještaj** svih promijena

## Primjer Output-a

```
📋 FINAL SUMMARY
═══════════════════════════════════════════════════

W4* → W6 (Wizz Air)
  Total found: 9
  Updated: 9
  Already correct: 0

W6* → W6 (Wizz Air)
  Total found: 26
  Updated: 26
  Already correct: 0

...

═══════════════════════════════════════════════════
✅ TOTAL UPDATED: 50 flight numbers
═══════════════════════════════════════════════════
```

## Dodavanje novih aviokompanija

Da dodaš novo mapiranje, otvori bilo koju skriptu i ažuriraj `airlineMappings` niz:

```javascript
const airlineMappings = [
  { prefix: 'AB', airline_code: 'AB', name: 'Nova Aviokompanija' },
  // ... ostala mapiranja
];
```

## Troubleshooting

**Problem:** "Database connection failed"
- **Rješenje:** Provjeri da li su ENV varijable ispravno postavljene u `.env` fajlu

**Problem:** "No flight numbers found"
- **Rješenje:** Normalno - znači da nema brojeva letova sa tim prefiksom u bazi

**Problem:** Script se zaglavi
- **Rješenje:** Pritisni Ctrl+C i ponovo pokreni. Skripte su idempotentne (mogu se pokrenuti više puta bez problema)
