const airlineModel = require('../models/airlineModel');
const Flight = require('../models/Flight'); // Import Flight model
// FlightNumber is not needed here anymore
// const FlightNumber = require('../models/FlightNumber'); 
const DisplaySession = require('../models/displaySessionModel'); // Import DisplaySession model

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
    // airlineModel.updateAirline now returns the updated airline instance or throws an error
    const updatedAirline = await airlineModel.updateAirline(id, req.body); 
    
    // If updateAirline succeeded, updatedAirline will contain the updated record.
    // The check for 'not found' is handled within airlineModel.updateAirline.
    // No need to check rowCount or access .rows[0].
    res.json(updatedAirline); // Return the updated airline object directly

  } catch (err) {
    // Log the error for debugging
    console.error(`Error updating airline with ID ${id}:`, err);

    // Handle specific errors like 'Airline not found' thrown by the model
    if (err.message === 'Airline not found') {
      return res.status(404).json({ error: err.message });
    }
    
    // Handle potential validation errors from Sequelize (though model handles updates carefully)
    if (err.name === 'SequelizeValidationError') {
       return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }

    // Generic bad request for other issues during update
    res.status(400).json({ error: err.message || 'An error occurred while updating the airline.' });
  }
};

// Obriši aviokompaniju
exports.deleteAirline = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check if the airline exists
    const airline = await airlineModel.getAirlineById(id);
    if (!airline) {
      return res.status(404).json({ error: 'Airline not found' });
    }

    // 2. Check for references in Flights
    const referencingFlights = await Flight.findOne({ where: { airline_id: id } });
    if (referencingFlights) {
      return res.status(409).json({ 
        error: 'Cannot delete airline: It is referenced by existing flights.' 
       });
     }

    // 3. Check for references in DisplaySessions (using custom_airline_id)
    const referencingDisplaySessions = await DisplaySession.findOne({ where: { custom_airline_id: id } });
    if (referencingDisplaySessions) {
      return res.status(409).json({ 
        error: 'Cannot delete airline: It is referenced by existing display sessions.' 
      });
    }

    // 4. If no references found, proceed with deletion
    const success = await airlineModel.deleteAirline(id); 
    
    // Assuming deleteAirline returns true on success and throws error otherwise (based on its code)
    if (success) {
      res.json({ message: 'Airline deleted successfully' });
    } else {
      // This case should ideally not be reached if deleteAirline throws on error
      console.error(`Airline deletion for ID ${id} reported failure unexpectedly.`);
      res.status(500).json({ error: 'Airline deletion failed unexpectedly.' });
    }

  } catch (err) {
    // Log the detailed error for debugging
    console.error(`Error deleting airline with ID ${id}:`, err); 

    // Check if it's a known constraint violation error (example for PostgreSQL)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
       return res.status(409).json({ 
         error: 'Cannot delete airline: It is still referenced by other records.' 
       });
    }
    
    // Generic server error for other issues
    res.status(500).json({ error: 'An unexpected error occurred while deleting the airline.' });
  }
};
