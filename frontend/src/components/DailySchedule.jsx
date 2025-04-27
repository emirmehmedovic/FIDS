import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { useAuth } from './AuthProvider';
import './DailySchedule.css';
import config from '../config';

// Define allowed statuses (matching backend)
const allowedStatuses = ['SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED', 'BOARDING', 'DIVERTED'];

// Options for the dropdown using backend values
const statusOptions = [
  { value: '', label: '-- Select status --' },
  { value: 'SCHEDULED', label: 'Check-in' },
  { value: 'ON_TIME', label: 'On time' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'BOARDING', label: 'Boarding' },
  { value: 'DEPARTED', label: 'Departed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DIVERTED', label: 'Diverted' },
  { value: 'ARRIVED', label: 'Landed' }
];

// Colors based on backend status values
const statusColors = {
  'SCHEDULED': '#43A9DD', // Check-in
  'ON_TIME': '#088280',   // On time
  'DELAYED': '#FF8300',   // Delayed
  'BOARDING': '#703ACF',  // Boarding
  'DEPARTED': '#703ACF',  // Departed (same color as boarding)
  'CANCELLED': '#DB1F48', // Cancelled
  'DIVERTED': '#F95450',  // Diverted
  'ARRIVED': '#088280',   // Landed (same color as on time)
  'default': 'inherit'
};

// Function to get display label from backend value (optional, for consistency if needed elsewhere)
const getDisplayLabel = (backendStatus) => {
  // If status is null or empty string, return null
  if (backendStatus === null || backendStatus === '') {
    return null;
  }
  const option = statusOptions.find(opt => opt.value === backendStatus);
  return option ? option.label : backendStatus; // Fallback to backend value
};

const getStatusColor = (backendStatus) => {
  return statusColors[backendStatus] || statusColors['default'];
};

