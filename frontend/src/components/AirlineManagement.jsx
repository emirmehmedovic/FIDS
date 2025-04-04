import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AirlineManagement.css';
import config from '../config';
import { useAuth } from './AuthProvider';

function AirlineManagement() {
  const [airlines, setAirlines] = useState([]);
  const [newAirline, setNewAirline] = useState({
    name: '',
    logo_url: '',
    iata_code: '',
  });
  const [editingAirline, setEditingAirline] = useState(null); // State to hold the airline being edited
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
    fetchAirlines();
  }, []);

  // Handler for form changes (input and select) - Handles both add and edit forms
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editingAirline) {
      // Update editingAirline state
      setEditingAirline((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      // Update newAirline state
      setNewAirline((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Combined handler for form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAirline) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  // Handler for creating a new airline
  const handleCreate = async () => {
    const airlineData = newAirline; // Use data from newAirline state
    try {
      // Validation
      if (!airlineData.name || !airlineData.iata_code) {
        return alert('Naziv i IATA kod su obavezni!');
      }
      if (!user || !user.token) {
        setError('Morate biti prijavljeni kao administrator.');
        return;
      }
      const response = await axios.post(`${config.apiUrl}/airlines`, airlineData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
      });
      setAirlines([...airlines, response.data]);
      setNewAirline({ name: '', logo_url: '', iata_code: '' }); // Reset add form
      alert('Aviokompanija uspješno dodana!');
    } catch (err) {
      console.error('Error creating airline:', err);
      alert(`Greška prilikom dodavanja aviokompanije: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handler for updating an existing airline
  const handleUpdate = async () => {
    if (!editingAirline) return;
    const airlineData = editingAirline; // Use data from editingAirline state
    try {
      // Validation
      if (!airlineData.name || !airlineData.iata_code) {
        return alert('Naziv i IATA kod su obavezni!');
      }
       if (!user || !user.token) {
        setError('Morate biti prijavljeni kao administrator.');
        return;
      }
      const response = await axios.put(`${config.apiUrl}/airlines/${editingAirline.id}`, airlineData, {
         headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
      });

      // Update the airlines list in state
      setAirlines(airlines.map(a => a.id === editingAirline.id ? response.data : a));
      setEditingAirline(null); // Exit edit mode
      alert('Aviokompanija uspješno ažurirana!');

    } catch (err) {
       console.error('Error updating airline:', err);
       alert(`Greška prilikom ažuriranja aviokompanije: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handler to initiate editing
  const handleEditClick = (airline) => {
    setEditingAirline({ ...airline }); // Set the airline to be edited (create a copy)
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  // Handler to cancel editing
  const handleCancelEdit = () => {
    setEditingAirline(null); // Clear editing state
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
      console.error("Error deleting airline:", err); // Log the full error
      // Check for specific 409 Conflict error from backend
      if (err.response && err.response.status === 409) {
        // Use the error message from the backend if available, otherwise a default message
        const errorMessage = err.response.data?.error || 'Nije moguće obrisati aviokompaniju jer se koristi u postojećim letovima ili brojevima letova.';
        alert(`Greška: ${errorMessage}`);
      } else if (err.response && err.response.status === 404) {
        alert('Greška: Aviokompanija nije pronađena.'); // Handle 404 specifically
      } 
      else {
        // Generic error for other issues
        alert('Došlo je do greške prilikom brisanja aviokompanije.');
      }
    }
  };

  // Determine form values based on whether editing or adding
  const formValues = editingAirline || newAirline;
  const isEditing = !!editingAirline;

  if (loading) return <p className="loading-message">Učitavanje aviokompanija...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="airline-management-container">
      <h1 className="title">Aviokompanije</h1>

      {/* Form for adding or editing */}
      <form onSubmit={handleSubmit} className="airline-form">
        <h2 className="form-title">{isEditing ? 'Uredi Aviokompaniju' : 'Dodaj Novu'}</h2>
        {isEditing && <p>Uređujete: {editingAirline.name} (ID: {editingAirline.id})</p>}
        <div className="form-group">
          <label>
            Naziv:
            <input
              type="text"
              name="name"
              value={formValues.name} // Use combined formValues
              onChange={handleChange}
              required
              className="input-field"
            />
          </label>
        </div>
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
                value={formValues.logo_url || ''} // Use combined formValues, handle null/undefined
                onChange={handleChange}
                className="input-field"
              >
                <option value="">-- Izaberi logo (Opciono) --</option>
                {logoImages.map((imageUrl) => {
                  const filename = imageUrl.split('/').pop();
                  return (
                    <option key={imageUrl} value={imageUrl}>
                      {filename}
                    </option>
                  );
                })}
              </select>
            )}
            {/* Optional Preview - Use formValues */}
            {formValues.logo_url && (
              <img
                src={`${config.apiUrl}${formValues.logo_url}`}
                alt="Logo Preview"
                className="logo-preview"
                onError={(e) => { e.target.style.display = 'none'; e.target.src = ''; }}
                onLoad={(e) => { e.target.style.display = 'inline-block'; }}
                style={{ display: 'none' }}
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
              value={formValues.iata_code} // Use combined formValues
              onChange={handleChange}
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-button">
            {isEditing ? 'Ažuriraj Aviokompaniju' : 'Dodaj Aviokompaniju'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="cancel-button">
              Otkaži
            </button>
          )}
        </div>
      </form>

      {/* Display existing airlines */}
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
              <td className="action-buttons"> {/* Add class for styling */}
                 <button onClick={() => handleEditClick(airline)} className="edit-button">Uredi</button>
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
