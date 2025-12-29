# CSV Format za Import Letova

## Potrebna Polja

### Obavezna polja:
1. **airline_code** - IATA kod aviokomanije (2-3 karaktera, npr. W6, TK, LH, FR)
2. **flight_number** - Broj leta (1-10 karaktera, npr. W63001, TK1021)
3. **destination_code** - IATA kod destinacije (3 karaktera, npr. IST, VIE, BUD, MUC)
4. **is_departure** - Tip leta (true za odlazni, false za dolazni)
5. **departure_time** - Vrijeme polaska (obavezno za odlazne letove, format: YYYY-MM-DD HH:MM)
6. **arrival_time** - Vrijeme dolaska (obavezno za dolazne letove, format: YYYY-MM-DD HH:MM)

### Opciona polja:
1. **remarks** - Napomene (max 500 karaktera)
2. **status** - Status leta (default: SCHEDULED)
   - Dozvoljene vrijednosti: SCHEDULED, ON_TIME, DELAYED, CANCELLED, DEPARTED, ARRIVED, BOARDING, DIVERTED, ESTIMATED, CHECK_IN_CLOSED, GATE_CLOSED

## Pravila:

1. **Za odlazne letove (is_departure=true)**:
   - departure_time MORA biti popunjen
   - arrival_time MORA biti prazan

2. **Za dolazne letove (is_departure=false)**:
   - arrival_time MORA biti popunjen
   - departure_time MORA biti prazan

3. **airline_code i destination_code moraju postojati u bazi**:
   - Prije importa CSV-a, provjerite da aviokompanija i destinacija postoje u sistemu
   - Ako ne postoje, dodajte ih kroz Admin panel

## Format Datuma i Vremena

- Format: **YYYY-MM-DD HH:MM**
- Primjeri:
  - 2025-01-15 06:30
  - 2025-12-31 23:45
- Vrijeme se automatski konvertuje u UTC

## Primjer CSV Fajla

```csv
airline_code,flight_number,departure_time,arrival_time,destination_code,is_departure,remarks,status
W6,W63001,2025-01-15 06:30,,,BUD,true,Check-in counter C1-C3,SCHEDULED
TK,TK1021,,2025-01-15 10:15,IST,false,Gate opens 30 min before departure,ON_TIME
W6,W63002,2025-01-15 14:20,,,VIE,true,,SCHEDULED
LH,LH1234,,2025-01-15 18:45,MUC,false,Delayed 15 minutes,DELAYED
```

## Česte Greške

1. **Pogrešan format datuma** - Koristite YYYY-MM-DD HH:MM format
2. **Nepostojeći airline_code** - Prvo kreirajte aviokompaniju u sistemu
3. **Nepostojeći destination_code** - Prvo kreirajte destinaciju u sistemu
4. **Prazno departure_time za odlazni let** - Odlazni letovi moraju imati departure_time
5. **Prazno arrival_time za dolazni let** - Dolazni letovi moraju imati arrival_time
6. **Popunjena oba vremena** - Let može imati samo departure_time ILI arrival_time, ne oba

## Download Template

CSV template fajl možete preuzeti sa: `/flight_import_template.csv`
