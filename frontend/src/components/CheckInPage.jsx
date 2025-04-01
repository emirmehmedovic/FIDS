// CheckInPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import axios from 'axios';
import { Spinner, Form, Button as BsButton } from 'react-bootstrap'; // Import Form and Button
import './CheckInPage.css';
import config from '../config';
import { toast } from 'react-toastify';
import { useAuth } from './AuthProvider';

// Assuming bootstrap icons are included globally or via CDN
// Otherwise, you might need: import 'bootstrap-icons/font/bootstrap-icons.css';

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
  const [pages, setPages] = useState([]); // State for available pages/screens
  const { user } = useAuth();

  // State for custom session form ("Session by Flight Number")
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [flightNumbers, setFlightNumbers] = useState([]); // Holds all unique flight numbers
  const [customSessionData, setCustomSessionData] = useState({
    pageId: 'C1',
    sessionType: 'check-in',
    isPriority: false,
    custom_airline_id: '',
    custom_flight_number: '', // Selected flight number
    custom_destination1: '',
    custom_destination2: '',
  });

  // State for editing notifications on active sessions
  const [editingNotificationSessionId, setEditingNotificationSessionId] = useState(null);
  const [tempNotificationText, setTempNotificationText] = useState('');

  // --- State for Notice Session Form ---
  const [noticeSessionData, setNoticeSessionData] = useState({
    pageId: 'C1', // Default or based on available pages
    flightId: '', // Needs to be selected
    notification_text: '',
    // isPriority: false, // Removed priority state
  });
  // ------------------------------------

  // --- State for Notification Templates ---
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false); // To show/hide add/edit form
  const [newTemplateText, setNewTemplateText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null); // Holds the template being edited { id, text }
  // ---------------------------------------


  // Fetch initial data (pages, flights, airlines, destinations, flight numbers, sessions, templates)
  // Wrap fetchData in useCallback to stabilize its reference
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use user?.token to safely access token, might be null initially
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const requests = [
        axios.get(`${config.apiUrl}/api/content`), // Fetch all pages
        axios.get(`${config.apiUrl}/api/flights/daily-departures`), // Fetch daily flights
        axios.get(`${config.apiUrl}/api/airlines`),
        axios.get(`${config.apiUrl}/api/destinations`),
        axios.get(`${config.apiUrl}/api/flight-numbers`), // Fetch all flight numbers
        axios.get(`${config.apiUrl}/api/display/active`),
      ];
      // Only fetch templates if user is logged in
      if (user?.token) {
        requests.push(axios.get(`${config.apiUrl}/api/notification-templates`, { headers }));
      }

      const responses = await Promise.all(requests);
      const [pagesRes, flightsRes, airlinesRes, destinationsRes, flightNumbersRes, sessionsRes, templatesRes] = responses;


      const fetchedPages = pagesRes.data || [];
      setPages(fetchedPages); // Set pages state
      // Set default pageId for notice session if pages exist and user is logged in
       if (fetchedPages.length > 0 && !noticeSessionData.pageId && user) {
         const firstCheckinPage = fetchedPages.find(p => p.pageType === 'check-in');
         setNoticeSessionData(prev => ({ ...prev, pageId: firstCheckinPage ? firstCheckinPage.pageId : fetchedPages[0].pageId }));
      }
      setFlights(flightsRes.data || []);
      setAirlines(airlinesRes.data || []);
      setDestinations(destinationsRes.data || []);
      // Extract unique flight numbers for the custom form dropdown
      const uniqueFlightNumbers = [...new Set((flightNumbersRes.data || []).map(fn => fn.number))].sort();
      setFlightNumbers(uniqueFlightNumbers);
      setActiveSessions(sessionsRes.data || []);
      // Only set templates if the request was successful (user might not be logged in initially)
      if (templatesRes && templatesRes.data) {
        setNotificationTemplates(templatesRes.data);
      } else {
        setNotificationTemplates([]); // Clear templates if fetch failed or user not logged in
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Avoid showing auth errors for templates if user isn't logged in yet
      if (!(error.response?.status === 401 && error.config?.url?.includes('notification-templates'))) {
         toast.error('Greška pri učitavanju inicijalnih podataka.');
      }
       setNotificationTemplates([]); // Ensure templates are cleared on error
    } finally {
      setLoading(false);
    }
  }, [user, noticeSessionData.pageId]); // Add dependencies used inside fetchData


  // Refetch data when user logs in/out or fetchData changes
  useEffect(() => {
    fetchData();
  }, [user, fetchData]); // Add fetchData to the dependency array

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

  // Handle submission for the custom session form ("Session by Flight Number")
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
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
    setTempNotificationText(currentText || ''); // Set current text or empty string
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
            { notification_text: tempNotificationText },
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        toast.success('Obavještenje uspješno sačuvano!');
        setEditingNotificationSessionId(null); // Close editing input
        setTempNotificationText('');
        await refreshSessions(); // Refresh to show updated notification status
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
        sessionType: 'notice', // Hardcoded type
        isPriority: false, // Hardcode priority to false as it's removed from UI
        notification_text: noticeSessionData.notification_text,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      toast.success('Sesija obavještenja uspješno pokrenuta!');
      await refreshSessions();
      // Reset form
      setNoticeSessionData(prev => ({
        ...prev, // Keep pageId and priority potentially
        flightId: '',
        notification_text: '',
      }));
       // Reset flight dropdown visually if possible
       const noticeFlightSelect = document.querySelector('select[name="flightId"][data-form="notice"]');
       if (noticeFlightSelect) noticeFlightSelect.value = "";


    } catch (err) {
      console.error('Greška pri pokretanju sesije obavještenja:', err);
      toast.error(`Greška pri pokretanju sesije: ${err.response?.data?.message || err.message}`);
    }
  };
  // -----------------------------

  // --- Notification Template Handlers ---
  const refreshTemplates = async () => {
     if (!user) return; // Don't fetch if not logged in
     try {
       const response = await axios.get(`${config.apiUrl}/api/notification-templates`, {
         headers: { Authorization: `Bearer ${user.token}` }
       });
       setNotificationTemplates(response.data || []);
     } catch (error) {
       console.error('Greška pri osvježavanju primjera obavještenja:', error);
       toast.error('Greška pri osvježavanju primjera obavještenja.');
     }
   };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!newTemplateText.trim()) {
      toast.error('Tekst primjera ne može biti prazan.');
      return;
    }
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }

    const url = editingTemplate
      ? `${config.apiUrl}/api/notification-templates/${editingTemplate.id}`
      : `${config.apiUrl}/api/notification-templates`;
    const method = editingTemplate ? 'put' : 'post';

    try {
      await axios[method](url, { text: newTemplateText }, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(`Primjer obavještenja uspješno ${editingTemplate ? 'ažuriran' : 'kreiran'}!`);
      setNewTemplateText('');
      setEditingTemplate(null);
      setShowTemplateForm(false);
      await refreshTemplates(); // Refresh the list
    } catch (error) {
      console.error(`Greška pri ${editingTemplate ? 'ažuriranju' : 'kreiranju'} primjera:`, error);
      toast.error(`Greška pri ${editingTemplate ? 'ažuriranju' : 'kreiranju'} primjera: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplateText(template.text);
    setShowTemplateForm(true); // Show the form for editing
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovaj primjer obavještenja?')) {
      return;
    }
     if (!user) {
       toast.error('Morate biti prijavljeni.');
       return;
    }
    try {
      await axios.delete(`${config.apiUrl}/api/notification-templates/${templateId}`, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Primjer obavještenja uspješno obrisan!');
      await refreshTemplates(); // Refresh the list
    } catch (error) {
      console.error('Greška pri brisanju primjera:', error);
      toast.error(`Greška pri brisanju primjera: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCopyTemplate = (text) => {
    setNoticeSessionData(prev => ({ ...prev, notification_text: text }));
    toast.info('Tekst primjera kopiran u formu za sesiju obavještenja.');
  };

  const cancelTemplateEdit = () => {
     setEditingTemplate(null);
     setNewTemplateText('');
     setShowTemplateForm(false);
  };
  // ------------------------------------


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
                 {/* Dynamically populate pages */}
                 {pages.filter(p => p.pageType === 'check-in' || p.pageType === 'boarding')
                       .sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                       .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
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
                    {/* Dynamically populate pages */}
                    {pages.filter(p => p.pageType === 'check-in' || p.pageType === 'boarding')
                          .sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                          .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
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
                        {/* Populate with unique flight numbers */}
                        {flightNumbers.map(fn => (
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


      {/* Notice Session Form - Reverted to Standard Layout Structure */}
      <div className="card mb-4 session-form notice-session-form"> {/* Keep notice-session-form for potential future styling */}
        <div className="card-body"> {/* Reverted padding */}
          <h4> <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i> Sesija Obavještenja</h4> {/* Keep icon, adjust title style */}
          {/* Row mimicking Standard Session */}
          <div className="row mb-4"> {/* Use mb-4 like standard */}
            {/* Page Select */}
            <div className="col-md-4"> {/* Mimic standard layout */}
              <label htmlFor="noticePageId" className="form-label">Ekran:</label> {/* Standard label */}
              <select
                id="noticePageId" // Keep id
                className="form-select"
                name="pageId"
                value={noticeSessionData.pageId}
                onChange={handleNoticeChange}
                disabled={!user}
              >
                {/* Allow any page type for notice */}
                {pages
                  .sort((a, b) => a.pageId.localeCompare(b.pageId, undefined, { numeric: true }))
                  .map(p => <option key={p.pageId} value={p.pageId}>{getPageAlias(p.pageId)}</option>)}
              </select>
            </div>
            {/* Flight Select */}
            <div className="col-md-8"> {/* Use remaining width */}
              <label htmlFor="noticeFlightId" className="form-label">Let (Današnji):</label> {/* Standard label */}
              <select
                id="noticeFlightId" // Keep id
                className="form-select"
                name="flightId"
                data-form="notice" // Identifier for reset
                value={noticeSessionData.flightId}
                onChange={handleNoticeChange}
                disabled={!user}
                required
              >
                <option value="">Odaberite let</option>
                {flights.map(flight => (
                  <option key={flight.id} value={flight.id}>
                    {`${getAirlineName(flight.airline_id)} - ${flight.flight_number} - ${flight.destination} - ${new Date(flight.departure_time || flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </option>
                ))}
              </select>
            </div>
             {/* No Priority field */}
          </div>
           {/* Notification Text Area - Ensure full width */}
           <div className="mb-3"> {/* This div should span full width */}
             <label htmlFor="noticeText" className="form-label fw-bold">Tekst Obavještenja:</label> {/* Label restored */}
             <textarea
               className="form-control notice-textarea" // Keep class for styling
               id="noticeText"
               placeholder="Tekst Obavještenja..."
               name="notification_text"
               rows="6" // Increased rows further
               value={noticeSessionData.notification_text}
               onChange={handleNoticeChange}
               disabled={!user}
               required
             ></textarea>
           </div>

          <div className="d-grid">
            <button
              className="btn btn-warning btn-lg" // Changed color
              onClick={handleNoticeSubmit}
              disabled={!noticeSessionData.flightId || !noticeSessionData.notification_text || !user}
            >
              Pokreni Sesiju Obavještenja
            </button>
          </div>
        </div>
      </div>

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

                 // Determine badge class and display text based on sessionType
                 let sessionTypeClass = '';
                 let sessionTypeText = session.sessionType; // Default text
                 if (session.sessionType === 'check-in') {
                   sessionTypeClass = 'check-in';
                 } else if (session.sessionType === 'boarding') {
                   sessionTypeClass = 'boarding';
                 } else if (session.sessionType === 'notice') {
                   sessionTypeClass = 'notice'; // Use 'notice' class for styling
                   sessionTypeText = 'Obavještenje'; // Display text
                 }


                 return (
                    <div key={session.id} className="active-session-card">
                      {/* Session Info */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5>{flightNumber} - {destination} ({airlineName})</h5>
                            {/* Use the dynamic class and display text */}
                            <span className={`badge ${sessionTypeClass} me-2`}>
                              {sessionTypeText}
                            </span>
                            <span className="badge bg-secondary me-2">Ekran: {getPageAlias(session.pageId)}</span>
                            {session.isPriority && <span className="badge bg-warning me-2">Prioritet</span>}
                            <small className="text-muted">
                            Početak: {new Date(session.start_time).toLocaleString()}
                            </small>
                        </div>
                        <BsButton // Use BsButton alias
                          variant="danger"
                          size="sm"
                          onClick={() => handleCloseSession(session.id)}
                          disabled={!user}
                          className="ms-3"
                        >
                          Zatvori sesiju
                       </BsButton>
                       </div>

                       {/* Notification Section - Always show this section for all active sessions */}
                       {/* {(session.sessionType === 'notice' || session.notification_text) && ( */} {/* Removed outer condition */}
                         <div className="notification-section mt-2 pt-2 border-top">
                           {editingNotificationSessionId === session.id ? (
                              // Editing mode
                              <div className="d-flex align-items-center">
                                  <Form.Control
                                      type="text"
                                      value={tempNotificationText}
                                      onChange={(e) => setTempNotificationText(e.target.value)}
                                      placeholder="Unesite obavještenje..."
                                      className="me-2 notification-input" // Added class
                                  />
                                  <BsButton variant="success" size="sm" onClick={() => handleSaveNotification(session.id)} disabled={!user}>Sačuvaj</BsButton>
                                  <BsButton variant="secondary" size="sm" onClick={handleCancelEditNotification} className="ms-1">Odustani</BsButton>
                              </div>
                           ) : (
                              // Display mode
                              <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                      <small className="text-muted">Obavještenje: </small>
                                      {/* Display text or placeholder */}
                                      <span>{session.notification_text || '(Nema)'}</span>
                                  </div>
                                   {/* Allow editing for ALL session types */}
                                   {/* {session.sessionType === 'notice' && ( */} {/* Removed condition */}
                                      <BsButton
                                          variant="outline-info" // Keep button style consistent
                                          size="sm"
                                          onClick={() => handleEditNotificationClick(session.id, session.notification_text)}
                                          disabled={!user}
                                      >
                                          {session.notification_text ? 'Uredi' : 'Dodaj'} Obavještenje
                                      </BsButton>
                                    {/* )} */} {/* Removed condition */}
                               </div>
                            )}
                          </div>
                       {/* )} */} {/* Removed outer condition */}
                     </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notification Templates Management - Moved Here */}
      <div className="card mt-5"> {/* Changed margin top */}
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Primjeri Obavještenja</h4>
            <BsButton variant="outline-primary" size="sm" onClick={() => { setShowTemplateForm(!showTemplateForm); setEditingTemplate(null); setNewTemplateText(''); }} disabled={!user}>
             <i className={`bi ${showTemplateForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i> {/* Added icons */}
              {showTemplateForm ? (editingTemplate ? 'Zatvori Uređivanje' : 'Zatvori Dodavanje') : 'Dodaj Novi Primjer'}
            </BsButton>
          </div>

          {/* Add/Edit Template Form */}
          {showTemplateForm && (
            <Form onSubmit={handleTemplateSubmit} className="mb-3 p-3 border rounded">
              <h5>{editingTemplate ? 'Uredi Primjer' : 'Dodaj Novi Primjer'}</h5>
              <Form.Group className="mb-3">
                <Form.Label>Tekst Primjera</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newTemplateText}
                  onChange={(e) => setNewTemplateText(e.target.value)}
                  required
                  disabled={!user}
                />
              </Form.Group>
              <BsButton type="submit" variant="success" size="sm" disabled={!user}>
                {editingTemplate ? 'Sačuvaj Izmjene' : 'Dodaj Primjer'}
              </BsButton>
              <BsButton variant="secondary" size="sm" onClick={cancelTemplateEdit} className="ms-2">
                Odustani
              </BsButton>
            </Form>
          )}

          {/* List of Templates */}
          {notificationTemplates.length === 0 ? (
            <p>Nema sačuvanih primjera.</p>
          ) : (
            <ul className="list-group">
              {notificationTemplates.map(template => (
                <li key={template.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span style={{ whiteSpace: 'pre-wrap', flexGrow: 1, marginRight: '1rem' }}>{template.text}</span>
                  <div>
                    <BsButton variant="outline-secondary" size="sm" onClick={() => handleCopyTemplate(template.text)} className="me-1" title="Kopiraj u formu">
                     <i className="bi bi-clipboard"></i> Kopiraj {/* Added icon */}
                    </BsButton>
                    <BsButton variant="outline-warning" size="sm" onClick={() => handleEditTemplate(template)} className="me-1" disabled={!user}>
                     <i className="bi bi-pencil-square"></i> Uredi {/* Added icon */}
                    </BsButton>
                    <BsButton variant="outline-danger" size="sm" onClick={() => handleDeleteTemplate(template.id)} disabled={!user}>
                     <i className="bi bi-trash"></i> Obriši {/* Added icon */}
                    </BsButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div> {/* End of Notification Templates Card */}

    </div> // End of container
  );
}

export default CheckIn;
