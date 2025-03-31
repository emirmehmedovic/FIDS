// frontend/src/components/MonthlySchedule.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MonthlySchedule.css';
import { useAuth } from './AuthProvider';
import config from '../config';

function MonthlySchedule() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [flight, setFlight] = useState({
    airline_id: '',
    flight_number: '',
    departure_time: '',
    arrival_time: '',
    destination: '',
    is_departure: true,
  });

  const [weeklySchedule, setWeeklySchedule] = useState([
    { day_of_week: 'Monday', flights: [] },
    { day_of_week: 'Tuesday', flights: [] },
    { day_of_week: 'Wednesday', flights: [] },
    { day_of_week: 'Thursday', flights: [] },
    { day_of_week: 'Friday', flights: [] },
    { day_of_week: 'Saturday', flights: [] },
    { day_of_week: 'Sunday', flights: [] },
  ]);

  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [flightNumbers, setFlightNumbers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(7); // Broj dana po stranici

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFlight(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      setError('Morate biti prijavljeni da biste dodali let');
      return;
    }
    
    try {
      // Create a copy of the flight data to manipulate
      const adjustedFlight = {...flight};
      
      // Adjust the departure/arrival time based on type of flight
      if (adjustedFlight.is_departure && adjustedFlight.departure_time) {
        // For departure flights, adjust the departure time
        const departureDate = new Date(adjustedFlight.departure_time + 'Z');
        // Subtract 1 hour to compensate for timezone shift
        departureDate.setHours(departureDate.getHours() - 1);
        adjustedFlight.departure_time = departureDate.toISOString();
      } else if (!adjustedFlight.is_departure && adjustedFlight.arrival_time) {
        // For arrival flights, adjust the arrival time
        const arrivalDate = new Date(adjustedFlight.arrival_time + 'Z');
        // Subtract 1 hour to compensate for timezone shift
        arrivalDate.setHours(arrivalDate.getHours() - 1);
        adjustedFlight.arrival_time = arrivalDate.toISOString();
      }
      
      const payload = {
        airline_id: adjustedFlight.airline_id,
        flight_number: adjustedFlight.flight_number,
        departure_time: adjustedFlight.is_departure ? adjustedFlight.departure_time : null,
        arrival_time: !adjustedFlight.is_departure ? adjustedFlight.arrival_time : null,
        destination: adjustedFlight.destination,
        is_departure: adjustedFlight.is_departure,
      };
      
      await axios.post(`${config.apiUrl}/flights`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Let uspješno dodan!');
      fetchFlights();
      setFlight({
        airline_id: '',
        flight_number: '',
        departure_time: '',
        arrival_time: '',
        destination: '',
        is_departure: true,
      });
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 
        ? 'Nemate dozvolu za dodavanje letova' 
        : 'Greška prilikom dodavanja leta.');
    }
  };

  const fetchFlights = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/flights`);
      if (Array.isArray(response.data)) {
        setFlights(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAirlines = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/airlines`);
      setAirlines(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getAirlineData = (airline_id) => {
    const airline = airlines.find(a => a.id.toString() === airline_id.toString());
    return airline || { name: 'Nepoznata aviokompanija', logo_url: '/default-logo.png' };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [flightsRes, airlinesRes, destinationsRes, flightNumbersRes] = await Promise.all([
          axios.get(`${config.apiUrl}/flights`),
          axios.get(`${config.apiUrl}/airlines`),
          axios.get(`${config.apiUrl}/api/destinations`),
          axios.get(`${config.apiUrl}/api/flight-numbers`)
        ]);

        setDestinations(destinationsRes.data || []);
        setFlightNumbers(flightNumbersRes.data || []);
        setFlights(flightsRes.data);
        setAirlines(airlinesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        await Promise.all([fetchFlights(), fetchAirlines()]);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = async (id) => {
    setError('');
    try {
      const updatedFlight = prompt('Unesite ažurirane podatke za let (JSON format):');
      if (!updatedFlight) return;

      const parsedFlight = JSON.parse(updatedFlight);
      const payload = {
        ...parsedFlight,
        departure_time: parsedFlight.is_departure ? parsedFlight.departure_time || null : null,
        arrival_time: !parsedFlight.is_departure ? parsedFlight.arrival_time || null : null,
      };

      await axios.put(`${config.apiUrl}/flights/${id}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Let uspješno ažuriran!');
      fetchFlights();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 
        ? 'Nemate dozvolu za uređivanje letova' 
        : 'Greška prilikom uređivanja leta.');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      if (window.confirm('Jeste li sigurni da želite obrisati ovaj let?')) {
        await axios.delete(`${config.apiUrl}/flights/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert('Let uspješno obrisan!');
        fetchFlights();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 
        ? 'Nemate dozvolu za brisanje letova' 
        : 'Greška prilikom brisanja leta.');
    }
  };
  
  const handleWeeklyChange = (dayIndex, flightIndex, e) => {
    const { name, value } = e.target;
    
    setWeeklySchedule(prev => {
      const newSchedule = JSON.parse(JSON.stringify(prev));
      const flight = newSchedule[dayIndex].flights[flightIndex] || {};

      if (name === 'is_departure') {
        flight[name] = value === 'true';
        flight.departure_time = '';
        flight.arrival_time = '';
      } else {
        flight[name] = value;
      }

      return newSchedule;
    });
  };

  const handleAddFlight = (dayIndex) => {
    setWeeklySchedule(prev => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].flights.push({
        airline_id: '',
        flight_number: '',
        departure_time: '',
        arrival_time: '',
        destination: '',
        is_departure: true,
      });
      return newSchedule;
    });
  };

  const handleRemoveFlight = (dayIndex, flightIndex) => {
    setWeeklySchedule(prev => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].flights.splice(flightIndex, 1);
      return newSchedule;
    });
  };

