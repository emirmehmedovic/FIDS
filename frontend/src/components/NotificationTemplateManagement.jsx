import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
import { useAuth } from './AuthProvider'; // Import useAuth
import './NotificationTemplateManagement.css';

function NotificationTemplateManagement() {
  const { user } = useAuth(); // Get user from auth context
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null); // For create/update form

  // --- Fetch Templates ---
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user?.token) {
        setError("Niste prijavljeni ili sesija nije validna.");
        setIsLoading(false);
        setTemplates([]); // Clear templates if not authenticated
        return;
    }
    try {
      const response = await axios.get(`${config.apiUrl}/api/notification-templates`, {
        headers: { Authorization: `Bearer ${user.token}` } // Add Auth header
      });
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Greška pri učitavanju šablona. Provjerite konzolu.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]); // Added user.token dependency

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    text_bs: '',
    text_en: '',
    text_de: '',
    text_tr: '',
  });

  // --- Handle Input Change ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handle Edit Click ---
  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      text_bs: template.text_bs || '',
      text_en: template.text_en || '',
      text_de: template.text_de || '',
      text_tr: template.text_tr || '',
    });
  };

  // --- Handle Cancel Edit ---
  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setFormData({ name: '', text_bs: '', text_en: '', text_de: '', text_tr: '' });
  };

  // --- Handle Submit (Create/Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const url = editingTemplate
      ? `${config.apiUrl}/api/notification-templates/${editingTemplate.id}`
      : `${config.apiUrl}/api/notification-templates`;
    const method = editingTemplate ? 'put' : 'post';

    if (!user?.token) {
        setError("Niste prijavljeni ili sesija nije validna.");
        setIsLoading(false);
        return;
    }

    try {
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${user.token}` } // Add Auth header
      });
      await fetchTemplates(); // Refresh list
      handleCancelEdit(); // Reset form
    } catch (err) {
      console.error(`Error ${editingTemplate ? 'updating' : 'creating'} template:`, err);
      setError(`Greška pri ${editingTemplate ? 'ažuriranju' : 'kreiranju'} šablona: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj šablon?')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    if (!user?.token) {
        setError("Niste prijavljeni ili sesija nije validna.");
        setIsLoading(false);
        return;
    }
    try {
      await axios.delete(`${config.apiUrl}/api/notification-templates/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` } // Add Auth header
      });
      await fetchTemplates(); // Refresh list
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(`Greška pri brisanju šablona: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="template-management-container">
      <h2>Upravljanje Šablonima Obavještenja</h2>

      {error && <p className="error-message">{error}</p>}

      {/* --- Create/Edit Form --- */}
      <form onSubmit={handleSubmit} className="template-form">
        <h3>{editingTemplate ? 'Uredi Šablon' : 'Dodaj Novi Šablon'}</h3>
        <div className="form-group">
          <label htmlFor="name">Naziv Šablona (Interni)</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Npr. Kašnjenje - Vrijeme"
          />
        </div>
        <div className="form-group">
          <label htmlFor="text_bs">Tekst (Bosanski)</label>
          <textarea
            id="text_bs"
            name="text_bs"
            value={formData.text_bs}
            onChange={handleInputChange}
            rows="3"
            placeholder="Unesite tekst sa placeholderima (npr. {destination})"
          />
        </div>
        <div className="form-group">
          <label htmlFor="text_en">Tekst (Engleski)</label>
          <textarea
            id="text_en"
            name="text_en"
            value={formData.text_en}
            onChange={handleInputChange}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label htmlFor="text_de">Tekst (Njemački)</label>
          <textarea
            id="text_de"
            name="text_de"
            value={formData.text_de}
            onChange={handleInputChange}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label htmlFor="text_tr">Tekst (Turski)</label>
          <textarea
            id="text_tr"
            name="text_tr"
            value={formData.text_tr}
            onChange={handleInputChange}
            rows="3"
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Spremanje...' : (editingTemplate ? 'Ažuriraj Šablon' : 'Dodaj Šablon')}
          </button>
          {editingTemplate && (
            <button type="button" onClick={handleCancelEdit} disabled={isLoading}>
              Odustani
            </button>
          )}
        </div>
         <p className="placeholder-info">
            Dostupni placeholderi: <code>{'{flight_number}'}</code>, <code>{'{destination}'}</code>, <code>{'{time}'}</code>, <code>{'{airline_name}'}</code>. <br/>
            Ostali (npr. <code>{'{departure_city}'}</code>, <code>{'{new_airport}'}</code>, <code>{'{counter_number}'}</code>, <code>{'{hours}'}</code>, <code>{'{checkin_time}'}</code>, <code>{'{location}'}</code>) se moraju ručno unijeti u finalni tekst.
          </p>
      </form>

      {/* --- Template List --- */}
      <h3>Postojeći Šabloni</h3>
      {isLoading && <p>Učitavanje...</p>}
      <div className="template-list">
        {templates.length === 0 && !isLoading && <p>Nema kreiranih šablona.</p>}
        {templates.map(template => (
          <div key={template.id} className="template-item">
            <h4>{template.name}</h4>
            <div className="template-texts">
              {template.text_bs && <p><strong>BS:</strong> {template.text_bs}</p>}
              {template.text_en && <p><strong>EN:</strong> {template.text_en}</p>}
              {template.text_de && <p><strong>DE:</strong> {template.text_de}</p>}
              {template.text_tr && <p><strong>TR:</strong> {template.text_tr}</p>}
            </div>
            <div className="template-actions">
              <button onClick={() => handleEdit(template)} disabled={isLoading}>Uredi</button>
              <button onClick={() => handleDelete(template.id)} disabled={isLoading} className="delete-button">Obriši</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationTemplateManagement;
