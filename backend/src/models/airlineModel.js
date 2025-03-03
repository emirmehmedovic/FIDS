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

    const airline = await Airline.create({ name, logo_url, iata_code });
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

    airline.name = name || airline.name;
    airline.logo_url = logo_url || airline.logo_url;
    airline.iata_code = iata_code || airline.iata_code;
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