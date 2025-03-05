import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ContentManagementPage.css';
import config from '../config';

const ContentManagementPage = () => {
  const [pages, setPages] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesRes, imagesRes] = await Promise.all([
          axios.get(`${config.apiUrl}/api/content`),
          axios.get(`${config.apiUrl}/api/content/images`)
        ]);
        
        console.log('API Response - Pages:', pagesRes.data);
        console.log('API Response - Images:', imagesRes.data);
        
        setPages(pagesRes.data);
        setImages(imagesRes.data);
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        toast.error('Greška pri učitavanju podataka: ' + (error.response?.data?.message || error.message));
      }
    };
    fetchData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // Dodajte provjeru za fajl

    const formData = new FormData();
    formData.append('image', file);
    formData.append('pageId', '');
    formData.append('pageType', 'general');

    try {
      setUploading(true);

      // 1. Upload slike
      await axios.post(
        `${config.apiUrl}/api/content/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // 2. Osveži OBJE liste nakon uploada
      const [pagesRes, imagesRes] = await Promise.all([
        axios.get(`${config.apiUrl}/api/content`),
        axios.get(`${config.apiUrl}/api/content/images`)
      ]);

      setPages(pagesRes.data);
      setImages(imagesRes.data);

      // 3. Prikaži success poruku
      toast.success('Slika uspješno uploadovana!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Greška: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (pageId) => {
    try {
      await axios.put(`${config.apiUrl}/api/content/${pageId}`, {
        imageUrl: selectedImage[pageId],
        pageType: pageId.startsWith('C') ? 'check-in' : 'boarding' // Obavezno polje
      });

      // Prikaži success poruku
      toast.success('Promjene uspješno sačuvane!');
    } catch (error) {
      console.error('Save failed:', error.response?.data || error.message);
      toast.error('Greška pri čuvanju: ' + (error.response?.data?.message || error.message));
    }
  };

  // Helper function to get image filename from path
  const getImageFilename = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.split('/').pop();
  };

  return (
    <div className="container mt-4">
      <h2>Upravljanje statičkim sadržajem</h2>
      
      {/* Upload forma */}
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-3">Upload nove slike</h4>
          <input 
            type="file" 
            onChange={handleFileUpload} 
            disabled={uploading}
            className="form-control mb-3"
          />
          {uploading && <div className="text-muted">Upload u toku...</div>}
        </div>
      </div>

      {/* Lista stranica sa sekcijama */}
      <div className="card">
        <div className="card-body">
          {/* Check-in sekcija */}
          <div className="mb-5">
            <h4 className="text-primary mb-4">Check-in Counters</h4>
            {pages
              .filter(page => page.pageType === 'check-in')
              .sort((a, b) => {
                // Extract the numeric part from pageId (e.g., "C1" -> 1)
                const numA = parseInt(a.pageId.replace(/\D/g, ''), 10);
                const numB = parseInt(b.pageId.replace(/\D/g, ''), 10);
                return numA - numB; // Sort numerically
              })
              .map(page => (
                <div key={page.pageId} className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <h5 className="mb-0">
                      {page.pageId.toUpperCase()}
                      <small className="text-muted d-block">Check-in</small>
                    </h5>
                  </div>
                  <div className="col-md-5">
                    <div className="image-selection-container">
                      <select
                        className="form-select"
                        value={selectedImage[page.pageId] || page.imageUrl || ''}
                        onChange={(e) => setSelectedImage({
                          ...selectedImage,
                          [page.pageId]: e.target.value
                        })}
                      >
                        <option value="">Odaberite sliku</option>
                        {images.map(img => (
                          <option key={img} value={img}>
                            {getImageFilename(img)}
                          </option>
                        ))}
                      </select>
                      <div className="selected-image-name">
                        {(selectedImage[page.pageId] || page.imageUrl) ? (
                          <small className="text-info">
                            Odabrana slika: {getImageFilename(selectedImage[page.pageId] || page.imageUrl)}
                          </small>
                        ) : (
                          <small>&nbsp;</small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(page.pageId)}
                      disabled={!selectedImage[page.pageId]}
                    >
                      Sačuvaj
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Boarding sekcija */}
          <div className="mb-5">
            <h4 className="text-primary mb-4">Boarding Gates</h4>
            {pages
              .filter(page => page.pageType === 'boarding')
              .sort((a, b) => {
                // Extract the numeric part from pageId (e.g., "U1" -> 1)
                const numA = parseInt(a.pageId.replace(/\D/g, ''), 10);
                const numB = parseInt(b.pageId.replace(/\D/g, ''), 10);
                return numA - numB; // Sort numerically
              })
              .map(page => (
                <div key={page.pageId} className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <h5 className="mb-0">
                      {page.pageId.toUpperCase()}
                      <small className="text-muted d-block">Boarding</small>
                    </h5>
                  </div>
                  <div className="col-md-5">
                    <div className="image-selection-container">
                      <select
                        className="form-select"
                        value={selectedImage[page.pageId] || page.imageUrl || ''}
                        onChange={(e) => setSelectedImage({
                          ...selectedImage,
                          [page.pageId]: e.target.value
                        })}
                      >
                        <option value="">Odaberite sliku</option>
                        {images.map(img => (
                          <option key={img} value={img}>
                            {getImageFilename(img)}
                          </option>
                        ))}
                      </select>
                      <div className="selected-image-name">
                        {(selectedImage[page.pageId] || page.imageUrl) ? (
                          <small className="text-info">
                            Odabrana slika: {getImageFilename(selectedImage[page.pageId] || page.imageUrl)}
                          </small>
                        ) : (
                          <small>&nbsp;</small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(page.pageId)}
                      disabled={!selectedImage[page.pageId]}
                    >
                      Sačuvaj
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagementPage;
