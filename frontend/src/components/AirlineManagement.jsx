import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AirlineManagement.css';
import config from '../config';
import { useAuth } from './AuthProvider';

function AirlineManagement() {
  const [airlines, setAirlines] = useState([]);
  const [newAirline, setNewAirline] = useState({
    name: '',
    logo_url: '', // This will now store the relative path like /uploads/logo.png
    iata_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [logoImages, setLogoImages] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState('');


  // Dohvati sve aviokompanije iz backend-a
  const fetchAirlines = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/airlines`);
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

  // Fetch airlines and logo images on component mount
  useEffect(() => {
    const fetchLogoImages = async () => {
      try {
        setImageLoading(true);
        setImageError(''); // Reset error on new fetch
        const response = await axios.get(`${config.apiUrl}/api/content/images`); // Use the existing endpoint
        if (Array.isArray(response.data)) {
          setLogoImages(response.data); // response.data should be like ['/uploads/img1.png', '/uploads/img2.png']
        } else {
          setImageError('Lista slika nije u očekivanom formatu.');
          setLogoImages([]); // Ensure it's an array
        }
      } catch (err) {
        console.error('Error fetching logo images:', err);
        setImageError('Greška prilikom dohvaćanja slika logotipa.');
        setLogoImages([]); // Ensure it's an array on error
      } finally {
        setImageLoading(false);
      }
    };

    fetchLogoImages();
    fetchAirlines(); // Keep fetching airlines
  }, []);

  // Handler for form changes (input and select)
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
      // Validation: name and iata_code are required, logo_url is optional but should be selected if dropdown is used
      if (!newAirline.name || !newAirline.iata_code) {
        return alert('Naziv i IATA kod su obavezni!');
      }
      // Logo is now optional from dropdown, backend handles null if '' is selected
      // if (!newAirline.logo_url) {
      //   return alert('Molimo izaberite logo!');
      // }

      if (!user || !user.token) {
        setError('Morate biti prijavljeni kao administrator da biste dodali aviokompaniju');
        return;
      }
  
      // Slanje podataka na server
      const response = await axios.post(`${config.apiUrl}/airlines`, newAirline, {
        headers: {
          'Content-Type': 'application/json', // Osigurajte da šaljete JSON
          'Authorization': `Bearer ${user.token}`
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
      if (!user || !user.token) {
        setError('Morate biti prijavljeni kao administrator da biste obrisali aviokompaniju');
        return;
      }
      
      if (window.confirm('Jeste li sigurni da želite obrisati ovu aviokompaniju?')) {
        await axios.delete(`${config.apiUrl}/airlines/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
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
        {/* Replace URL input with Select dropdown */}
        <div className="form-group">
          <label>
            Logo:
            {imageLoading ? (
              <span> Učitavanje slika...</span>
            ) : imageError ? (
              <span className="error-message"> {imageError}</span>
            ) : (
              <select
                name="logo_url"
                value={newAirline.logo_url} // Value is the relative path like /uploads/img.png
                onChange={handleChange}
                // required // Logo is now optional
                className="input-field"
              >
                <option value="">-- Izaberi logo (Opciono) --</option>
                {logoImages.map((imageUrl) => {
                  // Extract filename for display text
                  const filename = imageUrl.split('/').pop();
                  return (
                    // Keep imageUrl (relative path) as the value
                    <option key={imageUrl} value={imageUrl}>
                      {filename} {/* Display only the filename */}
                    </option>
                  );
                })}
              </select>
            )}
            {/* Optional Preview */}
            {newAirline.logo_url && (
              <img
                src={`${config.apiUrl}${newAirline.logo_url}`} // Construct full URL for preview
                alt="Logo Preview"
                className="logo-preview" // Add CSS for this class
                // Basic error handling for preview
                onError={(e) => { e.target.style.display = 'none'; e.target.src = ''; }}
                onLoad={(e) => { e.target.style.display = 'inline-block'; }}
                style={{ display: 'none' }} // Hide initially until loaded
              />
            )}
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
                {/* Construct full URL using backend base URL and relative path */}
                {airline.logo_url && airline.logo_url.startsWith('/uploads/') ? (
                  <img
                    src={`${config.apiUrl}${airline.logo_url}`}
                    alt={`${airline.name} logo`}
                    className="airline-logo"
                    // Add better error handling for table images
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'https://via.placeholder.com/80x40?text=No+Logo'; // Placeholder
                      e.target.alt = 'Logo nije dostupan';
                    }}
                  />
                ) : airline.logo_url ? ( // Handle potential old absolute URLs if any exist
                  <img
                    src={airline.logo_url}
                    alt={`${airline.name} logo`}
                    className="airline-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80x40?text=Error';
                      e.target.alt = 'Greška pri učitavanju loga';
                    }}
                  />
                ) : (
                  <span>Nema loga</span>
                )}
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
