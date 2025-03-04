import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AirlineManagement.css';

function AirlineManagement() {
  const [airlines, setAirlines] = useState([]);
  const [newAirline, setNewAirline] = useState({
    name: '',
    logo_url: '',
    iata_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // Dohvati sve aviokompanije iz backend-a
  const fetchAirlines = async () => {
    try {
      const response = await axios.get('http://localhost:5001/airlines');
      if (Array.isArray(response.data)) {
        setAirlines(response.data);
      } else {
        setError('Podaci nisu u očekivanom formatu.');
      }
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja aviokompanija.');
    } finally {
      setLoading(false);
    }
  };

  // Pozovi `fetchAirlines` kada se komponenta montira
  useEffect(() => {
    fetchAirlines();
  }, []);

  // Handler za promjenu u formi za dodavanje nove aviokompanije
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAirline((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validacija obaveznih polja
      if (!newAirline.name || !newAirline.logo_url || !newAirline.iata_code) {
        return alert('Sva polja su obavezna!');
      }
  
      // Slanje podataka na server
      const response = await axios.post('http://localhost:5001/airlines', newAirline, {
        headers: {
          'Content-Type': 'application/json', // Osigurajte da šaljete JSON
        },
      });
  
      // Ažuriranje stanja i resetovanje forme
      setAirlines([...airlines, response.data]);
      setNewAirline({ name: '', logo_url: '', iata_code: '' });
      alert('Aviokompanija uspješno dodana!');
    } catch (err) {
      console.error('Error creating airline:', err);
      alert('Greška prilikom dodavanja aviokompanije.');
    }
  };
  // Handler za brisanje aviokompanije
  const handleDelete = async (id) => {
    try {
      if (window.confirm('Jeste li sigurni da želite obrisati ovu aviokompaniju?')) {
        await axios.delete(`http://localhost:5001/airlines/${id}`);
        setAirlines(airlines.filter((airline) => airline.id !== id));
        alert('Aviokompanija uspješno obrisana!');
      }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja aviokompanije.');
    }
  };

  if (loading) return <p className="loading-message">Učitavanje aviokompanija...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="airline-management-container">
      <h1 className="title">Aviokompanije</h1>

      {/* Forma za dodavanje nove aviokompanije */}
      <form onSubmit={handleSubmit} className="airline-form">
        <h2 className="form-title">Dodaj novu</h2>
        <div className="form-group">
          <label>
            Naziv:
            <input
              type="text"
              name="name"
              value={newAirline.name}
              onChange={handleChange}
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            URL Loga:
            <input
              type="url"
              name="logo_url"
              value={newAirline.logo_url}
              onChange={handleChange}
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            IATA Kod:
            <input
              type="text"
              name="iata_code"
              value={newAirline.iata_code}
              onChange={handleChange}
              required
              className="input-field"
            />
          </label>
        </div>
        <button type="submit" className="submit-button">Dodaj Aviokompaniju</button>
      </form>

      {/* Prikaz postojećih aviokompanija */}
      <h2 className="list-title">Popis Aviokompanija</h2>
      <table className="airline-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Naziv</th>
            <th>Logo</th>
            <th>IATA Kod</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {airlines.map((airline) => (
            <tr key={airline.id} className="table-row">
              <td>{airline.id}</td>
              <td>{airline.name}</td>
              <td>
                <img src={airline.logo_url} alt={`${airline.name} logo`} className="airline-logo" />
              </td>
              <td>{airline.iata_code}</td>
              <td>
                <button onClick={() => handleDelete(airline.id)} className="delete-button">Obriši</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AirlineManagement;



