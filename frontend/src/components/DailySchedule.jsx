import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Button, Form } from 'react-bootstrap'; // Added Form
import { useAuth } from './AuthProvider';
import './DailySchedule.css';
import config from '../config';

// Define status options and colors outside the component for better organization
const statusOptions = [
  { value: '', label: '-- Odaberi status --' }, // Placeholder option
  { value: 'Na vrijeme', label: 'Na vrijeme' },
  { value: 'Kasni', label: 'Kasni' },
  { value: 'Prijava', label: 'Prijava' },
  { value: 'Ukrcavanje', label: 'Ukrcavanje' },
  { value: 'Otkazan', label: 'Otkazan' },
  { value: 'Divertovan', label: 'Divertovan' }
];

// Updated pastel colors
const statusColors = {
  'Na vrijeme': '#088280', // Pastel Green
  'Kasni': '#FF8300',    // Pastel Peach/Orange
  'Prijava': '#43A9DD',  // Pastel Blue
  'Ukrcavanje': '#703ACF', // Pastel Purple
  'Otkazan': '#DB1F48',   // Pastel Red
  'Divertovan': '#F95450', // Pastel Coral/Orange
  'default': 'inherit' // Default color if status is unknown or not set explicitly
};

const getStatusColor = (status) => {
  return statusColors[status] || statusColors['default'];
};

// Helper function to format time (moved outside DailySchedule)
const formatTime = (date) => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        // const seconds = String(d.getSeconds()).padStart(2, '0'); // Removed seconds for cleaner display
        return `${hours}:${minutes}`;
    } catch (e) {
        console.error("Error formatting time:", date, e);
        return 'Error';
    }
};

// Helper function to format date
const formatDate = (date) => {
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dayOfWeek = days[date.getDay()];
    return `${day}.${month}.${year} (${dayOfWeek})`;
};


