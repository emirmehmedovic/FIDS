const Airline = require('../models/Airline');

// Dohvati sve aviokompanije
const getAllAirlines = async () => {
  try {
    const airlines = await Airline.findAll();
    return airlines;
  } catch (err) {
    console.error('Error querying airlines:', err);
    throw err;
  }
};

// Dohvati jednu aviokompaniju po ID-u
const getAirlineById = async (id) => {
  try {
    const airline = await Airline.findByPk(id);
    if (!airline) throw new Error('Airline not found');
    return airline;
  } catch (err) {
    console.error('Error fetching airline by ID:', err);
    throw err;
  }
};

// Dodaj novu aviokompaniju
const createAirline = async ({ name, logo_url, iata_code }) => {
  try {
    // Validacija obaveznih polja
    if (!name || !iata_code) {
      throw new Error('Missing required fields: name or iata_code');
    }

    // Osiguraj da logo_url počinje sa /uploads/ ako je proslijeđen i nije već relativna putanja
    let final_logo_url = logo_url;
    if (final_logo_url && !final_logo_url.startsWith('/uploads/') && !final_logo_url.startsWith('http')) {
        // Ako je samo ime fajla, dodaj prefiks
        final_logo_url = `/uploads/${final_logo_url}`;
    } else if (!final_logo_url) {
        // Ako logo nije proslijeđen, postavi na null ili default
        final_logo_url = null; // Ili postavite na neku default putanju ako želite
    }
    // Ako već počinje sa /uploads/ ili http, koristi ga kakav jeste

    const airline = await Airline.create({ name, logo_url: final_logo_url, iata_code });
    return airline;
  } catch (err) {
    console.error('Error creating airline:', err);
    throw err;
  }
};

// Ažuriraj postojeću aviokompaniju
const updateAirline = async (id, { name, logo_url, iata_code }) => {
  try {
    const airline = await Airline.findByPk(id);
    if (!airline) throw new Error('Airline not found');

    airline.name = name !== undefined ? name : airline.name; // Ažuriraj samo ako je proslijeđeno

    // Obradi logo_url slično kao u createAirline
    if (logo_url !== undefined) {
        let final_logo_url = logo_url;
        if (final_logo_url && !final_logo_url.startsWith('/uploads/') && !final_logo_url.startsWith('http')) {
            final_logo_url = `/uploads/${final_logo_url}`;
        } else if (final_logo_url === '') { // Omogući brisanje loga slanjem praznog stringa
             final_logo_url = null;
        }
        // Ako je null ili već ispravan format, koristi ga
        airline.logo_url = final_logo_url;
    }

    airline.iata_code = iata_code !== undefined ? iata_code : airline.iata_code; // Ažuriraj samo ako je proslijeđeno
    await airline.save();
    return airline;
  } catch (err) {
    console.error('Error updating airline:', err);
    throw err;
  }
};

// Obriši aviokompaniju
const deleteAirline = async (id) => {
  try {
    const airline = await Airline.findByPk(id);
    if (!airline) throw new Error('Airline not found');
    await airline.destroy();
    return true;
  } catch (err) {
    console.error('Error deleting airline:', err);
    throw err;
  }
};

module.exports = {
  getAllAirlines,
  getAirlineById,
  createAirline,
  updateAirline,
  deleteAirline,
};
