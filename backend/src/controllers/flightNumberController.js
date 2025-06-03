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
    // Explicitly select columns matching the reverted model
    const flightNumbers = await FlightNumber.findAll({
        attributes: ['id', 'number', 'destination', 'is_departure'], // Select only existing columns
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
    // Revert: Expect fields matching the original model
    const { number, destination, is_departure } = req.body;

    // Basic validation
    if (!number || !destination || typeof is_departure !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields: number, destination, is_departure' });
    }

    // Revert: Check for duplicates based on number only (assuming number is unique)
    // If number is NOT unique, this check needs adjustment or removal.
    const existing = await FlightNumber.findOne({ 
      where: { number } 
    });
    
    if (existing) {
      return res.status(409).json({ error: `Flight number ${number} already exists.` });
    }

    // Create using the original fields
    const flightNumber = await FlightNumber.create({
        number,
        destination,
        is_departure
    });
    
    // Return the created object directly (no need to refetch without includes)
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

    // 2. Extract fields from request body
    const { number, destination, is_departure } = req.body;

    // 3. Basic validation
    if (!number || !destination || typeof is_departure !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: number, destination, is_departure' });
    }

    // 4. Check for duplicates (only if number is changed)
    if (number !== flightNumber.number) {
      const existing = await FlightNumber.findOne({ 
        where: { number } 
      });
      
      if (existing) {
        return res.status(409).json({ error: `Flight number ${number} already exists.` });
      }
    }

    // 5. Update the flight number
    await flightNumber.update({
      number,
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
