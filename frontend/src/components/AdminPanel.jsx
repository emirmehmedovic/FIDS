import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from './AuthProvider';
import 'react-toastify/dist/ReactToastify.css';
import './AdminPanel.css';
import config from '../config';

const AdminPanel = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Dohvati listu korisnika - wrapped in useCallback
  const fetchUsers = useCallback(async () => {
    // Added setLoading(true) at the start
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      if (!user || !user.token) {
        throw new Error('Niste prijavljeni');
      }
      
      const response = await axios.get(`${config.apiUrl}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      setUsers(response.data);
    } catch (err) {
      // Keep existing error handling
      setError('Greška pri dobijanju liste korisnika');
      console.error('Detalji greške:', err);
      toast.error('Greška pri dobijanju liste korisnika');
    } finally {
      setLoading(false);
    }
  }, [user]); // Added user as dependency for useCallback

  // Pozovi fetchUsers prilikom učitavanja komponente
  useEffect(() => {
    // Dodatna provjera da li je korisnik admin
    if (!user) {
      console.log('Korisnik nije prijavljen');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('Korisnik nije admin:', user);
      toast.error('Nemate pristup admin panelu');
      navigate('/dashboard');
      return;
    }
    
    console.log('Admin korisnik učitava panel:', user);
    // Check user role before fetching
    if (user && user.role === 'admin') {
        fetchUsers();
    } else if (user) {
        // If user is logged in but not admin
        console.log('Korisnik nije admin:', user);
        toast.error('Nemate pristup admin panelu');
        navigate('/dashboard'); // Redirect non-admins
    } else {
        // If user is not logged in at all
        console.log('Korisnik nije prijavljen');
        navigate('/login'); // Redirect to login
    }
    // Removed user and navigate from dependency array as they are handled inside
    // Added fetchUsers dependency
  }, [user, navigate, fetchUsers]);


  // Funkcija za kreiranje korisnika
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user || !user.token) {
        throw new Error('Niste prijavljeni');
      }
      
      await axios.post(
        `${config.apiUrl}/api/auth/create-user`,
        { username, password, role },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      toast.success('Korisnik uspješno kreiran');
      setUsername('');
      setPassword('');
      setRole('user');
      fetchUsers();
    } catch (err) {
      setError('Greška prilikom kreiranja korisnika');
      console.error(err);
      toast.error('Greška prilikom kreiranja korisnika');
    }
  };

  // Funkcija za brisanje korisnika
  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm('Jeste li sigurni da želite obrisati ovog korisnika?');
    if (confirmDelete) {
      try {
        if (!user || !user.token) {
          throw new Error('Niste prijavljeni');
        }
        
        await axios.delete(`${config.apiUrl}/api/auth/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        
        toast.success('Korisnik uspješno obrisan');
        fetchUsers();
      } catch (err) {
        setError('Greška pri brisanju korisnika');
        console.error(err);
        toast.error('Greška pri brisanju korisnika');
      }
    }
  };

  return (
    <div className="admin-panel-container"> {/* Changed container class */}
      <ToastContainer />
      <h2>Administratorski Panel</h2> {/* Changed title */}
      {error && <p className="error-message">{error}</p>}

      {/* Add User Form Section */}
      <h3 className="section-title">Kreiraj Novog Korisnika</h3> {/* Added section title */}
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Korisničko ime:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Lozinka:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Uloga:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="stw">STW</option> {/* Add STW role option */}
          </select>
        </div>
        <button type="submit" className="submit-button">Kreiraj Korisnika</button>
      </form>

      {/* Users List Section */}
      <h3 className="section-title">Lista Korisnika</h3> {/* Added section title */}
      {loading ? (
        <p>Učitavanje korisnika...</p>
      ) : (
        <div className="table-responsive-admin"> {/* Added responsive wrapper */}
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
              <th>Korisničko ime</th>
              <th>Uloga</th>
              <th>Datum kreiranja</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteUser(user.id)} 
                    className="delete-button"
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div> // Closed responsive wrapper
      )}
    </div>
  );
};

export default AdminPanel;
