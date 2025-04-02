// components/DestinationManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import './DestinationManagement.css';
import config from '../config';

const DestinationManager = () => {
  const [destinations, setDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/destinations`);
      setDestinations(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja destinacija');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni kao administrator da biste dodali destinaciju');
      return;
    }
    
    try {
      console.log('New Destination:', newDestination);
      await axios.post(`${config.apiUrl}/api/destinations`, newDestination, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
      setNewDestination({ name: '', code: '' });
      fetchDestinations();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Nemate dozvolu za dodavanje destinacija');
      } else {
        setError('Greška prilikom dodavanja destinacije');
      }
    }
  };

  const handleDelete = async (id) => {
    setError('');
    
    if (!user || !user.token) {
      setError('Morate biti prijavljeni kao administrator da biste obrisali destinaciju');
      return;
    }
    
    try {
      await axios.delete(`${config.apiUrl}/api/destinations/${id}`, {
        headers: { 
          Authorization: `Bearer ${user.token}` 
        }
      });
      fetchDestinations();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Nemate dozvolu za brisanje destinacija');
      } else {
        setError('Greška prilikom brisanja destinacije');
      }
    }
  };

  return (
    <div className="destination-management-container"> {/* Changed container class */}
      <h2>Upravljanje Destinacijama</h2> {/* Added title */}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdd}>
        <input
          value={newDestination.name}
          onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
          placeholder="Naziv destinacije"
          required
        />
      <input
  value={newDestination.code}
  onChange={(e) => setNewDestination({...newDestination, code: e.target.value.toUpperCase()})}
  placeholder="IATA kod"
  required
  maxLength="3"
/>
        <button type="submit" disabled={!user || !user.token}>
          Dodaj destinaciju
        </button>
      </form>

      <div className="destinations-list">
        {destinations.length > 0 ? (
          destinations.map(dest => (
            <div key={dest.id} className="destination-item">
              {dest.name} ({dest.code})
              <button 
                onClick={() => handleDelete(dest.id)}
                disabled={!user || !user.token}
              >
                Obriši
              </button>
            </div>
          ))
        ) : (
          <p>Nema dostupnih destinacija</p>
        )}
      </div>
    </div>
  );
};

export default DestinationManager;
