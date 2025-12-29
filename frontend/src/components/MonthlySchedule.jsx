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
  const [activeTab, setActiveTab] = useState('individual'); // 'individual', 'monthly', 'csv'

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
  const [destinations, setDestinations] = useState([]);
  const [flightNumbers, setFlightNumbers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [editingFlight, setEditingFlight] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // CSV import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvPreviewing, setCsvPreviewing] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear, filterDate]);

  useEffect(() => {
    if (deleteSuccess || deleteError) {
      const timer = setTimeout(() => {
        setDeleteSuccess(false);
        setDeleteError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess, deleteError]);

  const filterFlightsByMonthAndYear = (flights) => {
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      selectedDate.setHours(0, 0, 0, 0);

      return flights.filter(flight => {
        const flightDate = new Date(flight.departure_time || flight.arrival_time);
        const flightDateOnly = new Date(flightDate.getFullYear(), flightDate.getMonth(), flightDate.getDate());
        return flightDateOnly.getTime() === selectedDate.getTime();
      });
    }

    if (filterMonth === 0) return flights;

    return flights.filter(flight => {
      const date = new Date(flight.departure_time || flight.arrival_time);
      const flightMonth = date.getMonth() + 1;
      const flightYear = date.getFullYear();

      return flightMonth === filterMonth && flightYear === filterYear;
    });
  };

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

    // Reset dependent fields when airline changes
    if (name === 'airline_id') {
      setFlight(prev => ({
        ...prev,
        airline_id: value,
        destination: '', // Reset destination when airline changes
        flight_number: '', // Reset flight number when airline changes
      }));
      return;
    }

    // Reset flight number when destination or flight type changes
    if (name === 'destination' || name === 'is_departure') {
      setFlight(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        flight_number: '', // Reset flight number
      }));
      return;
    }

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
      const convertToUTC = (localDateTimeString) => {
        if (!localDateTimeString) return null;

        // Parse the datetime-local input which is in format: "YYYY-MM-DDTHH:mm"
        // We want to preserve the exact time the user entered, not convert it
        const parts = localDateTimeString.split('T');
        if (parts.length !== 2) {
          console.error("Invalid date string format:", localDateTimeString);
          return null;
        }

        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);

        // Create UTC date with the exact values user entered (no timezone conversion)
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

        if (isNaN(utcDate.getTime())) {
          console.error("Invalid date components:", localDateTimeString);
          return null;
        }

        return utcDate.toISOString();
      };

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
        destination_id: selectedDestination.id,
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

    let formattedFlight = {
      ...flight,
      destination: flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : ''
    };

    if (flight.departure_time) {
      const date = new Date(flight.departure_time);
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
      const date = new Date(flight.arrival_time);
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

    // Reset flight_number when airline or destination changes
    if (name === 'airline_id') {
      setEditingFlight(prev => ({
        ...prev,
        airline_id: value,
        destination: prev.destination, // Keep destination
        flight_number: '', // Reset flight number
      }));
      return;
    }

    if (name === 'destination') {
      setEditingFlight(prev => ({
        ...prev,
        destination: value,
        flight_number: '', // Reset flight number when destination changes
      }));
      return;
    }

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

      const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === editingFlight.destination);
      if (!selectedDestination) {
        setError('Odabrana destinacija nije validna.');
        return;
      }

      const convertToUTC = (localDateTimeString) => {
        if (!localDateTimeString) return null;
        const localDate = new Date(localDateTimeString);
        if (isNaN(localDate.getTime())) {
          console.error("Invalid date string provided:", localDateTimeString);
          return null;
        }
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

  const handleDeleteMonthlySchedule = async () => {
    if (!window.confirm(`Jeste li sigurni da želite obrisati sve letove za ${filterMonth}/${filterYear}?`)) return;

    setDeleteLoading(true);
    setDeleteSuccess(false);
    setDeleteError('');

    try {
      const response = await axios.delete(`${config.apiUrl}/flights/monthly-schedule/${filterYear}/${filterMonth}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

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

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setCsvResult(null);
    }
  };

  const handleCsvPreview = async () => {
    if (!csvFile) {
      setError('Molimo odaberite CSV fajl');
      return;
    }

    if (!user) {
      setError('Morate biti prijavljeni');
      return;
    }

    setCsvPreviewing(true);
    setCsvPreview(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await axios.post(`${config.apiUrl}/flights/preview-csv`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCsvPreview(response.data);
    } catch (err) {
      console.error('Greška prilikom pregleda CSV-a:', err);
      setError(err.response?.data?.error || 'Greška prilikom pregleda CSV fajla');
    } finally {
      setCsvPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!csvFile || !csvPreview) {
      setError('Nema podataka za import');
      return;
    }

    setCsvUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await axios.post(`${config.apiUrl}/flights/import-csv`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCsvResult(response.data);
      await fetchFlights();

      // Clear preview and file
      setCsvPreview(null);
      setCsvFile(null);
      if (document.getElementById('csvFileInput')) {
        document.getElementById('csvFileInput').value = '';
      }

      alert(`CSV import završen!\nUspješno: ${response.data.results.success}\nGreške: ${response.data.results.failed}`);
    } catch (err) {
      console.error('Greška prilikom importa CSV-a:', err);
      setError(err.response?.data?.error || 'Greška prilikom importa CSV fajla');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setCsvPreview(null);
    setCsvFile(null);
    if (document.getElementById('csvFileInput')) {
      document.getElementById('csvFileInput').value = '';
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Molimo odaberite CSV fajl');
      return;
    }

    if (!user) {
      setError('Morate biti prijavljeni da biste importovali CSV');
      return;
    }

    setCsvUploading(true);
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await axios.post(`${config.apiUrl}/flights/import-csv`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCsvResult(response.data);
      await fetchFlights();
      setCsvFile(null);
      document.getElementById('csvFileInput').value = '';

      alert(`CSV import završen!\nUspješno: ${response.data.results.success}\nGreške: ${response.data.results.failed}`);
    } catch (err) {
      console.error('Greška prilikom importa CSV-a:', err);
      setError(err.response?.data?.error || 'Greška prilikom importa CSV fajla');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleWeeklyChange = (dayIndex, flightIndex, e) => {
    const { name, value } = e.target;

    setWeeklySchedule(prev => {
      const newSchedule = JSON.parse(JSON.stringify(prev));
      const flight = newSchedule[dayIndex].flights[flightIndex] || {};

      // Reset dependent fields when airline changes
      if (name === 'airline_id') {
        flight.airline_id = value;
        flight.destination = '';
        flight.flight_number = '';
      }
      // Reset flight number when destination or flight type changes
      else if (name === 'destination') {
        flight.destination = value;
        flight.flight_number = '';
      }
      else if (name === 'is_departure') {
        flight.is_departure = value === 'true';
        flight.departure_time = '';
        flight.arrival_time = '';
        flight.flight_number = '';
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

  const convertLocalHHMMToUTCISO = (localTimeHHMM, dayOfWeek) => {
    if (!localTimeHHMM || !/^\d{2}:\d{2}$/.test(localTimeHHMM)) {
      console.warn("Invalid or empty time provided:", localTimeHHMM);
      return null;
    }
    const [hours, minutes] = localTimeHHMM.split(':').map(Number);

    const dayMapping = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };

    const year = selectedYear;
    const month = selectedMonth - 1;

    const firstDayOfMonth = new Date(year, month, 1);
    let dayOfMonth = 1;

    if (firstDayOfMonth.getDay() !== dayMapping[dayOfWeek]) {
      const daysToAdd = (dayMapping[dayOfWeek] - firstDayOfMonth.getDay() + 7) % 7;
      dayOfMonth += daysToAdd;
    }

    // Use Date.UTC to preserve exact time without timezone conversion
    const utcDate = new Date(Date.UTC(year, month, dayOfMonth, hours, minutes, 0, 0));

    if (isNaN(utcDate.getTime())) {
        console.error("Failed to create valid date from time:", localTimeHHMM);
        return null;
    }

    return utcDate.toISOString();
  };

  try {
    const filteredWeeklySchedule = weeklySchedule.map(day => ({
      ...day,
      flights: day.flights
        .filter(f => f.airline_id && f.flight_number && f.destination && (f.departure_time || f.arrival_time))
        .map(flight => {
          const adjustedFlight = { ...flight };

          const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === flight.destination);
          if (!selectedDestination) {
            console.warn("Skipping flight due to invalid destination:", flight);
            return null;
          }

          adjustedFlight.destination_id = selectedDestination.id;
          delete adjustedFlight.destination;

          if (adjustedFlight.is_departure) {
            const utcTime = convertLocalHHMMToUTCISO(adjustedFlight.departure_time, day.day_of_week);
            if (!utcTime) {
                console.warn("Skipping departure flight due to invalid time:", flight);
                return null;
            }
            adjustedFlight.departure_time = utcTime;
            adjustedFlight.arrival_time = null;
          } else {
            const utcTime = convertLocalHHMMToUTCISO(adjustedFlight.arrival_time, day.day_of_week);
             if (!utcTime) {
                console.warn("Skipping arrival flight due to invalid time:", flight);
                return null;
            }
            adjustedFlight.arrival_time = utcTime;
            adjustedFlight.departure_time = null;
          }

          delete adjustedFlight.departure_time_is_local;
          delete adjustedFlight.arrival_time_is_local;

          return adjustedFlight;
        })
        .filter(f => f !== null)
    }));

    const payload = {
      weeklySchedule: filteredWeeklySchedule,
      targetMonth: selectedMonth - 1,
      targetYear: selectedYear
    };

    await axios.post(`${config.apiUrl}/flights/generate-monthly-schedule`, payload, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    alert('Mjesečni raspored uspješno generiran!');
    fetchFlights();
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
    <div className="monthly-schedule-container">
      <div className="monthly-schedule-content">
        <h1 className="text-center mb-4">Raspored Letova</h1>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              <i className="bi bi-airplane me-2"></i>
              Pojedinačni Letovi
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'monthly' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly')}
            >
              <i className="bi bi-calendar-month me-2"></i>
              Mjesečni Import
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'csv' ? 'active' : ''}`}
              onClick={() => setActiveTab('csv')}
            >
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              CSV Import
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Individual Flight Tab */}
          {activeTab === 'individual' && (
            <div className="tab-pane-content">
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
                  <label>Destinacija:</label>
                  <select
                    name="destination"
                    value={flight.destination}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Odaberite destinaciju</option>
                    {(() => {
                      // Filter destinations based on selected airline
                      const selectedAirline = airlines.find(a => a.id === parseInt(flight.airline_id));

                      if (!selectedAirline) {
                        // If no airline selected, show all destinations
                        return destinations.map(d => (
                          <option key={d.id} value={`${d.name} (${d.code})`}>
                            {d.name} ({d.code})
                          </option>
                        ));
                      }

                      // Get unique destinations that are mapped for this airline
                      const airlineDestinations = flightNumbers
                        .filter(fn => fn.airline_code === selectedAirline.iata_code)
                        .map(fn => fn.destination);

                      // Get unique destination names
                      const uniqueDestinations = [...new Set(airlineDestinations)];

                      // Filter destinations list to only show mapped ones
                      const filteredDestinations = destinations.filter(d =>
                        uniqueDestinations.includes(d.name)
                      );

                      // Debug log
                      console.log('Selected Airline:', selectedAirline);
                      console.log('Flight Numbers with airline_code:', flightNumbers.filter(fn => fn.airline_code));
                      console.log('Filtered for this airline:', airlineDestinations);

                      if (filteredDestinations.length === 0) {
                        return <option value="" disabled>Nema dostupnih destinacija za ovu aviokompaniju</option>;
                      }

                      return filteredDestinations.map(d => (
                        <option key={d.id} value={`${d.name} (${d.code})`}>
                          {d.name} ({d.code})
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tip Leta:</label>
                  <div className="flight-type-selector">
                    <button
                      type="button"
                      className={`flight-type-btn flight-type-btn--departure ${flight.is_departure === true ? 'flight-type-btn--selected' : ''}`}
                      onClick={() => setFlight(prev => ({ ...prev, is_departure: true, arrival_time: '', flight_number: '' }))}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Odlazni
                    </button>
                    <button
                      type="button"
                      className={`flight-type-btn flight-type-btn--arrival ${flight.is_departure === false ? 'flight-type-btn--selected' : ''}`}
                      onClick={() => setFlight(prev => ({ ...prev, is_departure: false, departure_time: '', flight_number: '' }))}
                    >
                      <i className="bi bi-box-arrow-in-down-right me-1"></i> Dolazni
                    </button>
                  </div>
                </div>

                <div className="form-group flight-number-group">
                  <label>Broj Leta:</label>
                  <select
                    name="flight_number"
                    value={flight.flight_number}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Odaberite broj leta</option>
                    {(() => {
                      // Filter flight numbers based on selected destination, airline, and flight type
                      const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === flight.destination);
                      const selectedAirline = airlines.find(a => a.id === parseInt(flight.airline_id));

                      if (!selectedDestination) {
                        return null;
                      }

                      const filteredNumbers = flightNumbers.filter(fn => {
                        // Match destination name
                        const destinationMatch = fn.destination === selectedDestination.name;

                        // Match flight type (departure/arrival)
                        const typeMatch = fn.is_departure === flight.is_departure;

                        // Match airline code if both are available
                        let airlineMatch = true;
                        if (fn.airline_code && selectedAirline) {
                          airlineMatch = fn.airline_code === selectedAirline.iata_code;
                        }

                        return destinationMatch && typeMatch && airlineMatch;
                      });

                      if (filteredNumbers.length === 0) {
                        return <option value="" disabled>Nema dostupnih brojeva letova za ovu kombinaciju</option>;
                      }

                      return filteredNumbers.map(fn => (
                        <option key={fn.number} value={fn.number}>
                          {fn.number} - {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {flight.is_departure ? (
                  <div className="form-group active-time-input">
                    <label style={{ color: '#28a745', fontWeight: 'bold' }}>Polazak:</label>
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
                    <label style={{ color: '#ffc107', fontWeight: 'bold' }}>Dolazak:</label>
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

                <button type="submit" className="btn btn-primary" disabled={!user}>Dodaj</button>
              </form>
            </div>
          )}

          {/* Monthly Import Tab */}
          {activeTab === 'monthly' && (
            <div className="tab-pane-content">
              <h2>Generiši mjesečni raspored</h2>
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
                            <label>Destinacija:</label>
                            <select
                              name="destination"
                              value={flight.destination || ''}
                              onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                              className="form-control"
                              required
                            >
                              <option value="">Odaberite destinaciju</option>
                              {(() => {
                                const selectedAirline = airlines.find(a => a.id === parseInt(flight.airline_id));

                                if (!selectedAirline) {
                                  return destinations.map(d => (
                                    <option key={d.id} value={`${d.name} (${d.code})`}>
                                      {d.name} ({d.code})
                                    </option>
                                  ));
                                }

                                const airlineDestinations = flightNumbers
                                  .filter(fn => fn.airline_code === selectedAirline.iata_code)
                                  .map(fn => fn.destination);

                                const uniqueDestinations = [...new Set(airlineDestinations)];
                                const filteredDestinations = destinations.filter(d =>
                                  uniqueDestinations.includes(d.name)
                                );

                                if (filteredDestinations.length === 0) {
                                  return <option value="" disabled>Nema dostupnih destinacija</option>;
                                }

                                return filteredDestinations.map(d => (
                                  <option key={d.id} value={`${d.name} (${d.code})`}>
                                    {d.name} ({d.code})
                                  </option>
                                ));
                              })()}
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

                          <div className="form-group1">
                            <label>Broj Leta:</label>
                            <select
                              name="flight_number"
                              value={flight.flight_number || ''}
                              onChange={e => handleWeeklyChange(dayIndex, flightIndex, e)}
                              className="form-control"
                              required
                            >
                              <option value="">Odaberite broj leta</option>
                              {(() => {
                                const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === flight.destination);
                                const selectedAirline = airlines.find(a => a.id === parseInt(flight.airline_id));

                                if (!selectedDestination) {
                                  return null;
                                }

                                const filteredNumbers = flightNumbers.filter(fn => {
                                  const destinationMatch = fn.destination === selectedDestination.name;
                                  const typeMatch = fn.is_departure === flight.is_departure;

                                  let airlineMatch = true;
                                  if (fn.airline_code && selectedAirline) {
                                    airlineMatch = fn.airline_code === selectedAirline.iata_code;
                                  }

                                  return destinationMatch && typeMatch && airlineMatch;
                                });

                                if (filteredNumbers.length === 0) {
                                  return <option value="" disabled>Nema dostupnih brojeva letova</option>;
                                }

                                return filteredNumbers.map(fn => (
                                  <option key={fn.number} value={fn.number}>
                                    {fn.number} - {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>

                          {flight.is_departure ? (
                            <div className="form-group1 active-time-input">
                              <label style={{ color: '#28a745', fontWeight: 'bold' }}>Polazak:</label>
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
                              <label style={{ color: '#ffc107', fontWeight: 'bold' }}>Dolazak:</label>
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
            </div>
          )}

          {/* CSV Import Tab */}
          {activeTab === 'csv' && (
            <div className="tab-pane-content">
              <div className="card">
                <div className="card-header">
                  <h3>Import Letova iz CSV Fajla</h3>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <strong>Format CSV fajla:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Obavezna polja: airline_code, flight_number, destination_code, is_departure, departure_time/arrival_time</li>
                      <li>Opciona polja: remarks, status</li>
                      <li>Format datuma: YYYY-MM-DD HH:MM (npr. 2025-01-15 06:30)</li>
                      <li>is_departure: true za odlazne, false za dolazne letove</li>
                    </ul>
                    <div className="mt-3">
                      <a
                        href={`${config.apiUrl}/flight_import_template.csv`}
                        download="flight_import_template.csv"
                        className="btn btn-sm btn-primary"
                      >
                        <i className="bi bi-download me-1"></i>
                        Preuzmi CSV Template
                      </a>
                      <a
                        href={`${config.apiUrl}/CSV_FORMAT_DOCUMENTATION.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary ms-2"
                      >
                        <i className="bi bi-file-text me-1"></i>
                        Dokumentacija
                      </a>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="csvFileInput">Odaberite CSV fajl:</label>
                    <input
                      type="file"
                      id="csvFileInput"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="form-control"
                      disabled={csvUploading}
                    />
                  </div>

                  {csvFile && !csvPreview && (
                    <div className="mt-2">
                      <strong>Odabrani fajl:</strong> {csvFile.name}
                    </div>
                  )}

                  {!csvPreview && (
                    <button
                      className="btn btn-primary mt-3"
                      onClick={handleCsvPreview}
                      disabled={!csvFile || csvPreviewing || !user}
                    >
                      {csvPreviewing ? 'Učitavanje pregleda...' : 'Pregledaj CSV'}
                    </button>
                  )}

                  {csvPreview && (
                    <div className="mt-4">
                      <div className="alert alert-success">
                        <h5>📋 Pregled CSV fajla: {csvFile?.name}</h5>
                        <p className="mb-0">
                          Ukupno pronađeno letova: <strong>{csvPreview.flights?.length || 0}</strong>
                        </p>
                        {csvPreview.errors && csvPreview.errors.length > 0 && (
                          <p className="text-warning mb-0 mt-2">
                            Upozorenja: {csvPreview.errors.length}
                          </p>
                        )}
                      </div>

                      {/* Preview letova grupisanih po datumima */}
                      {csvPreview.flights && csvPreview.flights.length > 0 && (
                        <div className="preview-flights mt-3">
                          <h5>Letovi po datumima:</h5>
                          {(() => {
                            // Grupisanje letova po datumima
                            const flightsByDate = csvPreview.flights.reduce((acc, flight) => {
                              const date = flight.is_departure
                                ? new Date(flight.departure_time).toISOString().split('T')[0]
                                : new Date(flight.arrival_time).toISOString().split('T')[0];

                              if (!acc[date]) {
                                acc[date] = { departures: [], arrivals: [] };
                              }

                              if (flight.is_departure) {
                                acc[date].departures.push(flight);
                              } else {
                                acc[date].arrivals.push(flight);
                              }

                              return acc;
                            }, {});

                            return Object.keys(flightsByDate).sort().map(date => (
                              <div key={date} className="card mb-3">
                                <div className="card-header">
                                  <h6 className="mb-0">{new Date(date + 'T12:00:00').toLocaleDateString('bs-BA', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</h6>
                                </div>
                                <div className="card-body">
                                  {flightsByDate[date].departures.length > 0 && (
                                    <div className="mb-3">
                                      <h6>🛫 Odlasci ({flightsByDate[date].departures.length})</h6>
                                      <table className="table table-sm table-hover">
                                        <thead>
                                          <tr>
                                            <th>Let</th>
                                            <th>Aviokompanija</th>
                                            <th>Destinacija</th>
                                            <th>Vrijeme</th>
                                            <th>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {flightsByDate[date].departures.map((f, idx) => (
                                            <tr key={idx}>
                                              <td><strong>{f.flight_number}</strong></td>
                                              <td>{f.airline_code}</td>
                                              <td>{f.destination_code}</td>
                                              <td>{new Date(f.departure_time).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}</td>
                                              <td>{f.status || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {flightsByDate[date].arrivals.length > 0 && (
                                    <div>
                                      <h6>🛬 Dolasci ({flightsByDate[date].arrivals.length})</h6>
                                      <table className="table table-sm table-hover">
                                        <thead>
                                          <tr>
                                            <th>Let</th>
                                            <th>Aviokompanija</th>
                                            <th>Destinacija</th>
                                            <th>Vrijeme</th>
                                            <th>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {flightsByDate[date].arrivals.map((f, idx) => (
                                            <tr key={idx}>
                                              <td><strong>{f.flight_number}</strong></td>
                                              <td>{f.airline_code}</td>
                                              <td>{f.destination_code}</td>
                                              <td>{new Date(f.arrival_time).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}</td>
                                              <td>{f.status || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Greške i upozorenja */}
                      {csvPreview.errors && csvPreview.errors.length > 0 && (
                        <div className="alert alert-warning mt-3">
                          <h6>⚠️ Upozorenja prilikom parsiranja:</h6>
                          <ul className="mb-0">
                            {csvPreview.errors.slice(0, 10).map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                            {csvPreview.errors.length > 10 && (
                              <li className="text-muted">... i još {csvPreview.errors.length - 10} upozorenja</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4 d-flex gap-2">
                        <button
                          className="btn btn-success"
                          onClick={handleConfirmImport}
                          disabled={csvUploading || !csvPreview.flights || csvPreview.flights.length === 0}
                        >
                          {csvUploading ? 'Importovanje...' : '✓ Potvrdi Import'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={handleCancelPreview}
                          disabled={csvUploading}
                        >
                          ✕ Odustani
                        </button>
                      </div>
                    </div>
                  )}

                  {csvResult && (
                    <div className="mt-4">
                      <div className={`alert ${csvResult.results.failed > 0 ? 'alert-warning' : 'alert-success'}`}>
                        <h5>Rezultati importa:</h5>
                        <ul>
                          <li>Ukupno redova: {csvResult.results.total}</li>
                          <li>Uspješno: {csvResult.results.success}</li>
                          <li>Greške: {csvResult.results.failed}</li>
                          <li>Upozorenja: {csvResult.results.warnings}</li>
                        </ul>

                        {csvResult.errors && csvResult.errors.length > 0 && (
                          <div className="mt-3">
                            <h6>Greške:</h6>
                            <ul className="mb-0">
                              {csvResult.errors.slice(0, 10).map((err, idx) => (
                                <li key={idx} className="text-danger">{err}</li>
                              ))}
                              {csvResult.errors.length > 10 && (
                                <li className="text-muted">... i još {csvResult.errors.length - 10} grešaka</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {csvResult.warnings && csvResult.warnings.length > 0 && (
                          <div className="mt-3">
                            <h6>Upozorenja:</h6>
                            <ul className="mb-0">
                              {csvResult.warnings.map((warn, idx) => (
                                <li key={idx} className="text-warning">{warn}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Schedule Display - shown for all tabs */}
        <div className="mt-5">
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
                                if (parseInt(e.target.value) !== 0) {
                                  setFilterDate("");
                                }
                              }}
                              disabled={!!filterDate}
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
                              disabled={!!filterDate}
                              style={{ color: 'white' }}
                            >
                              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {filterMonth !== 0 && !filterDate && user && (
                        <div className="mb-2">
                          <button
                            className="btn btn-danger btn-sm py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
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
                      <h3 className="text-center" style={{ backgroundColor: '#0b5ed7', color: 'white', padding: '0.5rem', borderRadius: '5px' }}>
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
                                            <option value="">-- Odaberi broj leta --</option>
                                            {(() => {
                                              // Get selected destination name (without code in parentheses)
                                              const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === editingFlight.destination);
                                              const selectedAirline = airlines.find(a => a.id === parseInt(editingFlight.airline_id));

                                              if (!selectedDestination) {
                                                return <option value="" disabled>Prvo odaberite destinaciju</option>;
                                              }

                                              // Filter flight numbers by destination, airline, and is_departure
                                              const filteredNumbers = flightNumbers.filter(fn => {
                                                // Case-insensitive destination matching
                                                const destinationMatch = fn.destination.toLowerCase().trim() === selectedDestination.name.toLowerCase().trim();
                                                const typeMatch = fn.is_departure === editingFlight.is_departure;

                                                // Match airline if both flight number and selected airline have airline_code
                                                let airlineMatch = true;
                                                if (fn.airline_code && selectedAirline && selectedAirline.iata_code) {
                                                  airlineMatch = fn.airline_code === selectedAirline.iata_code;
                                                }

                                                return destinationMatch && typeMatch && airlineMatch;
                                              });

                                              if (filteredNumbers.length === 0) {
                                                return <option value="" disabled>Nema dostupnih brojeva letova za ovu kombinaciju</option>;
                                              }

                                              return filteredNumbers.map(fn => (
                                                <option key={fn.number} value={fn.number}>
                                                  {fn.number} - {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})
                                                </option>
                                              ));
                                            })()}
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
                                      <>
                                        <td>
                                          <img
                                              src={`${config.apiUrl}${airlineData?.logo_url || ''}`}
                                              alt={airlineData?.name || 'Airline logo'}
                                              className="airline-logo-small"
                                          />
                                          <span className="ml-2">{airlineData.name}</span>
                                        </td>
                                        <td>{f.flight_number}</td>
                                        <td>{(() => {
                                          const d = new Date(f.departure_time);
                                          const hours = String(d.getUTCHours()).padStart(2, '0');
                                          const minutes = String(d.getUTCMinutes()).padStart(2, '0');
                                          return `${hours}:${minutes}`;
                                        })()}</td>
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

                      <h3 className="text-center" style={{ backgroundColor: '#023047', color: 'white', padding: '0.5rem', borderRadius: '5px', marginTop: '1rem' }}>
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
                                            <option value="">-- Odaberi broj leta --</option>
                                            {(() => {
                                              // Get selected destination name (without code in parentheses)
                                              const selectedDestination = destinations.find(d => `${d.name} (${d.code})` === editingFlight.destination);
                                              const selectedAirline = airlines.find(a => a.id === parseInt(editingFlight.airline_id));

                                              if (!selectedDestination) {
                                                return <option value="" disabled>Prvo odaberite destinaciju</option>;
                                              }

                                              // Filter flight numbers by destination, airline, and is_departure
                                              const filteredNumbers = flightNumbers.filter(fn => {
                                                // Case-insensitive destination matching
                                                const destinationMatch = fn.destination.toLowerCase().trim() === selectedDestination.name.toLowerCase().trim();
                                                const typeMatch = fn.is_departure === editingFlight.is_departure;

                                                // Match airline if both flight number and selected airline have airline_code
                                                let airlineMatch = true;
                                                if (fn.airline_code && selectedAirline && selectedAirline.iata_code) {
                                                  airlineMatch = fn.airline_code === selectedAirline.iata_code;
                                                }

                                                return destinationMatch && typeMatch && airlineMatch;
                                              });

                                              if (filteredNumbers.length === 0) {
                                                return <option value="" disabled>Nema dostupnih brojeva letova za ovu kombinaciju</option>;
                                              }

                                              return filteredNumbers.map(fn => (
                                                <option key={fn.number} value={fn.number}>
                                                  {fn.number} - {fn.destination} ({fn.is_departure ? 'ODLAZNI' : 'DOLAZNI'})
                                                </option>
                                              ));
                                            })()}
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
                                      <>
                                        <td>
                                          <img
                                              src={`${config.apiUrl}${airlineData?.logo_url || ''}`}
                                              alt={airlineData?.name || 'Airline logo'}
                                              className="airline-logo-small"
                                          />
                                          <span className="ml-2">{airlineData.name}</span>
                                        </td>
                                        <td>{f.flight_number}</td>
                                        <td>{(() => {
                                          const d = new Date(f.arrival_time);
                                          const hours = String(d.getUTCHours()).padStart(2, '0');
                                          const minutes = String(d.getUTCMinutes()).padStart(2, '0');
                                          return `${hours}:${minutes}`;
                                        })()}</td>
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
      </div>
    </div>
  );
}

export default MonthlySchedule;