// Helper function to format time
const formatTime = (date) => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const options = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Sarajevo' };
        return d.toLocaleTimeString('bs-BA', options);
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
  const [tempStatus, setTempStatus] = useState({}); // Stores the backend status string
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const fetchDailyFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${config.apiUrl}/api/flights/daily/schedule`);
        if (Array.isArray(response.data)) {
          setFlights(response.data.map(flight => {
            // Explicitly preserve null or empty status
            return {
              ...flight,
              remarks: flight.remarks || '',
              // Ensure status remains null or empty if that's what the backend provided
              status: flight.status === undefined || flight.status === '' ? '' : flight.status
            };
          }));
        } else {
          console.error('Flight data is not an array:', response.data);
          setError('Podaci o letovima nisu u očekivanom formatu.');
          setFlights([]);
        }
      } catch (err) {
        console.error('Error fetching daily flights:', err);
        setError(err.response?.data?.message || err.message || 'Nepoznata greška pri dohvaćanju letova.');
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyFlights();
  }, []);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/airlines`);
        setAirlines(response.data);
      } catch (err) {
        console.error('Greška pri dohvaćanju aviokompanija:', err);
      }
    };
    fetchAirlines();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

      const currentFlight = flights.find(f => f.id === flightId);
      // Use the backend status string directly from tempStatus or currentFlight
      const statusToSend = tempStatus[flightId] !== undefined ? (tempStatus[flightId] === '' ? null : tempStatus[flightId]) : currentFlight?.status;

      const payload = {
        remarks: tempRemarks[flightId] ?? (currentFlight?.remarks || ''),
        status: statusToSend // Send the backend status string (or null)
      };

      // Frontend validation (optional, but good practice)
      if (payload.status !== null && !allowedStatuses.includes(payload.status)) {
          setError(`Invalid status selected: ${payload.status}`);
          return;
      }


      const response = await axios.put(
        `${config.apiUrl}/api/flights/${flightId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update state immediately based on the response
      setFlights(prev => prev.map(f => f.id === flightId ? { ...response.data } : f));
      setEditingId(null);
      setError(null);
      // Clear temp state for this flight ID
      setTempStatus(prev => { const newState = {...prev}; delete newState[flightId]; return newState; });
      setTempRemarks(prev => { const newState = {...prev}; delete newState[flightId]; return newState; });

    } catch (err) {
      console.error('Detalji greške:', err.response?.data);
      setError('Greška pri spremanju izmjena: ' + (err.response?.data?.error || err.message));
    }
  };

  const departures = flights.filter((flight) => flight.is_departure);
  const arrivals = flights.filter((flight) => !flight.is_departure);

  const getAirlineData = (airlineId) => {
    if (!Array.isArray(airlines)) return { name: 'Učitavanje...', logo_url: '' };
    return airlines.find((airline) => airline.id.toString() === airlineId?.toString()) || { name: 'Nepoznata', logo_url: '' };
  };

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

  return (
    <div className="daily-schedule-container">
      <div className="daily-schedule-header">
        <h3>{formatDate(new Date())}</h3>
        <h4>{formatTime(new Date())}</h4>
        <h2 className="mb-4">Dnevni raspored letova</h2>
      </div>

      <FlightTable
        flights={departures}
        title={<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>Odlazni letovi</>}
        titleClassName="section-title"
        editingId={editingId}
        tempRemarks={tempRemarks}
        tempStatus={tempStatus}
        setTempRemarks={setTempRemarks}
        setTempStatus={setTempStatus}
        setEditingId={setEditingId}
        handleSave={handleSaveFlight}
        getAirlineData={getAirlineData}
        isAuthenticated={!!user}
      />

      <FlightTable
        flights={arrivals}
        title={<><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" style={{ verticalAlign: 'middle', marginRight: '8px' }}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(180 12 12)"/></svg>Dolazni letovi</>}
        titleClassName="section-title"
        editingId={editingId}
        tempRemarks={tempRemarks}
        tempStatus={tempStatus}
        setTempRemarks={setTempRemarks}
        setTempStatus={setTempStatus}
        setEditingId={setEditingId}
        handleSave={handleSaveFlight}
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
  tempStatus,
  setTempRemarks,
  setTempStatus,
  setEditingId,
  handleSave,
  getAirlineData,
  isAuthenticated,
  titleClassName
}) => {
  if (flights.length === 0) {
    const isDepartures = React.isValidElement(title) ?
      title.props.children.some(child => typeof child === 'string' && child.toLowerCase().includes('odlazni')) :
      (typeof title === 'string' ? title.toLowerCase().includes('odlazni') : true);
    return (
      <Alert variant="info" className="mt-4">
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
              <th>Status</th>
              <th>Napomene</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, index) => {
              const airlineData = getAirlineData(flight.airline_id);
              const isEditing = editingId === flight.id;
              const actualStatus = flight.status; // Backend status string (or null)
              const actualRemarks = flight.remarks;
              const displayLabel = getDisplayLabel(actualStatus); // Get English label for display

              return (
                <tr key={flight.id}>
                  <td>{index + 1}</td>
                  <td>{flight.flight_number}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      {airlineData?.logo_url && airlineData.logo_url.startsWith('/uploads/') ? (
                        <img
                          src={`${config.apiUrl}${airlineData.logo_url}`}
                          alt={airlineData.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/50x35?text=No+Logo'; e.target.alt = 'Logo nedostupan'; }}
                          style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '10px', marginRight: '10px' }}
                        />
                      ) : (
                        <img
                          src={'https://via.placeholder.com/50x35?text=No+Logo'}
                          alt={airlineData?.name || 'Nepoznata'}
                          style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '10px', marginRight: '10px' }}
                        />
                      )}
                      {airlineData?.name || 'Nepoznata'}
                    </div>
                  </td>
                  <td>
                    {flight.is_departure
                      ? formatTime(flight.departure_time)
                      : formatTime(flight.arrival_time)}
                  </td>
                  {/* Display Destination Name and Code */}
                  <td>{flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : 'N/A'}</td>
                  {/* Status Cell */}
                  <td>
                    {isEditing ? (
                      <Form.Select
                        size="sm"
                        value={tempStatus[flight.id] ?? actualStatus ?? ''}
                        onChange={(e) => setTempStatus(prev => ({ ...prev, [flight.id]: e.target.value }))}
                        aria-label="Status select"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      // Only show status if it's explicitly set and not empty or null
                      actualStatus && actualStatus !== '' ? (
                        <span style={{ color: getStatusColor(actualStatus), fontWeight: 'bold' }}>
                          {displayLabel}
                        </span>
                      ) : null
                    )}
                  </td>
                  {/* Remarks Cell */}
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        size="sm"
                        value={tempRemarks[flight.id] ?? (actualRemarks || '')}
                        onChange={(e) => setTempRemarks(prev => ({ ...prev, [flight.id]: e.target.value }))}
                        placeholder="Unesite napomenu..."
                      />
                    ) : (
                      actualRemarks ? <span>{actualRemarks}</span> : null
                    )}
                  </td>
                  {/* Actions Cell */}
                  <td>
                    {isAuthenticated ? (
                      isEditing ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleSave(flight.id)}
                            disabled={
                              (tempRemarks[flight.id] === (actualRemarks || '')) &&
                              (tempStatus[flight.id] === (actualStatus || '')) // Compare temp backend status with current backend status (or '')
                            }
                          >
                            Sačuvaj
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              // Clear temp state on cancel
                              setTempStatus(prev => { const newState = {...prev}; delete newState[flight.id]; return newState; });
                              setTempRemarks(prev => { const newState = {...prev}; delete newState[flight.id]; return newState; });
                            }}
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
                            // Initialize temp state when starting edit, using backend status string
                            setTempRemarks(prev => ({ ...prev, [flight.id]: actualRemarks || '' }));
                            setTempStatus(prev => ({ ...prev, [flight.id]: actualStatus || '' })); // Default to empty string if actualStatus is null
                          }}
                        >
                          Uredi
                        </Button>
                      )
                    ) : null}
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
