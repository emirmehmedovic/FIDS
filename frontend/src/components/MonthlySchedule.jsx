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
  const [editingFlight, setEditingFlight] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Dodajemo state za izbor mjeseca i godine za generisanje rasporeda
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Dodajemo state za filtriranje prikaza letova po mjesecu, godini i datumu
  // Postavljamo po defaultu na tekući mjesec i godinu
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1); // 1-12 (tekući mjesec)
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterDate, setFilterDate] = useState(""); // Prazan string znači da nema filtriranja po datumu
  
  // Resetujemo paginaciju kada se promijeni filter
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear, filterDate]);
  
  // Resetujemo poruke o uspjehu/grešci nakon 5 sekundi
  useEffect(() => {
    if (deleteSuccess || deleteError) {
      const timer = setTimeout(() => {
        setDeleteSuccess(false);
        setDeleteError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess, deleteError]);
  
  // Pomoćna funkcija za filtriranje letova po mjesecu, godini i datumu
  const filterFlightsByMonthAndYear = (flights) => {
    // Ako je odabran specifičan datum, filtriraj po datumu
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      // Postavi vrijeme na početak dana
      selectedDate.setHours(0, 0, 0, 0);
      
      return flights.filter(flight => {
        const flightDate = new Date(flight.departure_time || flight.arrival_time);
        // Postavi vrijeme na početak dana za poređenje samo datuma
        const flightDateOnly = new Date(flightDate.getFullYear(), flightDate.getMonth(), flightDate.getDate());
        return flightDateOnly.getTime() === selectedDate.getTime();
      });
    }
    
    // Inače, filtriraj po mjesecu i godini
    if (filterMonth === 0) return flights; // Prikaži sve letove ako nije odabran specifičan mjesec
    
    return flights.filter(flight => {
      const date = new Date(flight.departure_time || flight.arrival_time);
      const flightMonth = date.getMonth() + 1; // getMonth() vraća 0-11
      const flightYear = date.getFullYear();
      
      return flightMonth === filterMonth && flightYear === filterYear;
    });
  };

  // Pomoćna funkcija za grupiranje letova po datumima
  const groupFlightsByDate = (flights) => {
    return flights.reduce((acc, curr) => {
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
    }, {});
  };

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
      // Let the backend handle timezone conversion. Send the local time string as is.
      // The backend should parse this assuming it's local time and store as UTC.
      // NOTE: Ensure the backend API expects and handles this correctly.
      // For datetime-local input, the browser provides a string like 'YYYY-MM-DDTHH:mm'
      
      // Convert local datetime string to UTC ISO string before sending
      const convertToUTC = (localDateTimeString) => {
        if (!localDateTimeString) return null;
        // Create Date object (browser interprets datetime-local as local time)
        const localDate = new Date(localDateTimeString); 
        // Check for invalid date
        if (isNaN(localDate.getTime())) {
          console.error("Invalid date string provided:", localDateTimeString);
          return null; // Or handle error appropriately
        }
        // Return UTC ISO string
        return localDate.toISOString(); 
      };

      // Find the selected destination object to get its ID
      const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === flight.destination);
      if (!selectedDestination) {
        setError('Odabrana destinacija nije validna.');
        return;
      }

      const payload = {
        airline_id: flight.airline_id, 
        flight_number: flight.flight_number,
        departure_time: flight.is_departure ? convertToUTC(flight.departure_time) : null, 
        arrival_time: !flight.is_departure ? convertToUTC(flight.arrival_time) : null,
        destination_id: selectedDestination.id, // Send destination_id instead of destination string
        is_departure: flight.is_departure,
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
          axios.get(`${config.apiUrl}/destinations`),
          axios.get(`${config.apiUrl}/flight-numbers`)
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

  const handleEdit = (flight) => {
    setError('');
    
    // Create a properly formatted local datetime string for the form
    let formattedFlight = {
      ...flight,
      destination: flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : ''
    };
    
    // Format the time values to local timezone properly
    if (flight.departure_time) {
      // Create a date object from the UTC time
      const date = new Date(flight.departure_time);
      
      // Create a local ISO string (YYYY-MM-DDTHH:MM)
      // This correctly adjusts for the browser's local timezone
      const localISOString = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      ).toISOString().slice(0, 16);
      
      formattedFlight.departure_time = localISOString;
    }
    
    if (flight.arrival_time) {
      // Create a date object from the UTC time
      const date = new Date(flight.arrival_time);
      
      // Create a local ISO string (YYYY-MM-DDTHH:MM)
      // This correctly adjusts for the browser's local timezone
      const localISOString = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      ).toISOString().slice(0, 16);
      
      formattedFlight.arrival_time = localISOString;
    }
    
    setEditingFlight(formattedFlight);
  };

  const handleCancelEdit = () => {
    setEditingFlight(null);
    setError('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingFlight(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveEdit = async () => {
    setError('');
    try {
      if (!user) {
        setError('Morate biti prijavljeni da biste uredili let');
        return;
      }

      // Find the selected destination object to get its ID
      const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === editingFlight.destination);
      if (!selectedDestination) {
        setError('Odabrana destinacija nije validna.');
        return;
      }

      // Convert local datetime string to UTC ISO string before sending
      const convertToUTC = (localDateTimeString) => {
        if (!localDateTimeString) return null;
        // Create Date object (browser interprets datetime-local as local time)
        const localDate = new Date(localDateTimeString); 
        // Check for invalid date
        if (isNaN(localDate.getTime())) {
          console.error("Invalid date string provided:", localDateTimeString);
          return null; // Or handle error appropriately
        }
        // Return UTC ISO string
        return localDate.toISOString(); 
      };

      const payload = {
        airline_id: editingFlight.airline_id,
        flight_number: editingFlight.flight_number,
        destination_id: selectedDestination.id,
        is_departure: editingFlight.is_departure,
      };

      if (editingFlight.is_departure) {
        payload.departure_time = convertToUTC(editingFlight.departure_time);
        payload.arrival_time = null;
      } else {
        payload.arrival_time = convertToUTC(editingFlight.arrival_time);
        payload.departure_time = null;
      }

      await axios.put(`${config.apiUrl}/flights/${editingFlight.id}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      alert('Let uspješno ažuriran!');
      fetchFlights();
      setEditingFlight(null);
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
  
  // Funkcija za brisanje mjesečnog rasporeda
  const handleDeleteMonthlySchedule = async () => {
    // Potvrda brisanja
    if (!window.confirm(`Jeste li sigurni da želite obrisati sve letove za ${filterMonth}/${filterYear}?`)) return;
    
    setDeleteLoading(true);
    setDeleteSuccess(false);
    setDeleteError('');
    
    try {
      const response = await axios.delete(`${config.apiUrl}/flights/monthly-schedule/${filterYear}/${filterMonth}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      // Osvježi listu letova nakon brisanja
      await fetchFlights();
      
      setDeleteSuccess(true);
      alert(`Uspješno obrisano ${response.data.deletedCount} letova za ${filterMonth}/${filterYear}`);
    } catch (err) {
      console.error('Greška prilikom brisanja mjesečnog rasporeda:', err);
      setDeleteError('Greška prilikom brisanja mjesečnog rasporeda');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWeeklyChange = (dayIndex, flightIndex, e) => {
    const { name, value, type, checked } = e.target;
    
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

// Helper function to convert local HH:mm time to UTC HH:mm string
const convertLocalTimeToUTC_HHMM = (localTimeHHMM) => {
  if (!localTimeHHMM || !/^\d{2}:\d{2}$/.test(localTimeHHMM)) {
    console.warn("Invalid or empty time provided to convertLocalTimeToUTC_HHMM:", localTimeHHMM);
    return null; // Return null or handle appropriately if time is invalid/missing
  }
  const [hours, minutes] = localTimeHHMM.split(':').map(Number);
  
  // Create a date object for today in the local timezone and set the time
  const localDate = new Date(); 
  localDate.setHours(hours, minutes, 0, 0); // Set local hours and minutes

  // Get the UTC hours and minutes
  const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  
  return `${utcHours}:${utcMinutes}`;
};

// Fix the timezone offset issue by sending the time with an explicit timezone offset
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

  // Helper to convert HH:MM local time to a full UTC ISO string using the target month/year
  const convertLocalHHMMToUTCISO = (localTimeHHMM, dayOfWeek) => {
    if (!localTimeHHMM || !/^\d{2}:\d{2}$/.test(localTimeHHMM)) {
      console.warn("Invalid or empty time provided:", localTimeHHMM);
      return null;
    }
    const [hours, minutes] = localTimeHHMM.split(':').map(Number);
    
    // Mapiranje dana u sedmici na brojeve (0 = nedjelja, 1 = ponedjeljak, itd.)
    const dayMapping = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    
    // VAŽNO: Koristimo odabrani mjesec i godinu za generisanje datuma
    // Napomena: mjeseci u JavaScript Date objektu idu od 0-11, zato oduzimamo 1
    const year = selectedYear;
    const month = selectedMonth - 1;
    
    // Pronalazimo prvi dan u mjesecu koji odgovara traženom danu u sedmici
    const firstDayOfMonth = new Date(year, month, 1);
    let dayOfMonth = 1;
    
    // Ako prvi dan mjeseca nije traženi dan u sedmici, pomjeramo se naprijed do prvog takvog dana
    if (firstDayOfMonth.getDay() !== dayMapping[dayOfWeek]) {
      // Računamo koliko dana trebamo dodati da bismo došli do traženog dana u sedmici
      const daysToAdd = (dayMapping[dayOfWeek] - firstDayOfMonth.getDay() + 7) % 7;
      dayOfMonth += daysToAdd;
    }
    
    // Kreiramo datum s odgovarajućim danom u mjesecu
    const localDate = new Date(year, month, dayOfMonth);
    localDate.setHours(hours, minutes, 0, 0); // Set local time

    if (isNaN(localDate.getTime())) {
        console.error("Failed to create valid date from time:", localTimeHHMM);
        return null;
    }
    
    console.log(`Konvertovano vrijeme ${localTimeHHMM} za dan ${dayOfWeek} u mjesecu ${selectedMonth} u: ${localDate.toISOString()}`);
    return localDate.toISOString(); // Convert to UTC ISO string
  };


  try {
    const filteredWeeklySchedule = weeklySchedule.map(day => ({
      ...day,
      flights: day.flights
        .filter(f => f.airline_id && f.flight_number && f.destination && (f.departure_time || f.arrival_time))
        .map(flight => {
          // Create a copy of the flight
          const adjustedFlight = { ...flight };

          // Find the selected destination object to get its ID
          const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === flight.destination);
          if (!selectedDestination) {
            console.warn("Skipping flight due to invalid destination:", flight);
            return null; // Mark for removal if destination not found
          }

          // Add destination_id to the flight data
          adjustedFlight.destination_id = selectedDestination.id;
          delete adjustedFlight.destination; // Remove original destination string

          // Convert HH:MM time to full UTC ISO string
          if (adjustedFlight.is_departure) {
            const utcTime = convertLocalHHMMToUTCISO(adjustedFlight.departure_time, day.day_of_week);
            if (!utcTime) {
                console.warn("Skipping departure flight due to invalid time:", flight);
                return null;
            }
            adjustedFlight.departure_time = utcTime;
            adjustedFlight.arrival_time = null; // Ensure arrival time is null for departures
          } else {
            const utcTime = convertLocalHHMMToUTCISO(adjustedFlight.arrival_time, day.day_of_week);
             if (!utcTime) {
                console.warn("Skipping arrival flight due to invalid time:", flight);
                return null;
            }
            adjustedFlight.arrival_time = utcTime;
            adjustedFlight.departure_time = null; // Ensure departure time is null for arrivals
          }

          // Remove flags that are no longer needed
          delete adjustedFlight.departure_time_is_local;
          delete adjustedFlight.arrival_time_is_local;

          return adjustedFlight;
        })
        .filter(f => f !== null) // Remove flights marked as null
    }));

    // Uključujemo odabrani mjesec i godinu u payload
    // NAPOMENA: Backend očekuje mjesece počevši od 0 (0=januar, 1=februar, itd.)
    // dok u frontendu koristimo mjesece od 1-12, zato oduzimamo 1
    const payload = {
      weeklySchedule: filteredWeeklySchedule,
      targetMonth: selectedMonth - 1, // Oduzimamo 1 jer backend očekuje mjesece od 0-11
      targetYear: selectedYear
    };

    await axios.post(`${config.apiUrl}/flights/generate-monthly-schedule`, payload, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    alert('Mjesečni raspored uspješno generiran!');
    
    fetchFlights();
    
    // Automatski postavimo filter na mjesec i godinu za koji smo generisali raspored
    setFilterMonth(selectedMonth);
    setFilterYear(selectedYear);
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

        <div className="form-group flight-number-group"> {/* Added flight-number-group class */}
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
          <div className="flight-type-selector">
            <button
              type="button"
              className={`flight-type-btn flight-type-btn--departure ${flight.is_departure === true ? 'flight-type-btn--selected' : ''}`}
              onClick={() => setFlight(prev => ({ ...prev, is_departure: true, arrival_time: '' }))}
            >
              <i className="bi bi-box-arrow-up-right me-1"></i> Odlazni
            </button>
            <button
              type="button"
              className={`flight-type-btn flight-type-btn--arrival ${flight.is_departure === false ? 'flight-type-btn--selected' : ''}`}
              onClick={() => setFlight(prev => ({ ...prev, is_departure: false, departure_time: '' }))}
            >
              <i className="bi bi-box-arrow-in-down-right me-1"></i> Dolazni
            </button>
          </div>
        </div>

        {/* Corrected Conditional rendering with highlighting */}
        {flight.is_departure ? (
          <div className="form-group active-time-input">
            <label style={{ color: '#28a745', fontWeight: 'bold' }}>Polazak:</label> {/* Green for Departure */}
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
          <div className="form-group active-time-input">
            <label style={{ color: '#ffc107', fontWeight: 'bold' }}>Dolazak:</label> {/* Yellow for Arrival */}
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

        <button type="submit" className="btn btn-primary" disabled={!user}>Dodaj</button>
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
                        <div className="flight-type-selector">
                          <button
                            type="button"
                            className={`flight-type-btn flight-type-btn--departure ${flight.is_departure === true ? 'flight-type-btn--selected' : ''}`}
                            onClick={() => handleWeeklyChange(dayIndex, flightIndex, { target: { name: 'is_departure', value: 'true' } })}
                          >
                            <i className="bi bi-box-arrow-up-right me-1"></i> Odlazni
                          </button>
                          <button
                            type="button"
                            className={`flight-type-btn flight-type-btn--arrival ${flight.is_departure === false ? 'flight-type-btn--selected' : ''}`}
                            onClick={() => handleWeeklyChange(dayIndex, flightIndex, { target: { name: 'is_departure', value: 'false' } })}
                          >
                            <i className="bi bi-box-arrow-in-down-right me-1"></i> Dolazni
                          </button>
                        </div>
                      </div>

                      {/* Corrected Conditional rendering for weekly form */}
                      {flight.is_departure ? (
                        <div className="form-group1 active-time-input">
                          <label style={{ color: '#28a745', fontWeight: 'bold' }}>Polazak:</label> {/* Green for Departure */}
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
                        <div className="form-group1 active-time-input">
                          <label style={{ color: '#ffc107', fontWeight: 'bold' }}>Dolazak:</label> {/* Yellow for Arrival */}
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
                        Obriši
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
          <div className="d-flex align-items-center mb-4">
            <div className="me-3">
              <label htmlFor="monthSelect" className="me-2">Mjesec:</label>
              <select 
                id="monthSelect" 
                className="form-select form-select-sm" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                <option value="1">Januar</option>
                <option value="2">Februar</option>
                <option value="3">Mart</option>
                <option value="4">April</option>
                <option value="5">Maj</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">August</option>
                <option value="9">Septembar</option>
                <option value="10">Oktobar</option>
                <option value="11">Novembar</option>
                <option value="12">Decembar</option>
              </select>
            </div>
            <div className="me-3">
              <label htmlFor="yearSelect" className="me-2">Godina:</label>
              <select 
                id="yearSelect" 
                className="form-select form-select-sm" 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleGenerateMonthlySchedule}
              className="btn btn-success"
            >
              Generiši mjesečni raspored
            </button>
          </div>
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
    <div className="mb-3">
      <div className="card w-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white"><i className="bi bi-funnel"></i> Filteri za prikaz letova</h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end justify-content-between">
            <div className="d-flex flex-wrap align-items-end">
              <div className="form-group1 me-4 mb-2" style={{ minWidth: '250px' }}>
                <label htmlFor="filterDateSelect" className="text-white">Odaberite datum:</label>
                <div className="d-flex align-items-center">
                  <input
                    type="date"
                    id="filterDateSelect"
                    className="form-control"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      // Ako je odabran datum, resetuj filter po mjesecu
                      if (e.target.value) {
                        setFilterMonth(0);
                      }
                    }}
                    style={{ color: 'white' }}
                  />
                  {filterDate && (
                    <button 
                      className="btn btn-outline-secondary ms-2"
                      onClick={() => setFilterDate("")}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="d-flex flex-wrap me-4">
                <div className="form-group1 me-3 mb-2">
                  <label htmlFor="filterMonthSelect" className="text-white">Mjesec:</label>
                  <select 
                    id="filterMonthSelect" 
                    className="form-control" 
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(parseInt(e.target.value));
                      // Ako je odabran mjesec, resetuj filter po datumu
                      if (parseInt(e.target.value) !== 0) {
                        setFilterDate("");
                      }
                    }}
                    disabled={!!filterDate} // Onemogući ako je odabran datum
                    style={{ color: 'white' }}
                  >
                    <option value="0">Svi mjeseci</option>
                    <option value="1">Januar</option>
                    <option value="2">Februar</option>
                    <option value="3">Mart</option>
                    <option value="4">April</option>
                    <option value="5">Maj</option>
                    <option value="6">Juni</option>
                    <option value="7">Juli</option>
                    <option value="8">August</option>
                    <option value="9">Septembar</option>
                    <option value="10">Oktobar</option>
                    <option value="11">Novembar</option>
                    <option value="12">Decembar</option>
                  </select>
                </div>
                <div className="form-group1 mb-2">
                  <label htmlFor="filterYearSelect" className="text-white">Godina:</label>
                  <select 
                    id="filterYearSelect" 
                    className="form-control" 
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    disabled={!!filterDate} // Onemogući ako je odabran datum
                    style={{ color: 'white' }}
                  >
                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Dodajemo dugme za brisanje mjesečnog rasporeda poravnato desno */}
            {filterMonth !== 0 && !filterDate && user && (
              <div className="mb-2">
                <button 
                  className="btn btn-danger btn-sm py-0 px-2" 
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    // Dodajemo dodatnu potvrdu
                    if (window.confirm(`Da li ste sigurni da želite obrisati sve letove za ${filterMonth}/${filterYear}? Ova akcija se ne može poništiti.`)) {
                      handleDeleteMonthlySchedule();
                    }
                  }}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Brisanje u toku...' : 'Obriši mjesečni raspored'}
                </button>
              </div>
            )}
          </div>
          
          {/* Poruke o uspjehu/grešci */}
          {(deleteSuccess || deleteError) && (
            <div className="mt-2">
              {deleteSuccess && <div className="alert alert-success">Letovi uspješno obrisani!</div>}
              {deleteError && <div className="alert alert-danger">{deleteError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
    
    <div className="pagination-controls mb-3 d-flex justify-content-center">
      <button 
        className="btn btn-secondary me-2"
        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
      >
        &laquo; Prethodna
      </button>
      
      <span className="mx-2 d-flex align-items-center">
        Stranica {currentPage} od {Math.ceil(Object.entries(
          groupFlightsByDate(filterFlightsByMonthAndYear(flights))
        ).length / itemsPerPage)}
      </span>
      <button 
        className="btn btn-secondary ms-2"
        onClick={() => setCurrentPage(p => p + 1)}
        disabled={currentPage * itemsPerPage >= Object.entries(
          groupFlightsByDate(filterFlightsByMonthAndYear(flights))
        ).length}
      >
        Sljedeća &raquo;
      </button>
    </div>
    {Object.entries(
      groupFlightsByDate(filterFlightsByMonthAndYear(flights))
    )
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map(([date, { departureFlights, arrivalFlights }], index) => (
        <div key={index} className="card mb-4">
          <div className="card-header">
            <h2>{formatDate(date)}</h2>
          </div>
          <div className="card-body">
            {/* Replaced icon with SVG from rl.html for Departures */}
            <h3 className="text-center" style={{ backgroundColor: '#0b5ed7', color: 'white', padding: '0.5rem', borderRadius: '5px' }}> {/* Darker Blue 1 */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>ODLASCI/DEPARTURES
            </h3>
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
                          {editingFlight && editingFlight.id === f.id ? (
                            // Edit mode
                            <>
                              <td>
                                <select
                                  name="airline_id"
                                  value={editingFlight.airline_id}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  {airlines.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  name="flight_number"
                                  value={editingFlight.flight_number}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  <option value={editingFlight.flight_number}>{editingFlight.flight_number}</option>
                                  {flightNumbers
                                    .filter(fn => fn.is_departure === true)
                                    .map(fn => (
                                      <option key={fn.number} value={fn.number}>
                                        {fn.destination} (ODLAZNI) - {fn.number}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  name="departure_time"
                                  value={editingFlight.departure_time}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                />
                              </td>
                              <td>
                                <select
                                  name="destination"
                                  value={editingFlight.destination}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  {destinations.map(d => (
                                    <option key={d.id} value={`${d.name} (${d.code})`}>
                                      {d.name} ({d.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <div className="d-flex">
                                  <button
                                    className="btn btn-success btn-sm me-1 py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={handleSaveEdit}
                                  >
                                    Sačuvaj
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={handleCancelEdit}
                                  >
                                    Odustani
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td>
                                {/* Existing airline display code */}
                                <img 
                                    src={`${config.apiUrl}${airlineData?.logo_url || ''}`}
                                    alt={airlineData?.name || 'Airline logo'} 
                                    className="airline-logo-small" 
                                />
                                <span className="ml-2">{airlineData.name}</span>
                              </td>
                              <td>{f.flight_number}</td>
                              <td>{new Date(f.departure_time).toLocaleTimeString('bs-BA', { 
                                timeZone: 'Europe/Sarajevo',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}</td>
                              <td>{f.DestinationInfo ? `${f.DestinationInfo.name} (${f.DestinationInfo.code})` : 'N/A'}</td>
                              <td>
                                <div className="d-flex">
                                  <button
                                    className="btn btn-warning btn-sm me-1 py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleEdit(f)}
                                  >
                                    Uredi
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleDelete(f.id)}
                                  >
                                    Obriši
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            {/* Replaced icon with SVG from rl.html for Arrivals */}
            <h3 className="text-center" style={{ backgroundColor: '#023047', color: 'white', padding: '0.5rem', borderRadius: '5px', marginTop: '1rem' }}> {/* Darker Blue 2 */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(180 12 12)"/>
              </svg>DOLASCI/ARRIVALS
            </h3>
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
                          {editingFlight && editingFlight.id === f.id ? (
                            // Edit mode
                            <>
                              <td>
                                <select
                                  name="airline_id"
                                  value={editingFlight.airline_id}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  {airlines.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  name="flight_number"
                                  value={editingFlight.flight_number}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  <option value={editingFlight.flight_number}>{editingFlight.flight_number}</option>
                                  {flightNumbers
                                    .filter(fn => fn.is_departure === false)
                                    .map(fn => (
                                      <option key={fn.number} value={fn.number}>
                                        {fn.destination} (DOLAZNI) - {fn.number}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  name="arrival_time"
                                  value={editingFlight.arrival_time}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                />
                              </td>
                              <td>
                                <select
                                  name="destination"
                                  value={editingFlight.destination}
                                  onChange={handleEditChange}
                                  className="form-control form-control-sm"
                                  required
                                >
                                  {destinations.map(d => (
                                    <option key={d.id} value={`${d.name} (${d.code})`}>
                                      {d.name} ({d.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <div className="d-flex">
                                  <button
                                    className="btn btn-success btn-sm me-1 py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={handleSaveEdit}
                                  >
                                    Sačuvaj
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={handleCancelEdit}
                                  >
                                    Odustani
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td>
                                {/* Existing airline display code */}
                                <img 
                                    src={`${config.apiUrl}${airlineData?.logo_url || ''}`}
                                    alt={airlineData?.name || 'Airline logo'} 
                                    className="airline-logo-small" 
                                />
                                <span className="ml-2">{airlineData.name}</span>
                              </td>
                              <td>{f.flight_number}</td>
                              <td>{new Date(f.arrival_time).toLocaleTimeString('bs-BA', { 
                                timeZone: 'Europe/Sarajevo',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}</td>
                              <td>{f.DestinationInfo ? `${f.DestinationInfo.name} (${f.DestinationInfo.code})` : 'N/A'}</td>
                              <td>
                                <div className="d-flex">
                                  <button
                                    className="btn btn-warning btn-sm me-1 py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleEdit(f)}
                                  >
                                    Uredi
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleDelete(f.id)}
                                  >
                                    Obriši
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
    {/* Added pagination controls at the bottom */}
    <div className="pagination-controls mt-3 d-flex justify-content-center align-items-center">
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
  </>
) : (
  <p>Nema letova u rasporedu.</p>
)}
    </div>
  );
}

export default MonthlySchedule;
