// components/FlightNumberManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import './FlightNumberManager.css';
import config from '../config';

const FlightNumberManager = () => {
  const [flightNumbers, setFlightNumbers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [newFlightNumber, setNewFlightNumber] = useState({
    number: '',
    airline_code: '',
    destination: '',
    is_departure: true
  });
  const [editingFlightNumber, setEditingFlightNumber] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterAirlineCode, setFilterAirlineCode] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchFlightNumbers();
    fetchDestinations();
    fetchAirlines();
  }, []);

  const fetchFlightNumbers = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/flight-numbers`);
      setFlightNumbers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja brojeva letova');
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/destinations`);
      setDestinations(response.data);
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja destinacija');
    }
  };

  const fetchAirlines = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/airlines`);
      setAirlines(response.data);
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja aviokompanija');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni!');
      return;
    }
    
    try {
      console.log('New Flight Number:', newFlightNumber);
      await axios.post(`${config.apiUrl}/flight-numbers`, newFlightNumber, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
      setNewFlightNumber({
        number: '',
        airline_code: '',
        destination: '',
        is_departure: true
      });
      setSuccess('Broj leta uspješno dodan!');
      fetchFlightNumbers();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Nemate dozvolu za dodavanje brojeva letova');
      } else {
        setError('Greška prilikom dodavanja broja leta');
      }
    }
  };

  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni!');
      return;
    }
    
    try {
      await axios.delete(`${config.apiUrl}/flight-numbers/${id}`, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
      setSuccess('Broj leta uspješno obrisan!');
      fetchFlightNumbers();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Nemate dozvolu za brisanje brojeva letova');
      } else {
        setError('Greška prilikom brisanja broja leta');
      }
    }
  };
  
  const handleEdit = (flight) => {
    setEditingFlightNumber(flight);
    setNewFlightNumber({
      number: flight.number,
      airline_code: flight.airline_code || '',
      destination: flight.destination,
      is_departure: flight.is_departure
    });
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni!');
      return;
    }
    
    try {
      await axios.put(`${config.apiUrl}/flight-numbers/${editingFlightNumber.id}`, newFlightNumber, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
      setSuccess('Broj leta uspješno ažuriran!');
      setNewFlightNumber({
        number: '',
        airline_code: '',
        destination: '',
        is_departure: true
      });
      setEditingFlightNumber(null);
      fetchFlightNumbers();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Nemate dozvolu za uređivanje brojeva letova');
      } else {
        setError('Greška prilikom uređivanja broja leta');
      }
    }
  };
  
  const handleCancel = () => {
    setEditingFlightNumber(null);
    setNewFlightNumber({
      number: '',
      airline_code: '',
      destination: '',
      is_departure: true
    });
  };

  const handleExportCSV = () => {
    try {
      // Apply the same filters as the table
      const filteredFlights = flightNumbers.filter(flight => {
        if (filterAirlineCode && flight.airline_code !== filterAirlineCode) return false;
        if (filterDestination && flight.destination !== filterDestination) return false;
        if (filterType === 'departure' && !flight.is_departure) return false;
        if (filterType === 'arrival' && flight.is_departure) return false;
        return true;
      });

      if (filteredFlights.length === 0) {
        setError('Nema podataka za eksport');
        return;
      }

      // Create CSV header
      const csvHeader = 'Broj leta,IATA kod aviokompanije,Naziv aviokompanije,Destinacija,Tip leta\n';

      // Create CSV rows
      const csvRows = filteredFlights.map(flight => {
        const airline = airlines.find(a => a.iata_code === flight.airline_code);
        const airlineCode = flight.airline_code || '-';
        const airlineName = airline ? airline.name : '-';
        const flightType = flight.is_departure ? 'Odlazak' : 'Dolazak';

        // Escape commas in fields by wrapping in quotes
        return `"${flight.number}","${airlineCode}","${airlineName}","${flight.destination}","${flightType}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `mapiranje_letova_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Uspješno eksportovano ${filteredFlights.length} mapiranja!`);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Greška prilikom eksporta CSV-a');
    }
  };

  return (
    <div className="flight-number-manager">
      <h2>Upravljanje brojevima letova</h2>

      <div className="info-box">
        <h4><i className="bi bi-info-circle-fill me-2"></i>Informacije</h4>
        <p>
          Ovdje maprate <strong>aviokompanije</strong>, <strong>destinacije</strong> i <strong>tipove letova</strong> sa <strong>brojevima letova</strong>.
          Ova mapiranja se koriste pri CSV importu kako bi sistem znao koji broj leta koristiti
          za svaku kombinaciju.
        </p>
        <p>
          <strong>Primjer:</strong> Wizz Air → Köln Bonn (Odlazak) → W64299, Wizz Air → Köln Bonn (Dolazak) → W64300
        </p>
        <p>
          <small><i className="bi bi-lightbulb-fill me-1"></i>Svaka kombinacija aviokompanija + destinacija treba da ima <strong>2 mapiranja</strong>: jedno za odlazak i jedno za dolazak.</small>
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={editingFlightNumber ? handleUpdate : handleAdd}>
        <h3>{editingFlightNumber ? 'Uredi broj leta' : 'Dodaj novi broj leta'}</h3>
        <div>
          <label>Broj leta:</label>
          <input
            value={newFlightNumber.number}
            onChange={(e) => setNewFlightNumber({...newFlightNumber, number: e.target.value})}
            placeholder="npr. JU123"
            required
          />
        </div>

        <div>
          <label>Aviokompanija:</label>
          <select
            value={newFlightNumber.airline_code}
            onChange={(e) => setNewFlightNumber({...newFlightNumber, airline_code: e.target.value})}
          >
            <option value="">-- Odaberite aviokompaniju (opcionalno) --</option>
            {airlines.map(airline => (
              <option key={airline.id} value={airline.iata_code}>
                {airline.iata_code} - {airline.name}
              </option>
            ))}
          </select>
          <small className="helper-text">
            Odaberite aviokompaniju za specifično mapiranje (opcionalno za stare zapise)
          </small>
        </div>

        <div>
          <label>Destinacija:</label>
          <select
            value={newFlightNumber.destination}
            onChange={(e) => setNewFlightNumber({...newFlightNumber, destination: e.target.value})}
            required
          >
            <option value="">-- Odaberite destinaciju --</option>
            {destinations.map(dest => (
              <option key={dest.id} value={dest.name}>
                {dest.code} - {dest.name}
              </option>
            ))}
          </select>
          <small className="helper-text">
            Odaberite tačan naziv destinacije iz liste
          </small>
        </div>
        
        <div>
          <label>Tip:</label>
          <select
            value={newFlightNumber.is_departure}
            onChange={(e) => setNewFlightNumber({...newFlightNumber, is_departure: e.target.value === 'true'})}
          >
            <option value="true">Odlazak</option>
            <option value="false">Dolazak</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="submit" disabled={!user || !user.token}>
            {editingFlightNumber ? 'Sačuvaj promjene' : 'Dodaj broj leta'}
          </button>
          
          {editingFlightNumber && (
            <button 
              type="button" 
              onClick={handleCancel} 
              className="cancel-button"
            >
              Odustani
            </button>
          )}
        </div>
      </form>

      <div className="flight-numbers-list">
        <h3>Postojeća mapiranja</h3>

        <div className="filters-section">
          <h4>Filteri</h4>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Aviokompanija:</label>
              <select
                value={filterAirlineCode}
                onChange={(e) => setFilterAirlineCode(e.target.value)}
              >
                <option value="">Sve aviokompanije</option>
                {airlines.map(airline => (
                  <option key={airline.id} value={airline.iata_code}>
                    {airline.iata_code} - {airline.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Destinacija:</label>
              <select
                value={filterDestination}
                onChange={(e) => setFilterDestination(e.target.value)}
              >
                <option value="">Sve destinacije</option>
                {destinations.map(dest => (
                  <option key={dest.id} value={dest.name}>
                    {dest.code} - {dest.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Tip leta:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Svi tipovi</option>
                <option value="departure">Samo odlasci</option>
                <option value="arrival">Samo dolasci</option>
              </select>
            </div>

            <button
              className="reset-button"
              onClick={() => { setFilterDestination(''); setFilterAirlineCode(''); setFilterType('all'); }}
            >
              Resetuj filtere
            </button>

            <button
              className="export-button"
              onClick={handleExportCSV}
            >
              <i className="bi bi-download me-2"></i>
              Eksportuj CSV
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Broj leta</th>
              <th>Aviokompanija</th>
              <th>Destinacija</th>
              <th>Tip</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {flightNumbers
              .filter(flight => {
                // Filter by airline
                if (filterAirlineCode && flight.airline_code !== filterAirlineCode) {
                  return false;
                }
                // Filter by destination
                if (filterDestination && flight.destination !== filterDestination) {
                  return false;
                }
                // Filter by type
                if (filterType === 'departure' && !flight.is_departure) {
                  return false;
                }
                if (filterType === 'arrival' && flight.is_departure) {
                  return false;
                }
                return true;
              })
              .map(flight => {
                // Find airline name from airlines array
                const airline = airlines.find(a => a.iata_code === flight.airline_code);
                const airlineDisplay = airline
                  ? `${flight.airline_code} - ${airline.name}`
                  : (flight.airline_code || '-');

                return (
                  <tr key={flight.id}>
                    <td><strong>{flight.number}</strong></td>
                    <td>{airlineDisplay}</td>
                    <td>{flight.destination}</td>
                    <td>
                      <span className={`flight-type-badge ${flight.is_departure ? 'departure' : 'arrival'}`}>
                        {flight.is_departure ? (
                          <>
                            <i className="bi bi-airplane-fill"></i>
                            Odlazak
                          </>
                        ) : (
                          <>
                            <i className="bi bi-airplane-fill"></i>
                            Dolazak
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(flight)}
                          disabled={!user || !user.token}
                          className="edit-button"
                        >
                          Uredi
                        </button>
                        <button
                          onClick={() => handleDelete(flight.id)}
                          disabled={!user || !user.token}
                          className="delete-button"
                        >
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {flightNumbers.filter(flight => {
              if (filterAirlineCode && flight.airline_code !== filterAirlineCode) return false;
              if (filterDestination && flight.destination !== filterDestination) return false;
              if (filterType === 'departure' && !flight.is_departure) return false;
              if (filterType === 'arrival' && flight.is_departure) return false;
              return true;
            }).length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  Nema mapiranja koja odgovaraju odabranim filterima
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="stats-box">
          <strong>Ukupno mapiranja: </strong>
          {flightNumbers.filter(flight => {
            if (filterAirlineCode && flight.airline_code !== filterAirlineCode) return false;
            if (filterDestination && flight.destination !== filterDestination) return false;
            if (filterType === 'departure' && !flight.is_departure) return false;
            if (filterType === 'arrival' && flight.is_departure) return false;
            return true;
          }).length} / {flightNumbers.length}
        </div>
      </div>
    </div>
  );
};

export default FlightNumberManager;