const handleGenerateMonthlySchedule = async () => {
  setError('');
  if (!user) {
    setError('Morate biti prijavljeni da biste generirali mjesečni raspored');
    return;
  }
  const confirmed = window.confirm(
    'Da li ste sigurni da želite generisati novi mjesečni raspored? Postojeći podaci će biti zamijenjeni.'
  );

  if (!confirmed) return;
  try {
    const filteredWeeklySchedule = weeklySchedule.map(day => ({
      ...day,
      flights: day.flights
        .filter(f => f.airline_id && f.flight_number && f.destination && (f.departure_time || f.arrival_time))
        .map(flight => {
          // Create a copy to avoid modifying the original
          const processedFlight = {...flight};
          
          // Pre-adjust times to compensate for the 1-hour shift
          if (processedFlight.departure_time) {
            const [hours, minutes] = processedFlight.departure_time.split(':');
            // Subtract 1 hour to compensate for the timezone difference
            let adjustedHours = parseInt(hours) - 1;
            if (adjustedHours < 0) adjustedHours += 24;
            processedFlight.departure_time = `${String(adjustedHours).padStart(2, '0')}:${minutes}`;
          }
          
          if (processedFlight.arrival_time) {
            const [hours, minutes] = processedFlight.arrival_time.split(':');
            // Subtract 1 hour
            let adjustedHours = parseInt(hours) - 1;
            if (adjustedHours < 0) adjustedHours += 24;
            processedFlight.arrival_time = `${String(adjustedHours).padStart(2, '0')}:${minutes}`;
          }
          
          return processedFlight;
        })
    }));

    await axios.post(`${config.apiUrl}/flights/generate-monthly-schedule`, filteredWeeklySchedule, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    alert('Mjesečni raspored uspješno generiran!');
    fetchFlights();
  } catch (err) {
    console.error(err);
    setError(err.response?.status === 401 
      ? 'Nemate dozvolu za generiranje rasporeda' 
      : 'Greška prilikom generiranja rasporeda.');
  }
};
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const days = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];
    return `${day}.${month}.${year} (${days[date.getDay()]})`;
  };

  if (loading) return <h2>Učitavanje letova...</h2>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Raspored Letova</h1>

      <h2>Dodaj let</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="mb-inline">
        <div className="form-group">
          <label>Aviokompanija:</label>
          <select
            name="airline_id"
            value={flight.airline_id}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Odaberite aviokompaniju</option>
            {airlines.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
  <label>Broj Leta:</label>
  <select
    name="flight_number"
    value={flight.flight_number}
    onChange={handleChange}
    className="form-control"
    required
  >
    <option value="">Odaberite broj leta</option>
    {flightNumbers.map(fn => (
      <option key={fn.number} value={fn.number}>
        {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})-{fn.number} 
      </option>
    ))}
  </select>
