import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from './AuthProvider';
import './DailySchedule.css';
import config from '../config';

const DailySchedule = () => {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempRemarks, setTempRemarks] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { user } = useAuth(); // Dodano za provjeru autentikacije

  // Dohvati dnevne letove
  useEffect(() => {
    const fetchDailyFlights = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/flights/daily/schedule`);
        if (Array.isArray(response.data)) {
          setFlights(response.data.map(flight => ({
            ...flight,
            remarks: flight.remarks || '',
          })));
        } else {
          setError('Podaci o letovima nisu u očekivanom formatu.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyFlights();
  }, []);

  // Dohvati aviokompanije
  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/airlines`);
        setAirlines(response.data);
      } catch (err) {
        console.error('Greška pri dohvaćanju aviokompanija:', err);
      }
    };
    fetchAirlines();
  }, []);

  // Ažuriraj trenutni datum i vrijeme svake sekunde
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sačuvaj napomenu
  const handleSaveRemarks = async (flightId) => {
    try {
      if (!user) {
        setError('Niste prijavljeni!');
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Token iz localStorage:', token);
      
      if (!token) {
        setError('Niste prijavljeni! Token nije pronađen.');
        return;
      }
  
      await axios.put(
        `${config.apiUrl}/api/flights/${flightId}/remarks`,
        { remarks: tempRemarks[flightId] || '' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Ažurirajte stanje nakon uspjeha
      setFlights(prev => prev.map(f => f.id === flightId ? { ...f, remarks: tempRemarks[flightId] } : f));
      setEditingId(null);
      setError(null); // Očisti prethodne greške
    } catch (err) {
      console.error('Detalji greške:', err.response?.data);
      setError('Greška pri spremanju napomene: ' + (err.response?.data?.message || err.message));
    }
  };

  // Razdvajanje letova
  const departures = flights.filter((flight) => flight.is_departure);
  const arrivals = flights.filter((flight) => !flight.is_departure);

  // Formatiranje datuma i vremena
  const formatDate = (date) => {
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dayOfWeek = days[date.getDay()];
    return `${day}.${month}.${year} (${dayOfWeek})`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Pronalaženje podataka o aviokompaniji prema ID-u
  const getAirlineData = (airlineId) => {
    if (!Array.isArray(airlines)) return { name: 'Nepoznata aviokompanija', logo_url: '/default-logo.png' };
    return airlines.find((airline) => airline.id === airlineId) || { name: 'Nepoznata aviokompanija', logo_url: '/default-logo.png' };
  };
  
  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

  return (
    <div className="container mt-5">
      <h3>{formatDate(currentDateTime)}</h3>
      <h4>{formatTime(currentDateTime)}</h4>
      <h2 className="mb-4">Dnevni raspored letova</h2>
      <div className="mb-4">
      
      </div>

      <FlightTable
        flights={departures}
        title="Odlazni letovi ✈️"
        editingId={editingId}
        tempRemarks={tempRemarks}
        setTempRemarks={setTempRemarks}
        setEditingId={setEditingId}
        handleSave={handleSaveRemarks}
        getAirlineData={getAirlineData}
        isAuthenticated={!!user}
      />

      <FlightTable
        flights={arrivals}
        title="Dolazni letovi 🛬"
        editingId={editingId}
        tempRemarks={tempRemarks}
        setTempRemarks={setTempRemarks}
        setEditingId={setEditingId}
        handleSave={handleSaveRemarks}
        getAirlineData={getAirlineData}
        isAuthenticated={!!user}
      />
    </div>
  );
};

const FlightTable = ({ 
  flights, 
  title, 
  editingId, 
  tempRemarks, 
  setTempRemarks, 
  setEditingId, 
  handleSave, 
  getAirlineData,
  isAuthenticated 
}) => {
  if (flights.length === 0) {
    return (
      <Alert variant="info" className="mt-4">
        {`Nema ${title.toLowerCase().includes('odlazni') ? 'odlaznih' : 'dolaznih'} letova.`}
      </Alert>
    );
  }

  return (
    <>
      <h4 className="mt-5 mb-3 text-primary">{title}</h4>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Let</th>
            <th>Aviokompanija</th>
            <th>Vrijeme</th>
            <th>Destinacija</th>
            <th>Napomene</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((flight, index) => {
            const airlineData = getAirlineData(flight.airline_id);
            return (
              <tr key={flight.id}>
                <td>{index + 1}</td>
                <td>{flight.flight_number}</td>
                <td>
                  <div className="d-flex align-items-center">
                    {/* Construct full URL using backend base URL and relative path */}
                    {airlineData.logo_url && airlineData.logo_url.startsWith('/uploads/') ? (
                      <img
                        src={`${config.apiUrl}${airlineData.logo_url}`}
                        alt={airlineData.name}
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = 'https://via.placeholder.com/80x40?text=No+Logo'; // Placeholder
                          e.target.alt = 'Logo nije dostupan';
                        }}
                        style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px', marginRight: '10px' }} // Standardized style
                      />
                    ) : airlineData.logo_url ? ( // Handle potential old absolute URLs if any exist
                      <img
                        src={airlineData.logo_url}
                        alt={airlineData.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/80x40?text=Error';
                          e.target.alt = 'Greška pri učitavanju loga';
                        }}
                        style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px', marginRight: '10px' }} // Standardized style
                      />
                    ) : (
                      <img
                        src={'https://via.placeholder.com/90x60?text=No+Logo'} // Placeholder if no logo_url
                        alt={airlineData.name}
                        style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px', marginRight: '10px' }} // Standardized style
                      />
                    )}
                    {airlineData.name}
                  </div>
                </td>
                <td>
                  {flight.is_departure
                    ? new Date(flight.departure_time).toLocaleTimeString()
                    : new Date(flight.arrival_time).toLocaleTimeString()}
                </td>
                <td>{flight.destination}</td>
                <td>
                  {editingId === flight.id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={tempRemarks[flight.id] || ''}
                      onChange={(e) => {
                        setTempRemarks((prev) => ({ ...prev, [flight.id]: e.target.value }));
                      }}
                      placeholder="Unesite napomenu..."
                    />
                  ) : (
                    <span>{flight.remarks || 'Nema napomena'}</span>
                  )}
                </td>
                <td>
                  {!isAuthenticated ? (
                    <span className="text-muted">Prijavite se za uređivanje</span>
                  ) : editingId === flight.id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSave(flight.id)}
                      disabled={tempRemarks[flight.id] === flight.remarks}
                    >
                      Sačuvaj
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(flight.id);
                        setTempRemarks((prev) => ({ ...prev, [flight.id]: flight.remarks }));
                      }}
                    >
                      Uredi
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
};

export default DailySchedule;
