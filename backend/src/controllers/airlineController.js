const airlineModel = require('../models/airlineModel');
// Dohvati sve aviokompanije
exports.getAllAirlines = async (req, res) => {
  try {
    console.log('Fetching airlines from controller...');
    const result = await airlineModel.getAllAirlines();
    res.json(result); // Vraća direktno niz
  } catch (err) {
    console.error('Error in airlineController:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Dohvati jednu aviokompaniju po ID-u
exports.getAirlineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await airlineModel.getAirlineById(id);
    if (!result) { // Consistent 404 handling
      return res.status(404).json({ error: 'Airline not found' }); 
    }
    res.json(result); // No need for result.rows if using Sequelize
  } catch (err) {
    console.error('Error fetching airline by ID:', err); // Log the error
    res.status(500).json({ error: err.message });
  }
};
exports.createAirline = async (req, res) => {
  try {
    const { name, logo_url, iata_code } = req.body;

    // Validacija obaveznih polja
    if (!name || !logo_url || !iata_code) {
      return res.status(400).json({ error: 'Sva polja su obavezna!' });
    }

    // Kreiranje aviokompanije
    const airline = await airlineModel.createAirline({ name, logo_url, iata_code });
    res.status(201).json(airline);
  } catch (err) {
    console.error('Error creating airline:', err);
    res.status(400).json({ error: err.message });
  }
};

// Ažuriraj postojecu aviokompaniju
exports.updateAirline = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await airlineModel.updateAirline(id, req.body);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Airline not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obriši aviokompaniju
exports.deleteAirline = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await airlineModel.deleteAirline(id);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Airline not found' });
    res.json({ message: 'Airline deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};