</div>

        <div className="form-group">
          <label>Tip Leta:</label>
          <div>
            <input
              type="radio"
              name="is_departure"
              value="true"
              checked={flight.is_departure === true}
              onChange={() => setFlight(prev => ({ ...prev, is_departure: true, arrival_time: '' }))}
              className="mr-2"
              required
            />
            Odlazni
          </div>
          <div>
            <input
              type="radio"
              name="is_departure"
              value="false"
              checked={flight.is_departure === false}
              onChange={() => setFlight(prev => ({ ...prev, is_departure: false, departure_time: '' }))}
              className="mr-2"
              required
            />
            Dolazni
          </div>
        </div>

        {flight.is_departure ? (
          <div className="form-group">
            <label>Vrijeme polaska:</label>
            <input
              type="datetime-local"
              name="departure_time"
              value={flight.departure_time}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Vrijeme dolaska:</label>
            <input
              type="datetime-local"
              name="arrival_time"
              value={flight.arrival_time}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Destinacija:</label>
          <select
            name="destination"
            value={flight.destination}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Odaberite destinaciju</option>
            {destinations.map(d => (
              <option key={d.id} value={`${d.name} (${d.code})`}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={!user}>Dodaj Let</button>
      </form>

      <button
        className="btn btn-info mb-4"
        onClick={() => setShowScheduleForm(!showScheduleForm)}
      >
        {showScheduleForm ? 'Sakrij formu za raspored' : 'Prikaži formu za raspored'}
      </button>

      {showScheduleForm && (
        <>
          <h2>Generiši raspored za trenutni mjesec</h2>
          {weeklySchedule.map((day, dayIndex) => (
            <div key={day.day_of_week} className="card mb-10">
              <div className="card-header1">
                <h3>{day.day_of_week}</h3>
              </div>
              <div className="card-body1">
                {day.flights.map((flight, flightIndex) => (
                  <div key={`${day.day_of_week}-flight-${flightIndex}`} className="mb-3">
                    <div className="inline-form">
                      <div className="form-group1">
                        <label>Aviokompanija:</label>
                        <select
                          name="airline_id"
                          value={flight.airline_id || ''}
                          onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                          className="form-control1"
                          required
                        >
                          <option value="">Odaberite aviokompaniju</option>
                          {airlines.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group1">
  <label>Broj Leta:</label>
  <select
    name="flight_number"
    value={flight.flight_number}
    onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
    className="form-control"
    required
  >
    <option value="">Odaberite broj leta</option>
    {flightNumbers.map(fn => (
      <option key={fn.number} value={fn.number}>
       {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})- {fn.number} 
      </option>
    ))}
  </select>
</div>

                      <div className="form-group1">
                        <label>Tip Leta:</label>
                        <div className="radio-group">
                          <div>
                            <input
                              type="radio"
                              name="is_departure"
                              value="true"
                              checked={flight.is_departure === true}
                              onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                              className="mr-21"
                              required
                            />
                            Odlazni
                          </div>
                          <div>
                            <input
                              type="radio"
                              name="is_departure"
                              value="false"
                              checked={flight.is_departure === false}
                              onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                              className="mr-21"
                              required
                            />
                            Dolazni
                          </div>
                        </div>
                      </div>

                      {flight.is_departure ? (
                        <div className="form-group1">
                          <label>Vrijeme polaska:</label>
                          <input
                            type="time"
                            name="departure_time"
                            value={flight.departure_time || ''}
                            onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                            className="form-control1"
                            required
                          />
                        </div>
                      ) : (
                        <div className="form-group1">
                          <label>Vrijeme dolaska:</label>
                          <input
                            type="time"
                            name="arrival_time"
                            value={flight.arrival_time || ''}
                            onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                            className="form-control1"
                            required
                          />
                        </div>
                      )}

                      <div className="form-group1">
                        <label>Destinacija:</label>
                        <select
                          name="destination"
                          value={flight.destination}
                          onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                          className="form-control"
                          required
                        >
                          <option value="">Odaberite destinaciju</option>
                          {destinations.map(d => (
                            <option key={d.id} value={`${d.name} (${d.code})`}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveFlight(dayIndex, flightIndex)}
                        className="btn btn-danger1"
                      >
                        Obriši Let
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => handleAddFlight(dayIndex)}
                  className="btn btn-secondary1"
                >
                  Dodaj Let
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={handleGenerateMonthlySchedule}
            className="btn btn-success mb-4"
          >
            Generši mjesečni raspored
          </button>
          <button
        className="btn btn-info mb-4"
        onClick={() => setShowScheduleForm(!showScheduleForm)}
      >
        {showScheduleForm ? 'Sakrij formu za raspored' : 'Prikaži formu za raspored'}
      </button>
        </>
        
      )}

<h2>Mjesečni Raspored</h2>
{flights.length > 0 ? (
  <>
    <div className="pagination-controls mb-3 d-flex justify-content-center align-items-center">
      <button 
        className="btn btn-secondary me-2"
        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
      >
        &laquo; Prethodna
      </button>
      
      <span className="mx-2">
        Stranica {currentPage} od {Math.ceil(Object.entries(
          flights.reduce((acc, curr) => {
            const date = new Date(curr.departure_time || curr.arrival_time);
            const formattedDate = date.toISOString().split('T')[0];

            if (!acc[formattedDate]) {
              acc[formattedDate] = {
                date: formattedDate,
                departureFlights: [],
                arrivalFlights: [],
              };
            }

            curr.is_departure 
              ? acc[formattedDate].departureFlights.push(curr)
              : acc[formattedDate].arrivalFlights.push(curr);

            return acc;
          }, {})
        ).length / itemsPerPage)}
      </span>
      <button 
        className="btn btn-secondary ms-2"
        onClick={() => setCurrentPage(p => p + 1)}
        disabled={currentPage * itemsPerPage >= Object.entries(
          flights.reduce((acc, curr) => {
            const date = new Date(curr.departure_time || curr.arrival_time);
            const formattedDate = date.toISOString().split('T')[0];

            if (!acc[formattedDate]) {
              acc[formattedDate] = {
                date: formattedDate,
                departureFlights: [],
                arrivalFlights: [],
              };
            }

            curr.is_departure 
              ? acc[formattedDate].departureFlights.push(curr)
              : acc[formattedDate].arrivalFlights.push(curr);

            return acc;
          }, {})
        ).length}
      >
        Sljedeća &raquo;
      </button>
    </div>
    {Object.entries(
      flights.reduce((acc, curr) => {
        const date = new Date(curr.departure_time || curr.arrival_time);
        const formattedDate = date.toISOString().split('T')[0];

        if (!acc[formattedDate]) {
          acc[formattedDate] = {
            date: formattedDate,
            departureFlights: [],
            arrivalFlights: [],
          };
        }

        curr.is_departure 
          ? acc[formattedDate].departureFlights.push(curr)
          : acc[formattedDate].arrivalFlights.push(curr);

        return acc;
      }, {})
    )
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map(([date, { departureFlights, arrivalFlights }], index) => (
        <div key={index} className="card mb-4">
          <div className="card-header">
            <h2>{formatDate(date)}</h2>
          </div>
          <div className="card-body">
            <h3 className="text-center">ODLASCI/DEPARTURES</h3>
            {departureFlights.length > 0 && (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Aviokompanija</th>
                    <th>Broj Leta</th>
                    <th>Polazak</th>
                    <th>Odredište</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {departureFlights
                    .sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time))
                    .map(f => {
                      const airlineData = getAirlineData(f.airline_id);
                      return (
                        <tr key={f.id}>
                          <td>
                            {/* Construct full URL using backend base URL and relative path */}
                            {airlineData.logo_url && airlineData.logo_url.startsWith('/uploads/') ? (
                              <img
                                src={`${config.apiUrl}${airlineData.logo_url}`}
                                alt={airlineData.name}
                                className="img-fluid" // Keep img-fluid for responsiveness if needed, but override size
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                                onError={(e) => {
                                  e.target.onerror = null; // Prevent infinite loop
                                  e.target.src = 'https://via.placeholder.com/90x60?text=No+Logo'; // Placeholder
                                  e.target.alt = 'Logo nije dostupan';
                                }}
                              />
                            ) : airlineData.logo_url ? ( // Handle potential old absolute URLs if any exist
                              <img
                                src={airlineData.logo_url}
                                alt={airlineData.name}
                                className="img-fluid" // Keep img-fluid
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/90x60?text=Error';
                                  e.target.alt = 'Greška pri učitavanju loga';
                                }}
                              />
                            ) : (
                              <img
                                src={'https://via.placeholder.com/90x60?text=No+Logo'} // Placeholder if no logo_url
                                alt={airlineData.name}
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                              />
                            )}
                            <span className="ml-2">{airlineData.name}</span>
                          </td>
                          <td>{f.flight_number}</td>
                          <td>{new Date(f.departure_time).toLocaleTimeString('bs-BA', { 
                            timeZone: 'Europe/Sarajevo' 
                          })}</td>
                          <td>{f.destination}</td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm mr-2"
                              onClick={() => handleEdit(f.id)}
                            >
                              Uredi
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(f.id)}
                            >
                              Obriši
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            <h3 className="text-center">DOLASCI/ARRIVALS</h3>
            {arrivalFlights.length > 0 && (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Aviokompanija</th>
                    <th>Broj Leta</th>
                    <th>Vrijeme dolaska</th>
                    <th>Porijeklo</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {arrivalFlights
                    .sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time))
                    .map(f => {
                      const airlineData = getAirlineData(f.airline_id);
                      return (
                        <tr key={f.id}>
                          <td>
                            {/* Construct full URL using backend base URL and relative path */}
                            {airlineData.logo_url && airlineData.logo_url.startsWith('/uploads/') ? (
                              <img
                                src={`${config.apiUrl}${airlineData.logo_url}`}
                                alt={airlineData.name}
                                className="img-fluid" // Keep img-fluid
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                                onError={(e) => {
                                  e.target.onerror = null; // Prevent infinite loop
                                  e.target.src = 'https://via.placeholder.com/90x60?text=No+Logo'; // Placeholder
                                  e.target.alt = 'Logo nije dostupan';
                                }}
                              />
                            ) : airlineData.logo_url ? ( // Handle potential old absolute URLs if any exist
                              <img
                                src={airlineData.logo_url}
                                alt={airlineData.name}
                                className="img-fluid" // Keep img-fluid
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/90x60?text=Error';
                                  e.target.alt = 'Greška pri učitavanju loga';
                                }}
                              />
                            ) : (
                              <img
                                src={'https://via.placeholder.com/90x60?text=No+Logo'} // Placeholder if no logo_url
                                alt={airlineData.name}
                                style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '15px' }} // Standardized style
                              />
                            )}
                            <span className="ml-2">{airlineData.name}</span>
                          </td>
                          <td>{f.flight_number}</td>
                          <td>{new Date(f.arrival_time).toLocaleTimeString('bs-BA', { 
                            timeZone: 'Europe/Sarajevo' 
                          })}</td>
                          <td>{f.destination}</td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm mr-2"
                              onClick={() => handleEdit(f.id)}
                            >
                              Uredi
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(f.id)}
                            >
                              Obriši
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
  </>
) : (
  <p>Nema letova u rasporedu.</p>
)}
    </div>
  );
}

export default MonthlySchedule;
