// components/FlightNumberManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import './FlightNumberManager.css';
import config from '../config';

const FlightNumberManager = () => {
  const [flightNumbers, setFlightNumbers] = useState([]);
  const [newFlightNumber, setNewFlightNumber] = useState({
    number: '',
    destination: '',
    is_departure: true
  });
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchFlightNumbers();
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni!');
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
        destination: '',
        is_departure: true
      });
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
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni!');
    }
    
    try {
      await axios.delete(`${config.apiUrl}/flight-numbers/${id}`, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
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

  return (
    <div className="flight-number-manager">
      <h2>Upravljanje brojevima letova</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleAdd}>
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
          <label>Destinacija:</label>
          <input
  value={newFlightNumber.destination}
  onChange={(e) => setNewFlightNumber({...newFlightNumber, destination: e.target.value.toUpperCase()})}
  placeholder="npr. BEG"
  required
/>
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
        
        <button type="submit" disabled={!user || !user.token}>Dodaj broj leta</button>
      </form>

      <div className="flight-numbers-list">
        <h3>Postojeći brojevi letova</h3>
        <table>
          <thead>
            <tr>
              <th>Broj leta</th>
              <th>Destinacija</th>
              <th>Tip</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {flightNumbers.map(flight => (
              <tr key={flight.id}>
                <td>{flight.number}</td>
                <td>{flight.destination}</td>
                <td>{flight.is_departure ? 'Odlazak' : 'Dolazak'}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(flight.id)}
                    disabled={!user || !user.token}
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlightNumberManager;