const DailySchedule = () => {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempRemarks, setTempRemarks] = useState({});
  const [tempStatus, setTempStatus] = useState({}); // Added state for temporary status
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { user } = useAuth();

  // Fetch daily flights (including status)
  useEffect(() => {
    const fetchDailyFlights = async () => {
      setLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        // Assuming the endpoint now returns status along with other flight data
        const response = await axios.get(`${config.apiUrl}/api/flights/daily/schedule`); // Corrected endpoint
        if (Array.isArray(response.data)) {
          // Let status be null/undefined if not provided by backend
          setFlights(response.data.map(flight => ({
            ...flight,
            remarks: flight.remarks || '', // Keep defaulting remarks for consistency if needed, or make null too
            status: flight.status || null, // Use null if status is missing
          })));
        } else {
          console.error('Flight data is not an array:', response.data);
          setError('Podaci o letovima nisu u očekivanom formatu.');
          setFlights([]); // Clear flights on error
        }
      } catch (err) {
        console.error('Error fetching daily flights:', err);
        setError(err.response?.data?.message || err.message || 'Nepoznata greška pri dohvaćanju letova.');
        setFlights([]); // Clear flights on error
      } finally {
        setLoading(false);
      }
    };
    fetchDailyFlights();
  }, []); // Fetch only once on mount

  // Fetch airlines
  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/airlines`); // Ensure correct endpoint
        setAirlines(response.data);
      } catch (err) {
        console.error('Greška pri dohvaćanju aviokompanija:', err);
        // Optionally set an error state for airlines if needed
      }
    };
    fetchAirlines();
  }, []);

  // Update current date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save flight details (remarks and status)
  const handleSaveFlight = async (flightId) => {
    try {
      if (!user) {
        setError('Niste prijavljeni!');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Niste prijavljeni! Token nije pronađen.');
        return;
      }

      // Send null if status is empty string (placeholder selected) or undefined.
      // Use the value from tempStatus if it exists, otherwise use the original flight status.
      // If the result is an empty string, send null.
      const currentFlight = flights.find(f => f.id === flightId);
      const statusToConsider = tempStatus[flightId] !== undefined ? tempStatus[flightId] : (currentFlight?.status || null);
      const statusToSend = statusToConsider === '' ? null : statusToConsider;


      const payload = {
        remarks: tempRemarks[flightId] ?? (currentFlight?.remarks || ''), // Send original remark if temp is undefined
        status: statusToSend
      };


      // Use the generic update endpoint
      const response = await axios.put(
        `${config.apiUrl}/api/flights/${flightId}`, // Use the general update endpoint
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update state with the data returned from the backend (which includes Airline)
      setFlights(prev => prev.map(f => f.id === flightId ? { ...response.data } : f));
      setEditingId(null); // Exit editing mode
      setError(null); // Clear previous errors
    } catch (err) {
      console.error('Detalji greške:', err.response?.data);
      setError('Greška pri spremanju izmjena: ' + (err.response?.data?.error || err.message));
    }
  };

  // Separate flights into departures and arrivals
  const departures = flights.filter((flight) => flight.is_departure);
  const arrivals = flights.filter((flight) => !flight.is_departure);

  // Find airline data by ID
  const getAirlineData = (airlineId) => {
    if (!Array.isArray(airlines)) return { name: 'Učitavanje...', logo_url: '' };
    return airlines.find((airline) => airline.id === airlineId) || { name: 'Nepoznata', logo_url: '' };
  };

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

  return (
    <div className="daily-schedule-container">
      <div className="daily-schedule-header">
        <h3>{formatDate(currentDateTime)}</h3>
        <h4>{formatTime(currentDateTime)}</h4>
        <h2 className="mb-4">Dnevni raspored letova</h2>
      </div>

      <FlightTable
        flights={departures}
        title={<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>Odlazni letovi</>}
        titleClassName="section-title"
        editingId={editingId}
        tempRemarks={tempRemarks}
        tempStatus={tempStatus} // Pass tempStatus
        setTempRemarks={setTempRemarks}
        setTempStatus={setTempStatus} // Pass setTempStatus
        setEditingId={setEditingId}
        handleSave={handleSaveFlight} // Use updated save handler
        getAirlineData={getAirlineData}
        isAuthenticated={!!user}
      />

      <FlightTable
        flights={arrivals}
        title={<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(180 12 12)"/></svg>Dolazni letovi</>}
        titleClassName="section-title"
        editingId={editingId}
        tempRemarks={tempRemarks}
        tempStatus={tempStatus} // Pass tempStatus
        setTempRemarks={setTempRemarks}
        setTempStatus={setTempStatus} // Pass setTempStatus
        setEditingId={setEditingId}
        handleSave={handleSaveFlight} // Use updated save handler
        getAirlineData={getAirlineData}
        isAuthenticated={!!user}
      />
    </div>
  );
};

// FlightTable Component Updated
const FlightTable = ({
  flights,
  title,
  editingId,
  tempRemarks,
  tempStatus, // Added tempStatus
  setTempRemarks,
  setTempStatus, // Added setTempStatus
  setEditingId,
  handleSave,
  getAirlineData,
  isAuthenticated,
  titleClassName
}) => {
  if (flights.length === 0) {
    const isDepartures = typeof title === 'string' ? title.toLowerCase().includes('odlazni') : true; /* Default guess */
    return (
      <Alert variant="info" className="mt-4">
        {/* Determine if it's arrivals or departures based on title content if possible */}
        {`Nema ${isDepartures ? 'odlaznih' : 'dolaznih'} letova za danas.`}
      </Alert>
    );
  }

  return (
    <>
      <h4 className={titleClassName}>{title}</h4>
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Let</th>
              <th>Aviokompanija</th>
              <th>Vrijeme</th>
              <th>Destinacija</th>
              <th>Status</th> {/* Added Status Header */}
              <th>Napomene</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, index) => {
              const airlineData = getAirlineData(flight.airline_id);
              const isEditing = editingId === flight.id;
              // Use flight data directly for display when not editing
              // Get the actual status and remarks, don't default them here for display logic
              const actualStatus = flight.status;
              const actualRemarks = flight.remarks;

              return (
                <tr key={flight.id}>
                  <td>{index + 1}</td>
                  <td>{flight.flight_number}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      {airlineData.logo_url && airlineData.logo_url.startsWith('/uploads/') ? (
                        <img
                          src={`${config.apiUrl}${airlineData.logo_url}`}
                          alt={airlineData.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/50x35?text=No+Logo'; e.target.alt = 'Logo nedostupan'; }}
                          style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '10px', marginRight: '10px' }}
                        />
                      ) : (
                        <img
                          src={'https://via.placeholder.com/50x35?text=No+Logo'}
                          alt={airlineData.name}
                          style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '10px', marginRight: '10px' }}
                        />
                      )}
                      {airlineData.name}
                    </div>
                  </td>
                  <td>
                    {flight.is_departure
                      ? formatTime(flight.departure_time) 
                      : formatTime(flight.arrival_time)}   
                  </td>
                  <td>{flight.destination}</td>
                  {/* Status Cell */}
                  <td>
                    {isEditing ? (
                      <Form.Select
                        size="sm"
                        // Use tempStatus if available, otherwise fallback to actualStatus or empty string ''
                        value={tempStatus[flight.id] ?? (actualStatus || '')}
                        onChange={(e) => setTempStatus(prev => ({ ...prev, [flight.id]: e.target.value }))}
                        aria-label="Status select"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      // Only display status if it's explicitly set and not the default 'Na vrijeme/On time' implicitly
                      // Also handle the case where status might be explicitly set TO 'Na vrijeme/On time' - show it then.
                      actualStatus ? (
                        <span style={{ color: getStatusColor(actualStatus), fontWeight: 'bold' }}>
                          {actualStatus}
                        </span>
                      ) : null // Render nothing if status is null/undefined/empty string
                    )}
                  </td>
                  {/* Remarks Cell */}
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        size="sm"
                        // Use tempRemarks if available, otherwise fallback to actualRemarks or empty string
                        value={tempRemarks[flight.id] ?? (actualRemarks || '')}
                        onChange={(e) => setTempRemarks(prev => ({ ...prev, [flight.id]: e.target.value }))}
                        placeholder="Unesite napomenu..."
                      />
                    ) : (
                      // Only display remarks if they exist and are not empty
                      actualRemarks ? <span>{actualRemarks}</span> : null // Render nothing if remarks are empty/null/undefined
                    )}
                  </td>
                  {/* Actions Cell */}
                  <td>
                    {!isAuthenticated ? (
                      <span className="text-muted">Prijavite se</span>
                    ) : isEditing ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleSave(flight.id)}
                          // Disable save if neither status nor remarks changed from their original values
                          // Disable save if neither status nor remarks changed from their original values
                          // Compare against original status (or '') and original remarks (or '')
                          disabled={
                            (tempRemarks[flight.id] === (flight.remarks || '')) &&
                            (tempStatus[flight.id] === (flight.status || '')) // Compare temp status with original or empty string
                          }
                        >
                          Sačuvaj
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)} // Cancel editing
                        >
                          Odustani
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(flight.id);
                          // Initialize temp state when starting edit, using empty string for null status
                          setTempRemarks(prev => ({ ...prev, [flight.id]: flight.remarks || '' }));
                          setTempStatus(prev => ({ ...prev, [flight.id]: flight.status || '' }));
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
      </div>
    </>
  );
};

export default DailySchedule;
