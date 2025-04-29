// CheckInPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import axios from 'axios';
import { Spinner, Form, Button as BsButton } from 'react-bootstrap'; // Import Form and Button
import './CheckInPage.css';
import config from '../config';
import { toast } from 'react-toastify';
import { useAuth } from './AuthProvider';
import { FiCopy } from 'react-icons/fi'; // Import copy icon

// Assuming bootstrap icons are included globally or via CDN

// --- Helper function to format time (HH:MM) ---
const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Error formatting time:", dateString, e);
    return '';
  }
};

// --- Frontend Helper function to replace placeholders ---
const replacePlaceholdersFrontend = (text, flightData, optionalInputs) => { // Changed to optionalInputs object
  if (!text || !flightData) return text;

  let processedText = text;
  const { optionalNewTime, optionalNewAirport, optionalCounterNumber, optionalHours, optionalCheckinTime, optionalLocation } = optionalInputs;

  // Determine the time to use: optionalNewTime if provided, otherwise format from flightData
  const timeToUse = optionalNewTime || formatTime(flightData.is_departure ? flightData.departure_time : flightData.arrival_time);

  // Basic flight data replacements (always replaced)
  processedText = processedText.replace(/{flight_number}/g, flightData.flight_number || '');
  // Construct destination string with code if available
  const destinationDisplay = flightData.DestinationInfo ? `${flightData.DestinationInfo.name} (${flightData.DestinationInfo.code})` : (flightData.destination || '');
  processedText = processedText.replace(/{destination}/g, destinationDisplay);
  processedText = processedText.replace(/{time}/g, timeToUse); // Use the determined time
  if (flightData.Airline) {
    processedText = processedText.replace(/{airline_name}/g, flightData.Airline.name || '');
  }
  processedText = processedText.replace(/{departure_city}/g, 'Tuzla'); // Hardcoded

  // Optional replacements based on inputs
  if (optionalNewAirport) {
    processedText = processedText.replace(/{new_airport}/g, optionalNewAirport);
  }
  if (optionalCounterNumber) {
    processedText = processedText.replace(/{counter_number}/g, optionalCounterNumber);
  }
  if (optionalHours) {
    processedText = processedText.replace(/{hours}/g, optionalHours);
  }
  if (optionalCheckinTime) {
    processedText = processedText.replace(/{checkin_time}/g, optionalCheckinTime);
  }
  if (optionalLocation) {
    processedText = processedText.replace(/{location}/g, optionalLocation);
  }

  // Any remaining placeholders (like {gate_number} if not handled) are left as is.

  return processedText;
};


