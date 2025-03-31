// CheckInPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from 'react-bootstrap'; // Import Spinner
import './CheckInPage.css';
import config from '../config';
import { toast } from 'react-toastify'; // Import toast
import { useAuth } from './AuthProvider'; // Import useAuth

function CheckIn() {
  // Existing state for standard session
  const [flights, setFlights] = useState([]); // Holds flights for standard dropdown
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [pageId, setPageId] = useState('C1'); // Page ID for standard session
  const [isPriority, setIsPriority] = useState(false); // Priority for standard session
  const [sessionType, setSessionType] = useState('check-in'); // Session type for standard session

  // Common state
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const { user } = useAuth(); // Get user from AuthContext

  // State for custom session form ("Session by Flight Number")
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [destinations, setDestinations] = useState([]); // For custom form dropdown
  const [flightNumbers, setFlightNumbers] = useState([]); // For custom form dropdown
  const [customSessionData, setCustomSessionData] = useState({
    pageId: 'C1', // Default page for custom form
    sessionType: 'check-in', // Default type for custom form
    isPriority: false,
    custom_airline_id: '',
    custom_flight_number: '', // Selected flight number
    custom_destination1: '',
    custom_destination2: '',
    // Removed time and is_departure fields
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch flights (for standard form), airlines, destinations, flight numbers (for custom form), and active sessions
        const [flightsRes, airlinesRes, destinationsRes, flightNumbersRes, sessionsRes] = await Promise.all([
          axios.get(`${config.apiUrl}/api/flights/daily-departures`), // Fetch daily flights for standard dropdown
          axios.get(`${config.apiUrl}/api/airlines`),
          axios.get(`${config.apiUrl}/api/destinations`),
          axios.get(`${config.apiUrl}/api/flight-numbers`), // Fetch all flight numbers
          axios.get(`${config.apiUrl}/api/display/active`)
        ]);

        setFlights(flightsRes.data || []);
        setAirlines(airlinesRes.data || []);
        setDestinations(destinationsRes.data || []);
        setFlightNumbers(flightNumbersRes.data || []); // Set flight numbers
        setActiveSessions(sessionsRes.data || []);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Greška pri učitavanju inicijalnih podataka.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const refreshSessions = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/display/active`);
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Greška pri osvježavanju sesija:', error);
      toast.error('Greška pri osvježavanju sesija.');
    }
  };

  // Handler for standard session submission
  const handleSubmit = async () => {
    if (!selectedFlight) {
      toast.error('Molimo odaberite let.');
      return;
    }
    if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
    try {
      const isBoardingPage = pageId.startsWith('U');
      await axios.post(`${config.apiUrl}/api/display/sessions`, {
        flightId: selectedFlight.id,
        pageId,
        sessionType: isBoardingPage ? 'boarding' : 'check-in',
        isPriority
      }, { headers: { Authorization: `Bearer ${user.token}` } }); // Add Auth header
      toast.success('Standardna sesija uspješno pokrenuta!');
      await refreshSessions();
      setSelectedFlight(null); // Reset selection
      // Reset other fields if needed
      const formSelect = document.querySelector('.session-form select[name="standardFlightSelect"]'); // Find the select element
      if(formSelect) formSelect.value = ""; // Reset dropdown visual selection

    } catch (err) {
      console.error('Greška pri pokretanju standardne sesije:', err);
      toast.error(`Greška pri pokretanju sesije: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle submission for the custom session form ("Session by Flight Number")
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
    // Validation
    if (!customSessionData.custom_airline_id || !customSessionData.custom_flight_number || !customSessionData.custom_destination1) {
      toast.error('Molimo popunite obavezna polja (Aviokompanija, Broj leta, Destinacija 1).');
      return;
    }

    try {
      const payload = {
        pageId: customSessionData.pageId,
        sessionType: customSessionData.sessionType,
        isPriority: customSessionData.isPriority,
        custom_airline_id: customSessionData.custom_airline_id,
        custom_flight_number: customSessionData.custom_flight_number,
        custom_destination1: customSessionData.custom_destination1,
        custom_destination2: customSessionData.custom_destination2 || null,
        flightId: null // Explicitly set flightId to null
      };

      await axios.post(`${config.apiUrl}/api/display/sessions`, payload, {
         headers: { Authorization: `Bearer ${user.token}` } // Add Auth header
      });
      toast.success('Sesija po broju leta uspješno pokrenuta!');
      await refreshSessions();
      setShowCustomForm(false); // Hide form after successful submission
       // Reset custom form state
       setCustomSessionData({
         pageId: 'C1',
         sessionType: 'check-in',
         isPriority: false,
         custom_airline_id: '',
         custom_flight_number: '',
         custom_destination1: '',
         custom_destination2: '',
       });
    } catch (err) {
      console.error('Greška pri pokretanju sesije po broju leta:', err);
      toast.error(`Greška pri pokretanju sesije: ${err.response?.data?.message || err.message}`);
    }
  };


  const handleCloseSession = async (sessionId) => {
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
    try {
      await axios.put(`${config.apiUrl}/api/display/sessions/${sessionId}/close`, {}, {
         headers: { Authorization: `Bearer ${user.token}` } // Add Auth header
      });
      toast.success('Sesija uspješno zatvorena!');
      await refreshSessions();
    } catch (err) {
      console.error('Greška pri zatvaranju sesije:', err);
      toast.error(`Greška pri zatvaranju sesije: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle changes in the custom form
  const handleCustomChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomSessionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Removed handleCustomTypeChange as type is no longer needed in custom form data

  const getAirlineName = (airlineId) => {
    const airline = airlines.find(a => a.id.toString() === airlineId?.toString()); // Add safe navigation
    return airline?.name || 'Nepoznata';
  };

  const getPageAlias = (pageId) => {
    if (!pageId) return '';
    if (pageId.startsWith('C')) {
      const number = parseInt(pageId.slice(1), 10);
      return `Šalter ${number}`;
    } else if (pageId.startsWith('U')) {
      const number = parseInt(pageId.slice(1), 10);
      switch (number) {
        case 1: return '---------';
        case 2: return 'Izlazni Gate 1 (Lijevo)';
        case 3: return 'Izlazni Gate 2 (Desno)';
        case 4: return 'Izlazni Gate 3 (Novi gate)';
        case 5: return 'Izlazni Gate 4';
        case 6: return 'Izlazni Gate 5';
        default: return `Izlazni Gate ${number}`;
      }
    } else if (pageId.startsWith('G')) {
         const number = parseInt(pageId.slice(1), 10);
         return `Generalni ${number}`;
    }
    return pageId;
  };

  if (loading) {
    return <div className="container mt-4"><Spinner animation="border" /> Učitavanje podataka...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Upravljanje Sesijama Prikaza</h2>

       {/* Toggle Button for Custom Session Form */}
       <div className="text-center mb-4">
        <button
          className={`btn ${showCustomForm ? 'btn-secondary' : 'btn-info'}`}
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Zatvori Sesiju po Broju Leta' : 'Otvori Sesiju po Broju Leta'}
        </button>
      </div>


      {/* Standard Session Form (conditionally hidden) */}
      {!showCustomForm && (
        <div className="card mb-4 session-form">
          <div className="card-body">
            <h4>Standardna Sesija (bazirana na letu)</h4>

          <div className="row mb-4">
            <div className="col-md-3">
              <label className="form-label">Tip Sesije:</label>
              <select
                className="form-select"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                disabled={!user}
              >
                <option value="check-in">Check-in</option>
                <option value="boarding">Boarding</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Ekran:</label>
              <select
                className="form-select"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                 disabled={!user}
              >
                {[...Array(20)].map((_, i) => {
                  const id = `C${i + 1}`;
                  return <option key={id} value={id}>{getPageAlias(id)}</option>;
                })}
                {[...Array(6)].map((_, i) => {
                  const id = `U${i + 1}`;
                  return <option key={id} value={id}>{getPageAlias(id)}</option>;
                })}
                 {/* Add General pages if needed */}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Let (Današnji):</label>
              <select
                className="form-select"
                name="standardFlightSelect" // Added name for potential reset
                value={selectedFlight?.id || ""} // Control the value
                onChange={(e) => {
                    const flightId = e.target.value;
                    setSelectedFlight(flights.find(f => f.id.toString() === flightId) || null);
                }}
                 disabled={!user}
              >
                <option value="">Odaberite let</option>
                {flights.map(flight => (
                  <option key={flight.id} value={flight.id}>
                    {`${getAirlineName(flight.airline_id)} - ${flight.flight_number} -
                    ${flight.destination} -
                    ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  id="priorityCheck"
                  className="form-check-input"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                   disabled={!user}
                />
                <label className="form-check-label" htmlFor="priorityCheck">
                 Priority
                </label>
                </div>
              </div>
            </div>

            <div className="d-grid">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={!selectedFlight || !user}
              >
                Pokreni Standardnu Sesiju
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Custom Session Form ("Session by Flight Number") (conditionally shown) */}
       {showCustomForm && (
        <div className="card mb-4 session-form custom-session-form">
          <div className="card-body">
            <h4>Sesija po Broju Leta</h4>

             {/* Row 1: Page, Session Type, Priority */}
            <div className="row mb-3">
               <div className="col-md-4">
                 <label className="form-label">Ekran:</label>
                 <select
                   className="form-select"
                   name="pageId"
                   value={customSessionData.pageId}
                   onChange={handleCustomChange}
                    disabled={!user}
                 >
                   {[...Array(20)].map((_, i) => <option key={`C${i + 1}`} value={`C${i + 1}`}>{getPageAlias(`C${i + 1}`)}</option>)}
                   {[...Array(6)].map((_, i) => <option key={`U${i + 1}`} value={`U${i + 1}`}>{getPageAlias(`U${i + 1}`)}</option>)}
                   {/* Add General (G) pages if needed */}
                 </select>
               </div>
               <div className="col-md-4">
                 <label className="form-label">Tip Sesije:</label>
                 <select
                   className="form-select"
                   name="sessionType"
                   value={customSessionData.sessionType}
                   onChange={handleCustomChange}
                    disabled={!user}
                 >
                   <option value="check-in">Check-in</option>
                   <option value="boarding">Boarding</option>
                 </select>
               </div>
               <div className="col-md-4 d-flex align-items-end">
                 <div className="form-check mb-2">
                   <input
                     type="checkbox"
                     id="customPriorityCheck"
                     className="form-check-input"
                     name="isPriority"
                     checked={customSessionData.isPriority}
                     onChange={handleCustomChange}
                      disabled={!user}
                   />
                   <label className="form-check-label" htmlFor="customPriorityCheck">
                     Priority
                   </label>
                 </div>
               </div>
            </div>

             {/* Row 2: Airline, Flight Number */}
             <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label">Aviokompanija:</label>
                    <select
                        className="form-select"
                        name="custom_airline_id"
                        value={customSessionData.custom_airline_id}
                        onChange={handleCustomChange}
                        required
                         disabled={!user}
                    >
                        <option value="">Odaberi</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                 <div className="col-md-6">
                    <label className="form-label">Broj Leta (Današnji):</label>
                     <select
                        className="form-select"
                        name="custom_flight_number"
                        value={customSessionData.custom_flight_number}
                        onChange={handleCustomChange}
                        required
                         disabled={!user}
                    >
                        <option value="">Odaberi broj leta</option>
                        {/* Populate with unique flight numbers for today */}
                        {[...new Set(flights.map(f => f.flight_number))].sort().map(fn => (
                            <option key={fn} value={fn}>{fn}</option>
                        ))}
                    </select>
                 </div>
             </div>

             {/* Row 3: Destinations */}
             <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label">Destinacija 1:</label>
                     <select
                        className="form-select"
                        name="custom_destination1"
                        value={customSessionData.custom_destination1}
                        onChange={handleCustomChange}
                        required
                         disabled={!user}
                    >
                        <option value="">Odaberi</option>
                        {destinations.map(d => <option key={d.id} value={`${d.name} (${d.code})`}>{d.name} ({d.code})</option>)}
                    </select>
                </div>
                 <div className="col-md-6">
                    <label className="form-label">Destinacija 2 (Opciono):</label>
                     <select
                        className="form-select"
                        name="custom_destination2"
                        value={customSessionData.custom_destination2}
                        onChange={handleCustomChange}
                         disabled={!user}
                    >
                        <option value="">Odaberi (ako postoji)</option>
                        {destinations.map(d => <option key={d.id} value={`${d.name} (${d.code})`}>{d.name} ({d.code})</option>)}
                    </select>
                 </div>
             </div>

            <div className="d-grid">
              <button
                className="btn btn-success btn-lg"
                onClick={handleCustomSubmit}
                 disabled={!user}
              >
                Pokreni Sesiju po Broju Leta
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Active Sessions List */}
      <div className="card mt-5">
        <div className="card-body">
          <h3 className="mb-4">Aktivne sesije</h3>

          {activeSessions.length === 0 ? (
            <div className="alert alert-info">Nema aktivnih sesija</div>
          ) : (
            <div className="active-sessions">
              {activeSessions.map(session => {
                 // Determine flight data based on whether it's custom or standard
                 const displayData = session.CustomFlightData || session.Flight;
                 const airlineName = displayData?.Airline?.name || 'N/A';
                 const flightNumber = displayData?.flight_number || 'N/A';
                 const destination = displayData?.destination || 'N/A';

                 return (
                    <div key={session.id} className="active-session-card">
                      <h5>{flightNumber} - {destination} ({airlineName})</h5>
                      <div className="d-flex align-items-center flex-wrap"> {/* Added flex-wrap */}
                        <span className={`badge ${session.sessionType === 'check-in' ? 'check-in' : 'boarding'} me-2 mb-1`}> {/* Added margins */}
                          {session.sessionType}
                        </span>
                        <span className="badge bg-secondary me-2 mb-1">Ekran: {getPageAlias(session.pageId)}</span>
                        {session.isPriority && <span className="badge bg-warning me-2 mb-1">Prioritet</span>}
                        <small className="text-muted me-auto mb-1"> {/* Changed ms-auto to me-auto */}
                          Početak: {new Date(session.start_time).toLocaleString()}
                        </small>
                        <button
                          className="btn btn-danger btn-sm mb-1" // Removed ms-3
                          onClick={() => handleCloseSession(session.id)}
                           disabled={!user}
                        >
                          Zatvori sesiju
                        </button>
                      </div>
                    </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
