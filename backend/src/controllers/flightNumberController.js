// controllers/flightNumberController.js
const { Op } = require('sequelize');
// No longer need sequelize or DataTypes here for initialization
// const sequelize = require('../config/db'); 
const FlightNumber = require('../models/FlightNumber');
// Import Airline and Destination if needed for validation checks
const Airline = require('../models/Airline');
const Destination = require('../models/Destination');

exports.getAll = async (req, res) => {
  try {
    // Explicitly select columns including airline_code
    const flightNumbers = await FlightNumber.findAll({
        attributes: ['id', 'number', 'airline_code', 'destination', 'is_departure'], // Include airline_code
        order: [['number', 'ASC']]
    });
    res.json(flightNumbers);
  } catch (err) {
    console.error("Error fetching flight numbers:", err);
    res.status(500).json({ error: "Failed to fetch flight numbers" });
  }
};

exports.create = async (req, res) => {
  try {
    // Extract fields including airline_code
    const { number, airline_code, destination, is_departure } = req.body;

    // Basic validation - airline_code is optional for backward compatibility
    if (!number || !destination || typeof is_departure !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields: number, destination, is_departure' });
    }

    // Check for duplicates based on airline_code + destination + is_departure combination
    // If airline_code is provided, check the full combination
    // If not, check just destination + is_departure (legacy behavior)
    const whereClause = airline_code
      ? { airline_code, destination, is_departure }
      : { airline_code: null, destination, is_departure };

    const existing = await FlightNumber.findOne({
      where: whereClause
    });

    if (existing) {
      const mapping = airline_code
        ? `${airline_code} - ${destination} (${is_departure ? 'Departure' : 'Arrival'})`
        : `${destination} (${is_departure ? 'Departure' : 'Arrival'})`;
      return res.status(409).json({ error: `Flight number mapping for ${mapping} already exists.` });
    }

    // Create with airline_code (can be null)
    const flightNumber = await FlightNumber.create({
        number,
        airline_code: airline_code || null,
        destination,
        is_departure
    });

    // Return the created object directly
    res.status(201).json(flightNumber);
  } catch (err) {
    console.error("Error creating flight number:", err);
     // Handle validation errors specifically
     if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeForeignKeyConstraintError') {
         const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
         return res.status(400).json({ error: messages.join(', ') });
     }
    res.status(500).json({ error: "Failed to create flight number" });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check if it exists
    const flightNumber = await FlightNumber.findByPk(id);
    if (!flightNumber) {
        return res.status(404).json({ error: 'Flight number not found' });
    }
    
    // 2. Delete it
    await flightNumber.destroy();
    res.status(204).send(); // No content
  } catch (err) {
    console.error(`Error deleting flight number with ID ${id}:`, err);
    res.status(500).json({ error: "Failed to delete flight number" });
  }
};
exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check if the flight number exists
    const flightNumber = await FlightNumber.findByPk(id);
    if (!flightNumber) {
      return res.status(404).json({ error: 'Flight number not found' });
    }

    // 2. Extract fields from request body including airline_code (optional for backward compatibility)
    const { number, airline_code, destination, is_departure } = req.body;

    // 3. Basic validation - airline_code is optional
    if (!number || !destination || typeof is_departure !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: number, destination, is_departure' });
    }

    // 4. Check for duplicates based on airline_code + destination + is_departure
    // (only if the combination is changed)
    const newAirlineCode = airline_code || null;
    if (newAirlineCode !== flightNumber.airline_code ||
        destination !== flightNumber.destination ||
        is_departure !== flightNumber.is_departure) {

      const whereClause = newAirlineCode
        ? { airline_code: newAirlineCode, destination, is_departure }
        : { airline_code: null, destination, is_departure };

      const existing = await FlightNumber.findOne({
        where: whereClause
      });

      if (existing && existing.id !== parseInt(id)) {
        const mapping = newAirlineCode
          ? `${newAirlineCode} - ${destination} (${is_departure ? 'Departure' : 'Arrival'})`
          : `${destination} (${is_departure ? 'Departure' : 'Arrival'})`;
        return res.status(409).json({ error: `Flight number mapping for ${mapping} already exists.` });
      }
    }

    // 5. Update the flight number
    await flightNumber.update({
      number,
      airline_code: newAirlineCode,
      destination,
      is_departure
    });

    // 6. Return the updated flight number
    res.json(flightNumber);
  } catch (err) {
    console.error(`Error updating flight number with ID ${id}:`, err);
    // Handle validation errors specifically
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeForeignKeyConstraintError') {
      const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: "Failed to update flight number" });
  }
};