function CheckIn() {
  // Existing state for standard session
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [pageId, setPageId] = useState('C1');
  const [isPriority, setIsPriority] = useState(false);
  const [sessionType, setSessionType] = useState('check-in');

  // Common state
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pages, setPages] = useState([]);
  const { user } = useAuth();

  // State for custom session form
  const [showCustomForm, setShowCustomForm] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [destinations, setDestinations] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [flightNumbers, setFlightNumbers] = useState([]);
  const [customSessionData, setCustomSessionData] = useState({
    pageId: 'C1',
    sessionType: 'check-in',
    isPriority: false,
    flight1Id: '',
    flight2Id: '',
  });

  // State for editing notifications
  const [editingNotificationSessionId, setEditingNotificationSessionId] = useState(null);
  const [tempNotificationText, setTempNotificationText] = useState('');

  // --- State for Notice Session Form ---
  const [noticeSessionData, setNoticeSessionData] = useState({
    pageId: 'C1',
    flightId: '',
    notification_text: '',
    new_time: '',
    new_airport: '',
    counter_number: '', // Added state for counter number
    hours: '',          // Added state for hours
    checkin_time: '',   // Added state for check-in time
    location: '',       // Added state for location
  });
  // ------------------------------------

  // --- State for Notification Templates ---
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  // ---------------------------------------


  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const requests = [
        axios.get(`${config.apiUrl}/api/content`),
        axios.get(`${config.apiUrl}/api/flights/daily-departures`), // Fetch daily departures for the dropdown
        axios.get(`${config.apiUrl}/api/airlines`),
        axios.get(`${config.apiUrl}/api/destinations`),
        axios.get(`${config.apiUrl}/api/flight-numbers`),
        axios.get(`${config.apiUrl}/api/display/active`),
        axios.get(`${config.apiUrl}/api/notification-templates`, { headers }),
      ];

      const responses = await Promise.allSettled(requests);

      const pagesRes = responses[0].status === 'fulfilled' ? responses[0].value : null;
      const flightsRes = responses[1].status === 'fulfilled' ? responses[1].value : null; // Use daily departures here
      const airlinesRes = responses[2].status === 'fulfilled' ? responses[2].value : null;
      const destinationsRes = responses[3].status === 'fulfilled' ? responses[3].value : null;
      const flightNumbersRes = responses[4].status === 'fulfilled' ? responses[4].value : null;
      const sessionsRes = responses[5].status === 'fulfilled' ? responses[5].value : null;
      const templatesRes = responses[6].status === 'fulfilled' ? responses[6].value : null;

      const fetchedPages = pagesRes?.data || [];
      setPages(fetchedPages);
      // Default pageId logic moved to a separate useEffect
      setFlights(flightsRes?.data || []); // Set flights state with daily departures
      setAirlines(airlinesRes?.data || []);
      setDestinations(destinationsRes?.data || []);
      const uniqueFlightNumbers = [...new Set((flightNumbersRes?.data || []).map(fn => fn.number))].sort();
      setFlightNumbers(uniqueFlightNumbers);
      setActiveSessions(sessionsRes?.data || []);
      setNotificationTemplates(templatesRes?.data || []);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Greška pri učitavanju inicijalnih podataka.');
      setNotificationTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed noticeSessionData.pageId dependency


  useEffect(() => {
    fetchData();
  }, [user, fetchData]);

  // Set default notice pageId once pages are loaded
  useEffect(() => {
    if (pages.length > 0 && !noticeSessionData.pageId && user) {
      const firstCheckinPage = pages.find(p => p.pageType === 'check-in');
      // Use 'C1' as a fallback if no check-in page is found, otherwise use the first page
      const defaultPage = firstCheckinPage ? firstCheckinPage.pageId : (pages[0] ? pages[0].pageId : 'C1');
      setNoticeSessionData(prev => ({ ...prev, pageId: defaultPage }));
     }
     // Only run when pages or user changes, or when noticeSessionData.pageId changes (to satisfy lint rule)
   }, [pages, user, noticeSessionData.pageId]);


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
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      toast.success('Standardna sesija uspješno pokrenuta!');
      await refreshSessions();
      setSelectedFlight(null);
      const formSelect = document.querySelector('.session-form select[name="standardFlightSelect"]');
      if(formSelect) formSelect.value = "";

    } catch (err) {
      console.error('Greška pri pokretanju standardne sesije:', err);
      toast.error(`Greška pri pokretanju sesije: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle submission for the custom session form
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Morate biti prijavljeni.');
      return;
    }
    if (!customSessionData.flight1Id || !customSessionData.flight2Id) {
      toast.error('Molimo odaberite oba leta.');
      return;
    }

    try {
      const payload = {
        pageId: customSessionData.pageId,
        sessionType: customSessionData.sessionType,
        isPriority: customSessionData.isPriority,
        flight1Id: customSessionData.flight1Id,
        flight2Id: customSessionData.flight2Id,
        flightId: null
      };

      await axios.post(`${config.apiUrl}/api/display/sessions`, payload, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Sesija po broju leta uspješno pokrenuta!');
      await refreshSessions();
      setShowCustomForm(false);
      setCustomSessionData({
        pageId: 'C1',
        sessionType: 'check-in',
        isPriority: false,
        flight1Id: '',
        flight2Id: '',
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
         headers: { Authorization: `Bearer ${user.token}` }
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

  // --- Notification Handlers ---
  const handleEditNotificationClick = (sessionId, currentText) => {
    setEditingNotificationSessionId(sessionId);
    setTempNotificationText(currentText || '');
  };

  const handleCancelEditNotification = () => {
    setEditingNotificationSessionId(null);
    setTempNotificationText('');
  };

  const handleSaveNotification = async (sessionId) => {
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
    try {
        await axios.put(`${config.apiUrl}/api/display/sessions/${sessionId}/notification`,
            { notificationText: tempNotificationText }, // Changed to camelCase
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        toast.success('Obavještenje uspješno sačuvano!');
        setEditingNotificationSessionId(null);
        setTempNotificationText('');
        await refreshSessions();
    } catch (error) {
        console.error('Greška pri čuvanju obavještenja:', error);
        toast.error(`Greška pri čuvanju obavještenja: ${error.response?.data?.message || error.message}`);
    }
  };
  // -----------------------------

  // --- Notice Session Handlers ---
  const handleNoticeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNoticeSessionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
     // Reset selected template if flight changes
     if (name === 'flightId') {
        setSelectedTemplateId('');
     }
  };

  const handleNoticeSubmit = async () => {
    if (!noticeSessionData.flightId) {
      toast.error('Molimo odaberite let za obavještenje.');
      return;
    }
    if (!noticeSessionData.notification_text) {
      toast.error('Molimo unesite tekst obavještenja.');
      return;
    }
    if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }

    try {
      await axios.post(`${config.apiUrl}/api/display/sessions`, {
        flightId: noticeSessionData.flightId,
        pageId: noticeSessionData.pageId,
        sessionType: 'notice',
        isPriority: false,
        notificationText: noticeSessionData.notification_text, // Changed to camelCase
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      toast.success('Sesija obavještenja uspješno pokrenuta!');
      await refreshSessions();
      // Reset form, including the new time field
      setNoticeSessionData(prev => ({
        ...prev,
        flightId: '',
        notification_text: '',
        new_time: '',
        new_airport: '',
        counter_number: '',
        hours: '',
        checkin_time: '',
        location: '',
      }));
      setSelectedTemplateId(''); // Reset selected template
       // Reset flight dropdown visually if possible
       const noticeFlightSelect = document.querySelector('select[name="flightId"][data-form="notice"]');
       if (noticeFlightSelect) noticeFlightSelect.value = "";


    } catch (err) {
      console.error('Greška pri pokretanju sesije obavještenja:', err);
      toast.error(`Greška pri pokretanju sesije: ${err.response?.data?.message || err.message}`);
    }
  };
  // -----------------------------

  // --- Notification Template Selection & Copy ---
  const selectedTemplate = useMemo(() => {
    return notificationTemplates.find(t => t.id.toString() === selectedTemplateId);
  }, [selectedTemplateId, notificationTemplates]);

  // Updated function to handle optional new time
  const handleCopyAllLanguages = async () => {
    if (!selectedTemplate) {
      toast.warn('Molimo prvo odaberite šablon.');
      return;
    }
    if (!noticeSessionData.flightId) {
      toast.warn('Molimo prvo odaberite let za koji se šablon odnosi.');
      return;
    }

    const flightForNotice = flights.find(f => f.id.toString() === noticeSessionData.flightId);
    if (!flightForNotice) {
      toast.error('Nije moguće pronaći detalje za odabrani let.');
      return;
    }
    const flightDataWithAirline = {
        ...flightForNotice,
        Airline: airlines.find(a => a.id === flightForNotice.airline_id)
    };

    // Gather all optional inputs from state
    const optionalInputs = {
        optionalNewTime: noticeSessionData.new_time || null,
        optionalNewAirport: noticeSessionData.new_airport || null,
        optionalCounterNumber: noticeSessionData.counter_number || null,
        optionalHours: noticeSessionData.hours || null,
        optionalCheckinTime: noticeSessionData.checkin_time || null,
        optionalLocation: noticeSessionData.location || null,
    };

    const languages = ['bs', 'en', 'de', 'tr'];
    let combinedText = '';

    languages.forEach((lang, index) => {
      const langKey = `text_${lang}`;
      const templateText = selectedTemplate[langKey];
      if (templateText) {
        // Pass the optionalInputs object to the replacement function
        const processedText = replacePlaceholdersFrontend(templateText, flightDataWithAirline, optionalInputs);
        combinedText += processedText + (index < languages.length - 1 ? '\n\n' : '');
      }
    });

    if (combinedText) {
      try {
        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          console.error('Clipboard API not available in this context (requires HTTPS or localhost).');
          toast.error('Automatsko kopiranje nije dostupno u ovom pregledniku ili preko nesigurne veze (HTTP). Molimo kopirajte tekst ručno.');
          // Optional: Select the text for easier manual copying
          const textArea = document.getElementById('noticeText');
          if (textArea) textArea.select();
          return; // Stop execution
        }

        await navigator.clipboard.writeText(combinedText);
        toast.success('Obrađeni tekst za sve jezike kopiran!');
        setNoticeSessionData(prev => ({ ...prev, notification_text: combinedText }));
      } catch (err) {
        console.error('Greška pri kopiranju teksta:', err);
        toast.error('Greška pri kopiranju teksta.');
      }
    } else {
      toast.warn('Odabrani šablon nema tekst ni za jedan jezik.');
    }
  };
  // ------------------------------------


  // eslint-disable-next-line no-unused-vars
  const getAirlineName = (airlineId) => {
    const airline = airlines.find(a => a.id.toString() === airlineId?.toString());
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
        case 1: return 'Izlazni Gate 1 (Lijevo)';
        case 2: return 'Izlazni Gate 2 (Desno)';
        case 3: return 'Izlazni Gate 3 (Novi gate)';
        case 4: return 'Izlazni Gate 4 ';
        case 5: return 'Izlazni Gate 5';
        case 6: return 'Izlazni Gate 6';
        default: return `Izlazni Gate ${number}`;
      }
    } else if (pageId.startsWith('G')) {
         const number = parseInt(pageId.slice(1), 10);
         return `Generalni ${number}`;
    }
    return pageId;
  };

  if (loading && !user) {
     return <div className="container mt-4"><Spinner animation="border" /></div>;
  }
  if (loading) {
    return <div className="container mt-4"><Spinner animation="border" /> Učitavanje podataka...</div>;
  }


  return (
    <div className="checkin-container mt-4">
      <h2>Upravljanje Sesijama Prikaza</h2>

       <div className="text-center mb-4">
        <button
          type="button" // Added type="button"
          className={`btn ${showCustomForm ? 'btn-secondary' : 'btn-info'}`}
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Sakrij formu za otvaranje dvostrukog Check-in' : 'Prikaži formu za otvaranje dvostrukog Check-in'}
        </button>
      </div>


      {!showCustomForm && (
        <div className="session-form standard-session-form">
          <div className="card-body">
            <h4><i className="bi bi-airplane-fill"></i> Standardni Check-in/Boarding</h4>
            <div className="row mb-4">
              <div className="col-md-3">
                <label className="form-label">Tip Sesije:</label>
                <select className="form-select" value={sessionType} onChange={(e) => setSessionType(e.target.value)} disabled={!user}>
                  <option value="check-in">Check-in</option>
                  <option value="boarding">Boarding</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Ekran:</label>
                <select className="form-select" value={pageId} onChange={(e) => setPageId(e.target.value)} disabled={!user}>
                   {pages.filter(p => p.pageType === 'check-in' || p.pageType === 'boarding')
                         .sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                         .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Let (Današnji):</label>
                <select
                  className="form-select"
                  name="standardFlightSelect"
                  value={selectedFlight?.id || ""}
                  onChange={(e) => {
                      const flightId = e.target.value;
                      setSelectedFlight(flights.find(f => f.id.toString() === flightId) || null);
                  }}
                  disabled={!user}
                >
                  <option value="">Odaberite let</option>
                  {flights.map(flight => (
                    <option key={flight.id} value={flight.id}>
                      {/* Display Destination Name and Code */}
                      {`${flight.Airline?.name || 'N/A'} - ${flight.flight_number} - ${flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : 'N/A'} - ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input type="checkbox" id="priorityCheck" className="form-check-input" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} disabled={!user}/>
                  <label className="form-check-label" htmlFor="priorityCheck">Priority</label>
                </div>
              </div>
            </div>
            <div className="d-grid">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!selectedFlight || !user}> {/* Added type="button" */}
                Pokreni standardni Check-in/Boarding
              </button>
            </div>
          </div>
        </div>
      )}

       {showCustomForm && (
        <div className="session-form custom-session-form">
          <div className="card-body">
            <h4><i className="bi bi-hash"></i>Odaberite letove za dvostruki Check-in</h4>
            <form onSubmit={handleCustomSubmit}> {/* Added form wrapper */}
              <div className="row mb-3">
                 <div className="col-md-4">
                   <label className="form-label">Ekran:</label>
                   <select className="form-select" name="pageId" value={customSessionData.pageId} onChange={handleCustomChange} disabled={!user}>
                      {pages.filter(p => p.pageType === 'check-in' || p.pageType === 'boarding')
                            .sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                            .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
                   </select>
                 </div>
                 <div className="col-md-4">
                   <label className="form-label">Tip Sesije:</label>
                   <select className="form-select" name="sessionType" value={customSessionData.sessionType} onChange={handleCustomChange} disabled={!user}>
                     <option value="check-in">Check-in</option>
                     <option value="boarding">Boarding</option>
                   </select>
                 </div>
                 <div className="col-md-4 d-flex align-items-end">
                   <div className="form-check mb-2">
                     <input type="checkbox" id="customPriorityCheck" className="form-check-input" name="isPriority" checked={customSessionData.isPriority} onChange={handleCustomChange} disabled={!user}/>
                     <label className="form-check-label" htmlFor="customPriorityCheck">Priority</label>
                   </div>
                 </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Let 1 (Današnji):</label>
                  <select className="form-select" name="flight1Id" value={customSessionData.flight1Id} onChange={handleCustomChange} required disabled={!user}>
                    <option value="">Odaberite let</option>
                    {flights.map(flight => (
                      <option key={flight.id} value={flight.id}>
                        {`${flight.Airline?.name || 'N/A'} - ${flight.flight_number} - ${flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : 'N/A'} - ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Let 2 (Današnji):</label>
                  <select className="form-select" name="flight2Id" value={customSessionData.flight2Id} onChange={handleCustomChange} required disabled={!user}>
                    <option value="">Odaberite let</option>
                    {flights.map(flight => (
                      <option key={flight.id} value={flight.id}>
                        {`${flight.Airline?.name || 'N/A'} - ${flight.flight_number} - ${flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : 'N/A'} - ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-success btn-lg" disabled={!user}> {/* Changed to type="submit" */}
                  Pokreni dvostruki Check-in
                </button>
              </div>
            </form> {/* Added form wrapper */}
          </div>
        </div>
      )}

      {/* Active Sessions List - moved before Notice Session Form */}
      <div className="card mt-5">
        <div className="card-body">
          <h3 className="mb-4 text-center">Aktivni Check-in, Boarding i Sesije obavještenja</h3>
          {activeSessions.length === 0 ? (
            <div className="alert alert-info">Nema aktivnih sesija</div>
          ) : (
            <div className="active-sessions">
              {activeSessions.map(session => {
                 // Use session.flight for standard sessions, session.CustomFlightData for custom
                 const displayData = session.flight || session.CustomFlightData; 
                 // Access nested data correctly
                 const airlineName = displayData?.Airline?.name || 'N/A'; 
                 const flightNumber = displayData?.flight_number || 'N/A';
                 
                 // Properly format destination based on whether it's a dual flight session
                 let destination;
                 if (displayData?.DestinationInfo) {
                   if (displayData.DestinationInfo.name && displayData.DestinationInfo.name.includes('/')) {
                     // This is a dual flight session - don't repeat IATA codes
                     destination = displayData.DestinationInfo.name;
                   } else {
                     // Standard single flight
                     destination = `${displayData.DestinationInfo.name} (${displayData.DestinationInfo.code})`;
                   }
                 } else {
                   destination = displayData?.destination || 'N/A';
                 }
                 
                 let sessionTypeClass = '';
                 let sessionTypeText = session.sessionType;
                 if (session.sessionType === 'check-in') { sessionTypeClass = 'check-in'; }
                 else if (session.sessionType === 'boarding') { sessionTypeClass = 'boarding'; }
                 else if (session.sessionType === 'notice') { sessionTypeClass = 'notice'; sessionTypeText = 'Obavještenje'; }

                 return (
                    <div key={session.id} className="active-session-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5>{flightNumber} - {destination} ({airlineName})</h5>
                            <span className={`badge ${sessionTypeClass} me-2`}>{sessionTypeText}</span>
                            <span className="badge bg-secondary me-2">Ekran: {getPageAlias(session.pageId)}</span>
                            {session.isPriority && <span className="badge bg-warning me-2">Prioritet</span>}
                            {/* Added specific class and removed inline style */}
                            <small className="text-muted session-start-time"> 
                              Početak: {session.startTime ? new Date(session.startTime).toLocaleString('bs-BA') : 'N/A'}
                            </small>
                        </div>
                        <BsButton type="button" variant="danger" size="sm" onClick={() => handleCloseSession(session.id)} disabled={!user} className="ms-3">Zatvori sesiju</BsButton> {/* Added type="button" */}
                       </div>
                       <div className="notification-section mt-2 pt-2 border-top">
                           {editingNotificationSessionId === session.id ? (
                              <div className="d-flex align-items-center">
                                  <Form.Control
                                      as="textarea" // Change to textarea
                                      rows={10} // Keep rows for initial estimate
                                      style={{ minHeight: '220px' }} // Add minimum height style
                                      value={tempNotificationText}
                                      onChange={(e) => setTempNotificationText(e.target.value)}
                                      placeholder="Unesite obavještenje..."
                                      className="me-2 notification-input"
                                  />
                                  <div className="d-flex flex-column"> {/* Stack buttons vertically */}
                                      <BsButton type="button" variant="success" size="sm" onClick={() => handleSaveNotification(session.id)} disabled={!user} className="mb-1">Sačuvaj</BsButton> {/* Added type="button" */}
                                      <BsButton type="button" variant="secondary" size="sm" onClick={handleCancelEditNotification}>Odustani</BsButton> {/* Added type="button" */}
                                  </div>
                              </div>
                           ) : (
                              <div className="d-flex justify-content-between align-items-center">
                                  <div style={{ flexGrow: 1, marginRight: '10px' }}>
                                      <small className="text-muted">Obavještenje: </small>
                                      {/* Changed to display session.notificationText */}
                                      <span style={{ color: '#ffffff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{session.notificationText || '(Nema)'}</span>
                                  </div>
                                  {/* Changed to pass session.notificationText to edit function */}
                                  <BsButton type="button" variant="outline-info" size="sm" onClick={() => handleEditNotificationClick(session.id, session.notificationText)} disabled={!user} style={{ flexShrink: 0 }}> {/* Added type="button" */}
                                      {session.notificationText ? 'Uredi' : 'Dodaj'} Obavještenje
                                  </BsButton>
                               </div>
                            )}
                          </div>
                     </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notice Session Form - moved after Active Sessions List */}
      <div className="session-form notice-session-form">
        <div className="card-body">
          <h4><i className="bi bi-exclamation-triangle-fill"></i> Sesija obavještenja</h4>
          {/* Row 1: Page and Flight */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="noticePageId" className="form-label">Ekran:</label>
              <select id="noticePageId" className="form-select" name="pageId" value={noticeSessionData.pageId} onChange={handleNoticeChange} disabled={!user}>
                {pages.sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                      .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label htmlFor="noticeFlightId" className="form-label">Let (Današnji):</label>
              <select id="noticeFlightId" className="form-select" name="flightId" data-form="notice" value={noticeSessionData.flightId} onChange={handleNoticeChange} disabled={!user} required>
                <option value="">Odaberite let</option>
                {flights.map(flight => (
                  <option key={flight.id} value={flight.id}>
                    {/* Display Destination Name and Code */}
                    {`${flight.Airline?.name || 'N/A'} - ${flight.flight_number} - ${flight.DestinationInfo ? `${flight.DestinationInfo.name} (${flight.DestinationInfo.code})` : 'N/A'} - ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Template Selection */}
          <div className="row mb-3">
            <div className="col-md-8"> {/* Adjusted width */}
              <label htmlFor="templateSelect" className="form-label">Odaberi Šablon:</label>
              <select id="templateSelect" className="form-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} disabled={!user || notificationTemplates.length === 0}>
                <option value="">-- Bez šablona --</option>
                {notificationTemplates.map(template => (<option key={template.id} value={template.id}>{template.name}</option>))}
              </select>
            </div>
          </div> {/* This closing div corresponds to the "Row 2: Template Selection" div */}

          {/* Row 2.5: Optional Inputs */}
          <div className="row mb-3">
              {/* New Time Input */}
              <div className="col-md-3">
                 <label htmlFor="noticeNewTime" className="form-label">Novo Vrijeme:</label>
                 <input
                     type="time"
                     id="noticeNewTime"
                     name="new_time"
                     className="form-control"
                     value={noticeSessionData.new_time}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
              {/* New Airport Input */}
              <div className="col-md-3">
                 <label htmlFor="noticeNewAirport" className="form-label">Novi Aerodrom (Opciono):</label>
                 <input
                     type="text"
                     id="noticeNewAirport"
                     name="new_airport"
                     className="form-control"
                     placeholder="Npr. Sarajevo (SJJ)"
                     value={noticeSessionData.new_airport}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
              {/* Counter Number Input */}
              <div className="col-md-3">
                 <label htmlFor="noticeCounterNumber" className="form-label">Broj Šaltera (Opciono):</label>
                 <input
                     type="text"
                     id="noticeCounterNumber"
                     name="counter_number"
                     className="form-control"
                     placeholder="Npr. 1-3"
                     value={noticeSessionData.counter_number}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
              {/* Hours Input */}
              <div className="col-md-3">
                 <label htmlFor="noticeHours" className="form-label">Sati:</label>
                 <input
                     type="text"
                     id="noticeHours"
                     name="hours"
                     className="form-control"
                     placeholder="Npr. 2 sata"
                     value={noticeSessionData.hours}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
          </div>
          {/* Row 2.75: More Optional Inputs */}
          <div className="row mb-3">
              {/* Check-in Time Input */}
              <div className="col-md-3">
                 <label htmlFor="noticeCheckinTime" className="form-label">Vrijeme prijave/check-ina (Opciono):</label>
                 <input
                     type="time"
                     id="noticeCheckinTime"
                     name="checkin_time"
                     className="form-control"
                     value={noticeSessionData.checkin_time}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
              {/* Location Input */}
              <div className="col-md-9"> {/* Wider for location */}
                 <label htmlFor="noticeLocation" className="form-label">Lokacija (Opciono):</label>
                 <input
                     type="text"
                     id="noticeLocation"
                     name="location"
                     className="form-control"
                     placeholder="Npr. Šalteri 1-3 / Gate 1"
                     value={noticeSessionData.location}
                     onChange={handleNoticeChange}
                     disabled={!user}
                 />
              </div>
          </div>

          {/* Row 3: Template Preview & Copy Button */}
          {selectedTemplate && (
            <div className="row mb-3 align-items-center">
              <div className="col-md-10">
                <label className="form-label">Pregled Šablona (Bosanski):</label>
                <div className="template-preview form-control" style={{ minHeight: '220px', whiteSpace: 'pre-wrap' }}>
                  {selectedTemplate.text_bs || '(Nema teksta na bosanskom)'}
                </div>
              </div>
              <div className="col-md-2 d-flex align-self-end justify-content-end">
                <BsButton type="button" variant="secondary" onClick={handleCopyAllLanguages} disabled={!user || !noticeSessionData.flightId} title="Kopiraj obrađeni tekst za sve jezike" className="w-100"> {/* Added type="button" */}
                  <FiCopy className="me-1" /> Dodaj
                </BsButton>
              </div>
            </div>
          )}

           {/* Row 4: Notification Text Area */}
           <div className="mb-3">
              <label htmlFor="noticeText" className="form-label fw-bold">Tekst Obavještenja (Zalijepite kopirani tekst ovdje i uredite po potrebi):</label>
              <textarea className="form-control notice-textarea" id="noticeText" placeholder="Unesite ili zalijepite tekst obavještenja..." name="notification_text" rows="10" value={noticeSessionData.notification_text} onChange={handleNoticeChange} disabled={!user} required></textarea>
               {/* Added specific class and removed inline style */}
               <small className="form-text text-muted notification-helper-text"> 
                 Placeholders {'{flight_number}'}, {'{destination}'}, {'{airline_name}'}, {'{departure_city}'} (uvijek Tuzla), {'{time}'}, {'{new_airport}'}, {'{counter_number}'}, {'{hours}'}, {'{checkin_time}'}, i {'{location}'} će biti automatski zamijenjeni vrijednostima iznad (ako su unesene) prilikom klika na "Umetni". Ručno popunite ostale specifične detalje ako je potrebno.
               </small>
            </div>

          {/* Row 5: Submit Button */}
          <div className="d-grid">
            <button type="button" className="btn btn-warning btn-lg" onClick={handleNoticeSubmit} disabled={!noticeSessionData.flightId || !noticeSessionData.notification_text || !user}> {/* Added type="button" */}
              Pokreni sesiju obavještenja
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default CheckIn;
