// controllers/destinationController.js
const { Op } = require('sequelize'); // Import Op once
const sequelize = require('../config/db'); // May not be needed directly if model is self-contained
// Removed duplicate Op import
const Destination = require('../models/Destination'); // Correctly require the model
const Flight = require('../models/Flight'); // Need Flight to check references
const FlightNumber = require('../models/FlightNumber'); // Need FlightNumber to check references

exports.getAll = async (req, res) => {
  try {
    const destinations = await Destination.findAll({ order: [['name', 'ASC']] }); // Add ordering
    res.json(destinations);
  } catch (err) {
    console.error("Error fetching destinations:", err); // Log error
    res.status(500).json({ error: "Failed to fetch destinations" }); // Use JSON response
  }
};

exports.create = async (req, res) => {
    try {
      const { name, code } = req.body;
      
      // Provjera duplikata
      const existing = await Destination.findOne({ 
        where: { 
          [Op.or]: [{ name }, { code }] 
        } 
      });
      
      if (existing) {
        // Use JSON response
        return res.status(409).json({ error: `Destinacija sa imenom "${existing.name}" ili kodom "${existing.code}" već postoji.` });
      }
  
      const destination = await Destination.create(req.body);
      res.status(201).json(destination);
    } catch (err) {
      console.error("Error creating destination:", err); // Log error
      // Handle validation errors specifically
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
          const messages = err.errors.map(e => e.message);
          return res.status(400).json({ error: messages.join(', ') });
      }
      res.status(500).json({ error: "Failed to create destination" }); // Use JSON response
    }
  };

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check if destination exists
    const destination = await Destination.findByPk(id);
    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    // 2. Check for references in Flights using the correct column name
    const referencingFlight = await Flight.findOne({ where: { destination_id_new: id } }); // Changed to destination_id_new
    if (referencingFlight) {
      return res.status(409).json({ 
        error: 'Cannot delete destination: It is referenced by existing flights.' 
      });
    }
    
    // 3. Check for references in FlightNumbers (using the string 'destination' field)
    // Assuming the 'destination' column in flight_numbers stores the destination name + code string, e.g., "Frankfurt Hahn (HHN)"
    // We need to construct this string from the destination object being deleted.
    const destinationString = `${destination.name} (${destination.code})`; 
    const referencingFlightNumber = await FlightNumber.findOne({ where: { destination: destinationString } });
     if (referencingFlightNumber) {
       return res.status(409).json({ 
         error: `Cannot delete destination: It is referenced by existing flight number(s) like ${referencingFlightNumber.number} (Destination: ${destinationString}).` 
       });
     }

    // 4. If no references, proceed with deletion
    await destination.destroy(); // Use instance destroy
    res.status(204).send(); // No content on successful deletion

  } catch (err) {
    console.error(`Error deleting destination with ID ${id}:`, err); // Log error
     // Check if it's a known constraint violation error (might be redundant due to checks above)
     if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ 
          error: 'Cannot delete destination: It is still referenced by other records.' 
        });
     }
    res.status(500).json({ error: "Failed to delete destination" }); // Use JSON response
  }
};
// TODO: Add exports.update function
