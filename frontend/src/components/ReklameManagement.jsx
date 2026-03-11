import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import config from '../config';
import { toast } from 'react-toastify';
import {
  FiFilm, FiList, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX,
  FiPlay, FiPause, FiArrowUp, FiArrowDown, FiUpload, FiMonitor, FiLink, FiExternalLink
} from 'react-icons/fi';
import './ReklameManagement.css';

const ReklameManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ekrani');

  // ── Ads state ──
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', duration: '10' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [editAdForm, setEditAdForm] = useState({});
  const fileInputRef = useRef(null);

  // ── Screens state ──
  const [screens, setScreens] = useState([]);
  const [screensLoading, setScreensLoading] = useState(false);
  const [newScreenForm, setNewScreenForm] = useState({ name: '', description: '' });
  const [showNewScreenForm, setShowNewScreenForm] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [editScreenForm, setEditScreenForm] = useState({});

  // ── Playlists state ──
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistDetails, setPlaylistDetails] = useState(null);
  const [playlistDetailsLoading, setPlaylistDetailsLoading] = useState(false);
  const [newPlaylistForm, setNewPlaylistForm] = useState({ name: '', description: '' });
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({});
  const [addAdToPlaylist, setAddAdToPlaylist] = useState('');
  const [addItemDuration, setAddItemDuration] = useState('');
  const [assigningScreenId, setAssigningScreenId] = useState('');

  const authHeader = () => ({ headers: { Authorization: `Bearer ${user?.token}` } });

  // ─────────────── Ad functions ───────────────

  const fetchAds = async () => {
    setAdsLoading(true);
    try {
      const res = await axios.get(`${config.apiUrl}/advertisements`, authHeader());
      setAds(res.data);
    } catch (e) {
      toast.error('Greška pri učitavanju reklama');
    } finally {
      setAdsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (!uploadForm.title) {
      setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Odaberite fajl'); return; }
    if (!uploadForm.title.trim()) { toast.error('Unesite naziv reklame'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('duration', uploadForm.duration);
      await axios.post(`${config.apiUrl}/advertisements`, formData, {
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Reklama uspješno uploadovana');
      setUploadForm({ title: '', description: '', duration: '10' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAds();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Greška pri uploadu');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Obrisati ovu reklamu?')) return;
    try {
      await axios.delete(`${config.apiUrl}/advertisements/${id}`, authHeader());
      toast.success('Reklama obrisana');
      fetchAds();
    } catch (e) {
      toast.error('Greška pri brisanju reklame');
    }
  };

  const startEditAd = (ad) => {
    setEditingAd(ad.id);
    setEditAdForm({ title: ad.title, description: ad.description || '', duration: String(ad.duration) });
  };

  const saveEditAd = async (id) => {
    try {
      await axios.put(`${config.apiUrl}/advertisements/${id}`, editAdForm, authHeader());
      toast.success('Reklama ažurirana');
      setEditingAd(null);
      fetchAds();
    } catch (e) {
      toast.error('Greška pri ažuriranju reklame');
    }
  };

  const getFileIcon = (type) => {
    if (type === 'video') return '🎬';
    if (type === 'gif') return '🎞️';
    return '🖼️';
  };

  const getMediaPreviewUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${config.apiUrl}${fileUrl}`;
  };

  // ─────────────── Screen functions ───────────────

  const fetchScreens = async () => {
    setScreensLoading(true);
    try {
      const res = await axios.get(`${config.apiUrl}/ad-screens`, authHeader());
      setScreens(res.data);
    } catch (e) {
      toast.error('Greška pri učitavanju ekrana');
    } finally {
      setScreensLoading(false);
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!newScreenForm.name.trim()) { toast.error('Unesite naziv ekrana'); return; }
    try {
      await axios.post(`${config.apiUrl}/ad-screens`, newScreenForm, authHeader());
      toast.success('Ekran kreiran');
      setNewScreenForm({ name: '', description: '' });
      setShowNewScreenForm(false);
      fetchScreens();
    } catch (e) {
      toast.error('Greška pri kreiranju ekrana');
    }
  };

  const handleDeleteScreen = async (id) => {
    if (!window.confirm('Obrisati ovaj ekran? Sve playliste će biti odvezane od njega.')) return;
    try {
      await axios.delete(`${config.apiUrl}/ad-screens/${id}`, authHeader());
      toast.success('Ekran obrisan');
      fetchScreens();
      fetchPlaylists();
    } catch (e) {
      toast.error('Greška pri brisanju ekrana');
    }
  };

  const startEditScreen = (screen) => {
    setEditingScreen(screen.id);
    setEditScreenForm({ name: screen.name, description: screen.description || '' });
  };

  const saveEditScreen = async (id) => {
    try {
      await axios.put(`${config.apiUrl}/ad-screens/${id}`, editScreenForm, authHeader());
      toast.success('Ekran ažuriran');
      setEditingScreen(null);
      fetchScreens();
    } catch (e) {
      toast.error('Greška pri ažuriranju ekrana');
    }
  };

  const getScreenUrl = (screenId) => {
    const base = window.location.origin;
    return `${base}/reklame.html?screen=${screenId}`;
  };

  const copyScreenUrl = (screenId) => {
    const url = getScreenUrl(screenId);
    navigator.clipboard.writeText(url).then(() => {
      toast.success('URL kopiran u clipboard');
    }).catch(() => {
      toast.info(`URL: ${url}`);
    });
  };

  // ─────────────── Playlist functions ───────────────

  const fetchPlaylists = async () => {
    setPlaylistsLoading(true);
    try {
      const res = await axios.get(`${config.apiUrl}/playlists`, authHeader());
      setPlaylists(res.data);
    } catch (e) {
      toast.error('Greška pri učitavanju playlista');
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const fetchPlaylistDetails = async (id) => {
    setPlaylistDetailsLoading(true);
    try {
      const res = await axios.get(`${config.apiUrl}/playlists/${id}`, authHeader());
      setPlaylistDetails(res.data);
    } catch (e) {
      toast.error('Greška pri učitavanju detalja playliste');
    } finally {
      setPlaylistDetailsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistForm.name.trim()) { toast.error('Unesite naziv playliste'); return; }
    try {
      await axios.post(`${config.apiUrl}/playlists`, newPlaylistForm, authHeader());
      toast.success('Playlist kreiran');
      setNewPlaylistForm({ name: '', description: '' });
      setShowNewPlaylistForm(false);
      fetchPlaylists();
    } catch (e) {
      toast.error('Greška pri kreiranju playliste');
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (!window.confirm('Obrisati ovaj playlist?')) return;
    try {
      await axios.delete(`${config.apiUrl}/playlists/${id}`, authHeader());
      toast.success('Playlist obrisan');
      if (selectedPlaylist === id) { setSelectedPlaylist(null); setPlaylistDetails(null); }
      fetchPlaylists();
      fetchScreens();
    } catch (e) {
      toast.error('Greška pri brisanju playliste');
    }
  };

  const handleActivatePlaylist = async (playlistId, screenId) => {
    if (!screenId) { toast.error('Odaberite ekran'); return; }
    try {
      await axios.post(`${config.apiUrl}/playlists/${playlistId}/activate`, { screenId: parseInt(screenId) }, authHeader());
      toast.success('Playlist aktiviran na ekranu');
      fetchPlaylists();
      fetchScreens();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Greška pri aktiviranju playliste');
    }
  };

  const handleDeactivatePlaylist = async (id) => {
    try {
      await axios.post(`${config.apiUrl}/playlists/${id}/deactivate`, {}, authHeader());
      toast.success('Playlist deaktiviran');
      fetchPlaylists();
      fetchScreens();
    } catch (e) {
      toast.error('Greška pri deaktiviranju playliste');
    }
  };

  const selectPlaylist = (id) => {
    setSelectedPlaylist(id);
    fetchPlaylistDetails(id);
  };

  const startEditPlaylist = (pl) => {
    setEditingPlaylist(pl.id);
    setEditPlaylistForm({ name: pl.name, description: pl.description || '' });
  };

  const saveEditPlaylist = async (id) => {
    try {
      await axios.put(`${config.apiUrl}/playlists/${id}`, editPlaylistForm, authHeader());
      toast.success('Playlist ažuriran');
      setEditingPlaylist(null);
      fetchPlaylists();
      if (selectedPlaylist === id) fetchPlaylistDetails(id);
    } catch (e) {
      toast.error('Greška pri ažuriranju playliste');
    }
  };

  const handleAddItemToPlaylist = async () => {
    if (!addAdToPlaylist) { toast.error('Odaberite reklamu'); return; }
    try {
      await axios.post(
        `${config.apiUrl}/playlists/${selectedPlaylist}/items`,
        { advertisementId: addAdToPlaylist, duration: addItemDuration ? parseInt(addItemDuration) : null },
        authHeader()
      );
      toast.success('Reklama dodana u playlist');
      setAddAdToPlaylist('');
      setAddItemDuration('');
      fetchPlaylistDetails(selectedPlaylist);
    } catch (e) {
      toast.error('Greška pri dodavanju reklame u playlist');
    }
  };

  const handleRemoveItemFromPlaylist = async (itemId) => {
    try {
      await axios.delete(`${config.apiUrl}/playlists/${selectedPlaylist}/items/${itemId}`, authHeader());
      toast.success('Reklama uklonjena iz playliste');
      fetchPlaylistDetails(selectedPlaylist);
    } catch (e) {
      toast.error('Greška pri uklanjanju reklame');
    }
  };

  const handleUpdateItemDuration = async (itemId, duration) => {
    try {
      await axios.put(
        `${config.apiUrl}/playlists/${selectedPlaylist}/items/${itemId}`,
        { duration: duration ? parseInt(duration) : null },
        authHeader()
      );
      fetchPlaylistDetails(selectedPlaylist);
    } catch (e) {
      toast.error('Greška pri ažuriranju trajanja');
    }
  };

  const handleMoveItem = async (index, direction) => {
    if (!playlistDetails?.items) return;
    const items = [...playlistDetails.items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const reordered = items.map((item, i) => {
      if (i === index) return { id: item.id, order: items[swapIndex].order };
      if (i === swapIndex) return { id: item.id, order: items[index].order };
      return { id: item.id, order: item.order };
    });
    try {
      await axios.put(`${config.apiUrl}/playlists/${selectedPlaylist}/items/reorder`, { items: reordered }, authHeader());
      fetchPlaylistDetails(selectedPlaylist);
    } catch (e) {
      toast.error('Greška pri preraspoređivanju');
    }
  };

  useEffect(() => {
    if (activeTab === 'ekrani') { fetchScreens(); fetchPlaylists(); }
    if (activeTab === 'reklame') fetchAds();
    if (activeTab === 'playliste') { fetchPlaylists(); fetchAds(); fetchScreens(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─────────────── Render ───────────────

  const screenForPlaylist = (pl) => screens.find(s => s.id === pl.screenId);

  return (
    <div className="reklame-container">
      <div className="reklame-header">
        <h1 className="reklame-title">
          <FiFilm className="reklame-title-icon" />
          Upravljanje reklamama
        </h1>
        <div className="reklame-tabs">
          <button className={`reklame-tab ${activeTab === 'ekrani' ? 'active' : ''}`} onClick={() => setActiveTab('ekrani')}>
            <FiMonitor /> Ekrani
          </button>
          <button className={`reklame-tab ${activeTab === 'playliste' ? 'active' : ''}`} onClick={() => setActiveTab('playliste')}>
            <FiList /> Playliste
          </button>
          <button className={`reklame-tab ${activeTab === 'reklame' ? 'active' : ''}`} onClick={() => setActiveTab('reklame')}>
            <FiFilm /> Reklame
          </button>
        </div>
      </div>

      {/* ══════════════ EKRANI TAB ══════════════ */}
      {activeTab === 'ekrani' && (
        <div className="reklame-content">
          <div className="reklame-card">
            <div className="playliste-list-header" style={{ marginBottom: 18 }}>
              <h2 className="reklame-card-title"><FiMonitor /> Reklamni ekrani</h2>
              <button className="btn-primary btn-sm" onClick={() => setShowNewScreenForm(v => !v)}>
                <FiPlus /> Novi ekran
              </button>
            </div>

            {showNewScreenForm && (
              <form onSubmit={handleCreateScreen} className="new-playlist-form" style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Naziv ekrana (npr. Reklamni ekran 1) *"
                  value={newScreenForm.name}
                  onChange={e => setNewScreenForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Opis (opciono)"
                  value={newScreenForm.description}
                  onChange={e => setNewScreenForm(p => ({ ...p, description: e.target.value }))}
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary btn-sm">Kreiraj</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setShowNewScreenForm(false)}>Otkaži</button>
                </div>
              </form>
            )}

            {screensLoading ? (
              <div className="loading-text">Učitavanje...</div>
            ) : screens.length === 0 ? (
              <div className="empty-state">
                <FiMonitor className="empty-icon" />
                <p>Nema kreiranih ekrana. Kreirajte prvi reklamni ekran.</p>
              </div>
            ) : (
              <div className="screens-grid">
                {screens.map(screen => (
                  <div key={screen.id} className="screen-card">
                    {editingScreen === screen.id ? (
                      <div className="screen-edit-form">
                        <input
                          type="text"
                          value={editScreenForm.name}
                          onChange={e => setEditScreenForm(p => ({ ...p, name: e.target.value }))}
                          className="edit-input"
                          placeholder="Naziv ekrana"
                        />
                        <input
                          type="text"
                          value={editScreenForm.description}
                          onChange={e => setEditScreenForm(p => ({ ...p, description: e.target.value }))}
                          className="edit-input"
                          placeholder="Opis"
                        />
                        <div className="ad-actions">
                          <button className="btn-icon btn-success" onClick={() => saveEditScreen(screen.id)} title="Sačuvaj"><FiCheck /></button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingScreen(null)} title="Otkaži"><FiX /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="screen-card-header">
                          <FiMonitor className="screen-icon" />
                          <div className="screen-card-info">
                            <div className="screen-card-name">{screen.name}</div>
                            {screen.description && <div className="screen-card-desc">{screen.description}</div>}
                          </div>
                        </div>

                        <div className="screen-card-status">
                          {screen.activePlaylist ? (
                            <div className="screen-status-active">
                              <span className="active-dot">●</span>
                              <span>Aktivna: <strong>{screen.activePlaylist.name}</strong></span>
                            </div>
                          ) : (
                            <div className="screen-status-inactive">Nema aktivne playliste</div>
                          )}
                        </div>

                        <div className="screen-card-url">
                          <span className="screen-url-label">URL ekrana:</span>
                          <code className="screen-url-code">reklame.html?screen={screen.id}</code>
                          <button
                            className="btn-icon btn-secondary"
                            onClick={() => copyScreenUrl(screen.id)}
                            title="Kopiraj URL"
                            style={{ width: 28, height: 28, fontSize: 13 }}
                          >
                            <FiLink />
                          </button>
                          <a
                            href={getScreenUrl(screen.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-icon btn-secondary"
                            style={{ width: 28, height: 28, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Otvori ekran"
                          >
                            <FiExternalLink />
                          </a>
                        </div>

                        <div className="screen-card-actions">
                          <button className="btn-primary btn-sm" onClick={() => { setActiveTab('playliste'); }} title="Upravljaj playlistama za ovaj ekran">
                            <FiList /> Playliste
                          </button>
                          <button className="btn-icon btn-primary" onClick={() => startEditScreen(screen)} title="Uredi"><FiEdit2 /></button>
                          <button className="btn-icon btn-danger" onClick={() => handleDeleteScreen(screen.id)} title="Obriši"><FiTrash2 /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ PLAYLISTE TAB ══════════════ */}
      {activeTab === 'playliste' && (
        <div className="reklame-content playliste-layout">
          {/* Left: Playlists list */}
          <div className="playliste-sidebar">
            <div className="reklame-card playliste-list-card">
              <div className="playliste-list-header">
                <h2 className="reklame-card-title"><FiList /> Playliste</h2>
                <button className="btn-primary btn-sm" onClick={() => setShowNewPlaylistForm(v => !v)}>
                  <FiPlus /> Nova
                </button>
              </div>

              {showNewPlaylistForm && (
                <form onSubmit={handleCreatePlaylist} className="new-playlist-form">
                  <input
                    type="text"
                    placeholder="Naziv playliste *"
                    value={newPlaylistForm.name}
                    onChange={e => setNewPlaylistForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Opis (opciono)"
                    value={newPlaylistForm.description}
                    onChange={e => setNewPlaylistForm(p => ({ ...p, description: e.target.value }))}
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn-primary btn-sm">Kreiraj</button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setShowNewPlaylistForm(false)}>Otkaži</button>
                  </div>
                </form>
              )}

              {playlistsLoading ? (
                <div className="loading-text">Učitavanje...</div>
              ) : playlists.length === 0 ? (
                <div className="empty-state">Nema playlista</div>
              ) : (
                <ul className="playliste-list">
                  {playlists.map(pl => {
                    const screen = screenForPlaylist(pl);
                    return (
                      <li
                        key={pl.id}
                        className={`playliste-item ${selectedPlaylist === pl.id ? 'selected' : ''} ${pl.isActive ? 'is-active' : ''}`}
                        onClick={() => selectPlaylist(pl.id)}
                      >
                        {editingPlaylist === pl.id ? (
                          <div className="playlist-edit-inline" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editPlaylistForm.name}
                              onChange={e => setEditPlaylistForm(p => ({ ...p, name: e.target.value }))}
                              className="edit-input"
                            />
                            <div className="ad-actions">
                              <button className="btn-icon btn-success" onClick={() => saveEditPlaylist(pl.id)}><FiCheck /></button>
                              <button className="btn-icon btn-secondary" onClick={() => setEditingPlaylist(null)}><FiX /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="playliste-item-content">
                            <div className="playliste-item-info">
                              {pl.isActive && <span className="active-dot" title={screen ? `Aktivna na: ${screen.name}` : 'Aktivna'}>●</span>}
                              <div>
                                <div className="playliste-item-name">{pl.name}</div>
                                {screen && (
                                  <div className="playlist-screen-badge">
                                    <FiMonitor style={{ fontSize: 11 }} /> {screen.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="playliste-item-actions" onClick={e => e.stopPropagation()}>
                              {pl.isActive ? (
                                <button className="btn-icon btn-warning" onClick={() => handleDeactivatePlaylist(pl.id)} title="Deaktiviraj"><FiPause /></button>
                              ) : null}
                              <button className="btn-icon btn-primary" onClick={() => startEditPlaylist(pl)} title="Uredi naziv"><FiEdit2 /></button>
                              <button className="btn-icon btn-danger" onClick={() => handleDeletePlaylist(pl.id)} title="Obriši"><FiTrash2 /></button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Playlist details */}
          <div className="playliste-detail">
            {!selectedPlaylist ? (
              <div className="reklame-card empty-detail">
                <div className="empty-state">
                  <FiList className="empty-icon" />
                  <p>Odaberite playlist sa liste</p>
                </div>
              </div>
            ) : (
              <div className="reklame-card">
                {playlistDetailsLoading ? (
                  <div className="loading-text">Učitavanje...</div>
                ) : playlistDetails ? (
                  <>
                    <div className="playlist-detail-header">
                      <h2 className="reklame-card-title">
                        {playlistDetails.isActive && <span className="active-dot">●</span>}
                        {playlistDetails.name}
                      </h2>
                      {playlistDetails.description && <p className="playlist-description">{playlistDetails.description}</p>}
                    </div>

                    {/* Assign to screen */}
                    <div className="add-to-playlist" style={{ marginBottom: 20 }}>
                      <h3 className="section-subtitle"><FiMonitor style={{ marginRight: 6 }} />Aktiviraj na ekranu</h3>
                      {playlistDetails.isActive ? (
                        <div className="screen-assign-active">
                          <span className="active-dot">●</span>
                          <span>Aktivna na: <strong>{screenForPlaylist(playlistDetails)?.name || `Ekran #${playlistDetails.screenId}`}</strong></span>
                          <button className="btn-warning btn-sm" style={{ marginLeft: 12 }} onClick={() => handleDeactivatePlaylist(playlistDetails.id)}>
                            <FiPause /> Deaktiviraj
                          </button>
                        </div>
                      ) : (
                        <div className="add-item-row">
                          <select
                            value={assigningScreenId}
                            onChange={e => setAssigningScreenId(e.target.value)}
                            className="add-item-select"
                          >
                            <option value="">— Odaberi ekran —</option>
                            {screens.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}{s.activePlaylist ? ` (aktivno: ${s.activePlaylist.name})` : ''}
                              </option>
                            ))}
                          </select>
                          <button className="btn-success" onClick={() => handleActivatePlaylist(playlistDetails.id, assigningScreenId)}>
                            <FiPlay /> Aktiviraj
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add ad to playlist */}
                    <div className="add-to-playlist">
                      <h3 className="section-subtitle">Dodaj reklamu u playlist</h3>
                      <div className="add-item-row">
                        <select value={addAdToPlaylist} onChange={e => setAddAdToPlaylist(e.target.value)} className="add-item-select">
                          <option value="">— Odaberi reklamu —</option>
                          {ads.filter(a => a.isActive).map(ad => (
                            <option key={ad.id} value={ad.id}>{ad.title} ({ad.type}, {ad.duration}s)</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          placeholder="Trajanje (sek)"
                          value={addItemDuration}
                          onChange={e => setAddItemDuration(e.target.value)}
                          className="add-item-duration"
                          title="Ostavi prazno za podrazumijevano trajanje reklame"
                        />
                        <button className="btn-primary" onClick={handleAddItemToPlaylist}>
                          <FiPlus /> Dodaj
                        </button>
                      </div>
                    </div>

                    {/* Playlist items */}
                    <div className="playlist-items-section">
                      <h3 className="section-subtitle">
                        Sadržaj ({(playlistDetails.items || []).length} stavki)
                      </h3>
                      {!playlistDetails.items || playlistDetails.items.length === 0 ? (
                        <div className="empty-state">Playlist je prazan — dodajte reklame</div>
                      ) : (
                        <div className="playlist-items-list">
                          {playlistDetails.items.map((item, idx) => (
                            <div key={item.id} className="playlist-item-row">
                              <div className="playlist-item-order">#{idx + 1}</div>
                              <div className="playlist-item-preview">
                                {item.advertisement?.type === 'video' ? (
                                  <video src={getMediaPreviewUrl(item.advertisement.fileUrl)} className="playlist-item-thumb" muted preload="metadata" />
                                ) : item.advertisement ? (
                                  <img src={getMediaPreviewUrl(item.advertisement.fileUrl)} alt={item.advertisement.title} className="playlist-item-thumb" />
                                ) : null}
                              </div>
                              <div className="playlist-item-info">
                                <div className="playlist-item-title">
                                  {item.advertisement ? <>{getFileIcon(item.advertisement.type)} {item.advertisement.title}</> : 'Nepoznata reklama'}
                                </div>
                                <div className="playlist-item-meta">
                                  {item.advertisement && <span className="ad-type-small">{item.advertisement.type}</span>}
                                </div>
                              </div>
                              <div className="playlist-item-duration">
                                <label>⏱</label>
                                <DurationInput
                                  value={item.duration}
                                  defaultValue={item.advertisement?.duration}
                                  onSave={(val) => handleUpdateItemDuration(item.id, val)}
                                />
                                <span className="duration-hint">sek</span>
                              </div>
                              <div className="playlist-item-controls">
                                <button className="btn-icon btn-secondary" onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} title="Gore"><FiArrowUp /></button>
                                <button className="btn-icon btn-secondary" onClick={() => handleMoveItem(idx, 'down')} disabled={idx === playlistDetails.items.length - 1} title="Dolje"><FiArrowDown /></button>
                                <button className="btn-icon btn-danger" onClick={() => handleRemoveItemFromPlaylist(item.id)} title="Ukloni"><FiTrash2 /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ REKLAME TAB ══════════════ */}
      {activeTab === 'reklame' && (
        <div className="reklame-content">
          <div className="reklame-card">
            <h2 className="reklame-card-title"><FiUpload /> Dodaj novu reklamu</h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="upload-drop-area" onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? (
                  <div className="upload-file-selected">
                    <span className="upload-file-icon">
                      {selectedFile.type.startsWith('video/') ? '🎬' : selectedFile.type === 'image/gif' ? '🎞️' : '🖼️'}
                    </span>
                    <span className="upload-file-name">{selectedFile.name}</span>
                    <span className="upload-file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <FiUpload className="upload-placeholder-icon" />
                    <p>Kliknite za odabir fajla</p>
                    <p className="upload-placeholder-sub">Slike (JPG, PNG, GIF, WebP) ili Video (MP4, WebM)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/ogg,video/avi,video/quicktime"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="upload-fields">
                <div className="form-group">
                  <label>Naziv reklame *</label>
                  <input type="text" value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} placeholder="Naziv reklame" required />
                </div>
                <div className="form-group">
                  <label>Opis</label>
                  <input type="text" value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcioni opis" />
                </div>
                <div className="form-group form-group-small">
                  <label>Trajanje (sek)</label>
                  <input type="number" min="1" max="3600" value={uploadForm.duration} onChange={e => setUploadForm(p => ({ ...p, duration: e.target.value }))} />
                </div>
                <button type="submit" className="btn-primary" disabled={uploading || !selectedFile}>
                  {uploading ? 'Uploadujem...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>

          <div className="reklame-card">
            <h2 className="reklame-card-title"><FiFilm /> Lista reklama ({ads.length})</h2>
            {adsLoading ? (
              <div className="loading-text">Učitavanje...</div>
            ) : ads.length === 0 ? (
              <div className="empty-state">Nema uploadovanih reklama</div>
            ) : (
              <div className="ads-grid">
                {ads.map(ad => (
                  <div key={ad.id} className={`ad-card ${!ad.isActive ? 'ad-inactive' : ''}`}>
                    <div className="ad-preview">
                      {ad.type === 'video' ? (
                        <video src={getMediaPreviewUrl(ad.fileUrl)} className="ad-thumb" muted preload="metadata" />
                      ) : (
                        <img src={getMediaPreviewUrl(ad.fileUrl)} alt={ad.title} className="ad-thumb" />
                      )}
                      <span className="ad-type-badge">{getFileIcon(ad.type)} {ad.type.toUpperCase()}</span>
                    </div>
                    {editingAd === ad.id ? (
                      <div className="ad-edit-form">
                        <input type="text" value={editAdForm.title} onChange={e => setEditAdForm(p => ({ ...p, title: e.target.value }))} className="edit-input" placeholder="Naziv" />
                        <input type="text" value={editAdForm.description} onChange={e => setEditAdForm(p => ({ ...p, description: e.target.value }))} className="edit-input" placeholder="Opis" />
                        <div className="edit-row">
                          <label>Trajanje (sek):</label>
                          <input type="number" min="1" value={editAdForm.duration} onChange={e => setEditAdForm(p => ({ ...p, duration: e.target.value }))} className="edit-input-small" />
                        </div>
                        <div className="ad-actions">
                          <button className="btn-icon btn-success" onClick={() => saveEditAd(ad.id)} title="Sačuvaj"><FiCheck /></button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingAd(null)} title="Otkaži"><FiX /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="ad-info">
                        <div className="ad-title">{ad.title}</div>
                        {ad.description && <div className="ad-desc">{ad.description}</div>}
                        <div className="ad-meta">
                          <span className="ad-duration">⏱ {ad.duration}s</span>
                          <span className={`ad-status ${ad.isActive ? 'status-active' : 'status-inactive'}`}>
                            {ad.isActive ? 'Aktivna' : 'Neaktivna'}
                          </span>
                        </div>
                        <div className="ad-actions">
                          <button className="btn-icon btn-primary" onClick={() => startEditAd(ad)} title="Uredi"><FiEdit2 /></button>
                          <button className="btn-icon btn-danger" onClick={() => handleDeleteAd(ad.id)} title="Obriši"><FiTrash2 /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline editable duration input
const DurationInput = ({ value, defaultValue, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value !== null && value !== undefined ? String(value) : '');
  const displayValue = value !== null && value !== undefined ? value : defaultValue;

  const handleSave = () => {
    setEditing(false);
    onSave(val || null);
  };

  if (editing) {
    return (
      <input
        type="number" min="1" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        className="duration-inline-input"
        placeholder={String(defaultValue || '')}
        autoFocus
      />
    );
  }

  return (
    <span className="duration-display" onClick={() => setEditing(true)} title="Kliknite za izmjenu">
      {displayValue || '—'}
    </span>
  );
};

export default ReklameManagement;
