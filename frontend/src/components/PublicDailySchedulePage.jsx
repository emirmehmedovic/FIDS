// PublicDailySchedulePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner, Alert } from 'react-bootstrap';
import './PublicDailySchedulePage.css';

const PublicDailySchedulePage = () => {
  const [dailyFlights, setDailyFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleDepartures, setVisibleDepartures] = useState(0);
  const [visibleArrivals, setVisibleArrivals] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [shouldRotate, setShouldRotate] = useState(false);

  const FLIGHTS_PER_PAGE = 4; // Prikazujemo 4 odlazna i 4 dolazna leta (ukupno 8)
  const ROTATION_INTERVAL = 15000; // Rotacija svakih 15 sekundi

  // Funkcija za formatiranje datuma i vremena
  const formatDateTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  };

  // Funkcija za formatiranje vremena (samo sati i minute)
  const formatTimeHoursMinutes = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Ažuriraj trenutni datum i vrijeme svake sekunde
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dohvati dnevne letove i postavi automatsko osvježavanje
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/public/daily-schedule');
        setDailyFlights(response.data);
      } catch (err) {
        console.error('Greška pri dobavljanju dnevnih letova:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Inicijalno dohvaćanje podataka
    fetchData();
    
    // Automatsko osvježavanje svakih 2 minute (120000 ms)
    const refreshInterval = setInterval(() => {
      console.log('Osvježavanje podataka o letovima...');
      fetchData();
    }, 120000);
    
    // Čišćenje intervala kada se komponenta unmount-a
    return () => clearInterval(refreshInterval);
  }, []);

  // Provjera da li treba rotirati letove i balansiranje tablica
  useEffect(() => {
    const departures = dailyFlights.filter((flight) => flight.is_departure);
    const arrivals = dailyFlights.filter((flight) => !flight.is_departure);
    
    // Rotiramo samo ako ima više od 4 odlazna ILI više od 4 dolazna leta
    const shouldRotateDepartures = departures.length > 4;
    const shouldRotateArrivals = arrivals.length > 4;
    
    // Postavimo stanje rotacije
    setShouldRotate(shouldRotateDepartures || shouldRotateArrivals);
    
    // Ako ne rotiramo, resetiramo indekse za prikaz
    if (!shouldRotate) {
      setVisibleDepartures(0);
      setVisibleArrivals(0);
    }
  }, [dailyFlights, shouldRotate]);

  // Rotacija letova svakih 15 sekundi, samo ako ima više od 8 letova
  useEffect(() => {
    if (!shouldRotate) return;

    const departures = dailyFlights.filter((flight) => flight.is_departure);
    const arrivals = dailyFlights.filter((flight) => !flight.is_departure);

    const rotateFlights = () => {
      setVisibleDepartures((prev) => (prev + FLIGHTS_PER_PAGE) % Math.max(departures.length, 1));
      setVisibleArrivals((prev) => (prev + FLIGHTS_PER_PAGE) % Math.max(arrivals.length, 1));
    };

    const rotationInterval = setInterval(rotateFlights, ROTATION_INTERVAL);

    return () => clearInterval(rotationInterval);
  }, [dailyFlights, shouldRotate]);

  if (loading) {
    return <Spinner animation="border" className="public-spinner" />;
  }

  if (error) {
    return <Alert variant="danger" className="public-error">{error}</Alert>;
  }

  const departures = dailyFlights.filter((flight) => flight.is_departure);
  const arrivals = dailyFlights.filter((flight) => !flight.is_departure);

  // Priprema letova za prikaz
  let visibleDepartureFlights, visibleArrivalFlights;
  
  // Uvijek prikazujemo tačno 4 leta po tablici, ili manje ako nema dovoljno letova
  if (departures.length > 4 && shouldRotate) {
    // Ako ima više od 4 odlazna leta i trebamo rotirati, prikazujemo 4 leta s odgovarajućim indeksom
    visibleDepartureFlights = departures.slice(visibleDepartures, visibleDepartures + FLIGHTS_PER_PAGE);
  } else {
    // Inače prikazujemo prva 4 leta ili manje ako nema dovoljno
    visibleDepartureFlights = departures.slice(0, Math.min(departures.length, FLIGHTS_PER_PAGE));
  }
  
  if (arrivals.length > 4 && shouldRotate) {
    // Ako ima više od 4 dolazna leta i trebamo rotirati, prikazujemo 4 leta s odgovarajućim indeksom
    visibleArrivalFlights = arrivals.slice(visibleArrivals, visibleArrivals + FLIGHTS_PER_PAGE);
  } else {
    // Inače prikazujemo prva 4 leta ili manje ako nema dovoljno
    visibleArrivalFlights = arrivals.slice(0, Math.min(arrivals.length, FLIGHTS_PER_PAGE));
  }

  return (
    <div className="public-schedule-container">
      <div className="public-date-time">
        Trenutno vrijeme:  {formatDateTime(currentDateTime)}
      </div>
      <div className="public-schedule-content">
        <div className="public-departures">
          <h2 className="public-section-title">ODLASCI/DEPARTURES ✈️</h2>
          <div className="table-container">
            <table className="public-flight-table">
              <thead>
                <tr>
                  <th className="narrow-column">BR.</th>
                  <th className="brojleta">LET/FLIGHT</th>
                  <th>AVIOKOMPANIJA/AIRLINES</th>
                  <th className="vrijeme">VRIJEME/TIME</th>
                  <th>ODREDIŠTE/DESTINATION</th>
                  <th>BILJEŠKE/REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {visibleDepartureFlights.map((flight, index) => (
                  <tr key={flight.id} className={`public-flight-row fade-in`}>
                    <td className="narrow-column">{index + 1}</td>
                    <td class="brojleta1">{flight.flight_number}</td>
                    <td>
                      <div className="public-airline-info">
                        <img
                          src={flight.Airline?.logo_url || '/default-logo.png'}
                          alt={flight.Airline?.name}
                          className="public-airline-logo"
                          onError={(e) => {
                            e.target.src = '/default-logo.png';
                          }}
                        />
                        <span>{flight.Airline?.name || 'Nepoznata aviokompanija'}</span>
                      </div>
                    </td>
                    <td class="dolazak1">{formatTimeHoursMinutes(flight.departure_time)}</td>
                    <td class="destination1">{flight.destination}</td>
                    <td class="bilješke1">{flight.remarks || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="public-arrivals">
          <h2 className="public-section-title">DOLASCI/ARRIVALS 🛬</h2>
          <div className="table-container">
            <table className="public-flight-table">
              <thead>
              <tr>
                  <th className="narrow-column">BR.</th>
                  <th className="brojleta">LET/FLIGHT</th>
                  <th>AVIOKOMPANIJA/AIRLINES</th>
                  <th className="vrijeme">VRIJEME/TIME</th>
                  <th>ODREDIŠTE/DESTINATION</th>
                  <th>BILJEŠKE/REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {visibleArrivalFlights.map((flight, index) => (
                  <tr key={flight.id} className={`public-flight-row fade-in`}>
                    <td className="narrow-column">{index + 1}</td>
                    <td class="brojleta1">{flight.flight_number}</td>
                    <td>
                      <div className="public-airline-info">
                        <img
                          src={flight.Airline?.logo_url || '/default-logo.png'}
                          alt={flight.Airline?.name}
                          className="public-airline-logo"
                          onError={(e) => {
                            e.target.src = '/default-logo.png';
                          }}
                        />
                        <span>{flight.Airline?.name || 'Nepoznata aviokompanija'}</span>
                      </div>
                    </td>
                    <td class="dolazak1">{formatTimeHoursMinutes(flight.arrival_time)}</td>
                    <td class="destination1">{flight.destination}</td>
                    <td class="bilješke1">{flight.remarks || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDailySchedulePage;
