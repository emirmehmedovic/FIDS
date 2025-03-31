import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ContentManagementPage.css';
import config from '../config';
import { useAuth } from './AuthProvider'; // Import useAuth

const ContentManagementPage = () => {
  const [pages, setPages] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false); // State for image gallery
  const [newPageType, setNewPageType] = useState('check-in'); // State for new page type
  const [creatingPage, setCreatingPage] = useState(false); // State for creating page
  const { user } = useAuth(); // Get user from AuthContext

  // Fetch initial data (pages and images)
  const fetchData = async () => {
    try {
      const [pagesRes, imagesRes] = await Promise.all([
        axios.get(`${config.apiUrl}/api/content`),
        axios.get(`${config.apiUrl}/api/content/images`)
      ]);
      setPages(pagesRes.data);
      setImages(imagesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error.response?.data || error.message);
      toast.error('Greška pri učitavanju podataka: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle image upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      await axios.post(
        `${config.apiUrl}/api/content/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${user?.token}` } } // Add Auth header
      );
      toast.success('Slika uspješno uploadovana!');
      fetchData(); // Refresh images and pages
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Greška pri uploadu: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle saving the link between a page and an image
  const handleSaveLink = async (pageId) => {
    try {
      const imageUrlToSave = selectedImage[pageId] || ''; // Send empty string to unlink

      await axios.put(`${config.apiUrl}/api/content/${pageId}`,
        { imageUrl: imageUrlToSave },
        { headers: { 'Authorization': `Bearer ${user?.token}` } } // Add Auth header
      );

      toast.success(`Veza za ${pageId} uspješno sačuvana!`);
      fetchData(); // Refresh pages to show updated link
    } catch (error) {
      console.error('Save link failed:', error.response?.data || error.message);
      toast.error('Greška pri čuvanju veze: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle deleting an image file
  const handleDeleteImage = async (imagePath) => {
    const filename = imagePath.split('/').pop();
    if (!window.confirm(`Jeste li sigurni da želite trajno obrisati sliku ${filename}? Ovo će takođe ukloniti vezu sa svim stranicama koje je koriste.`)) {
      return;
    }
    try {
      await axios.delete(`${config.apiUrl}/api/content/images/${filename}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` } // Add Auth header
      });
      toast.success(`Slika ${filename} uspješno obrisana!`);
      fetchData(); // Refresh images and pages
    } catch (error) {
      console.error('Delete image failed:', error.response?.data || error.message);
      toast.error('Greška pri brisanju slike: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle creating a new page (šalter)
  const handleCreatePage = async () => {
    try {
      setCreatingPage(true);
      await axios.post(`${config.apiUrl}/api/content/pages`,
        { pageType: newPageType },
        { headers: { 'Authorization': `Bearer ${user?.token}` } } // Add Auth header
      );
      toast.success(`Novi šalter tipa '${newPageType}' uspješno kreiran!`);
      fetchData(); // Refresh pages list
    } catch (error) {
      console.error('Create page failed:', error.response?.data || error.message);
      toast.error('Greška pri kreiranju šaltera: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingPage(false);
    }
  };

  // Helper function to get image filename from path
  const getImageFilename = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.split('/').pop();
  };

  // Group pages by type for rendering
  const groupedPages = pages.reduce((acc, page) => {
    const type = page.pageType || 'general'; // Default to general if type is missing
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(page);
    // Sort numerically within each group
    acc[type].sort((a, b) => {
        const numA = parseInt(a.pageId.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.pageId.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
    return acc;
  }, {});

  return (
    <div className="container mt-4">
      <h2>Upravljanje Sadržajem Šaltera</h2>

      {/* Section: Link Image to Page (Moved to top) */}
      <div className="card mb-4"> {/* Added mb-4 for consistency */}
        <div className="card-body">
          <h4 className="mb-3">Poveži Sliku sa Šalterom</h4>
          {Object.entries(groupedPages).map(([type, pageList]) => (
            <div key={type} className="mb-4">
              <h5 className="text-primary">{type.charAt(0).toUpperCase() + type.slice(1)} Šalteri</h5>
              {pageList.map(page => (
                <div key={page.pageId} className="row mb-3 align-items-center border-bottom pb-3">
                  <div className="col-md-2">
                    <strong className="page-id-label">{page.pageId.toUpperCase()}</strong>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor={`select-${page.pageId}`} className="form-label visually-hidden">Izaberi sliku za {page.pageId}</label>
                    <select
                      id={`select-${page.pageId}`}
                      className="form-select"
                      value={selectedImage[page.pageId] || page.imageUrl || ''}
                      onChange={(e) => setSelectedImage({
                        ...selectedImage,
                        [page.pageId]: e.target.value
                      })}
                      disabled={!user} // Disable if not logged in
                    >
                      <option value="">-- Bez Slike --</option>
                      {images.map(img => (
                        <option key={img} value={img}>
                          {getImageFilename(img)}
                        </option>
                      ))}
                    </select>
                    {/* Display current linked image */}
                    {(selectedImage[page.pageId] || page.imageUrl) && (
                         <small className="text-info d-block mt-1">
                            Trenutno: {getImageFilename(selectedImage[page.pageId] || page.imageUrl)}
                         </small>
                    )}
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveLink(page.pageId)}
                      // Disable save if the selection hasn't changed from the initial state
                      disabled={selectedImage[page.pageId] === undefined || selectedImage[page.pageId] === (page.imageUrl || '') || !user}
                    >
                      Sačuvaj Vezu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
           {!user && <p className="text-danger mt-3">Morate biti prijavljeni da biste menjali veze.</p>}
        </div>
      </div>

      {/* Section: Image Gallery Toggle Button */}
      <div className="text-center mb-4">
        <button
          className="btn btn-secondary"
          onClick={() => setShowImageGallery(!showImageGallery)}
        >
          {showImageGallery ? 'Sakrij Galeriju Slika' : 'Prikaži Galeriju Slika'}
        </button>
      </div>

      {/* Section: Image Gallery (Conditional) */}
      {showImageGallery && (
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-3">Galerija Uploadovanih Slika</h4>
            {images.length === 0 ? (
              <p>Nema uploadovanih slika.</p>
            ) : (
              <div className="image-gallery-container">
                {images.map(img => (
                  <div key={img} className="gallery-item">
                    <img
                        src={`${config.apiUrl}${img}`}
                        alt={getImageFilename(img)}
                        className="img-thumbnail mb-2"
                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                        onError={(e) => { e.target.style.display='none'; }} // Hide broken images
                    />
                    <p className="image-filename" title={getImageFilename(img)}>{getImageFilename(img)}</p>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteImage(img)}
                      disabled={!user} // Disable if not logged in
                    >
                      Obriši Sliku
                    </button>
                  </div>
                ))}
              </div>
            )}
             {!user && <small className="text-danger d-block mt-2">Morate biti prijavljeni da biste brisali slike.</small>}
          </div>
        </div>
      )}

      {/* Section: Upload New Image (Moved down) */}
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-3">Upload Nove Slike</h4>
          <input
            type="file"
            accept="image/*" // Accept only image files
            onChange={handleFileUpload}
            disabled={uploading || !user} // Disable if not logged in
            className="form-control mb-3"
          />
          {uploading && <div className="text-muted">Upload u toku...</div>}
           {!user && <small className="text-danger d-block mt-2">Morate biti prijavljeni da biste uploadovali sliku.</small>}
        </div>
      </div>

      {/* Section: Add New Page (Šalter) (Moved to very bottom) */}
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-3">Dodaj Novi Šalter</h4>
          <div className="row align-items-end">
            <div className="col-md-6">
              <label htmlFor="pageTypeSelect" className="form-label">Tip Šaltera:</label>
              <select
                id="pageTypeSelect"
                className="form-select"
                value={newPageType}
                onChange={(e) => setNewPageType(e.target.value)}
              >
                <option value="check-in">Check-in (C)</option>
                <option value="boarding">Boarding (U)</option>
                <option value="general">Generalno (G)</option>
              </select>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-success w-100"
                onClick={handleCreatePage}
                disabled={creatingPage || !user} // Disable if not logged in
              >
                {creatingPage ? 'Kreiranje...' : 'Dodaj Šalter'}
              </button>
            </div>
          </div>
           {!user && <small className="text-danger d-block mt-2">Morate biti prijavljeni da biste dodali šalter.</small>}
        </div>
      </div>

    </div>
  );
};

export default ContentManagementPage;
