// controllers/flightNumberController.js
const { Op } = require('sequelize');
// No longer need sequelize or DataTypes here for initialization
// const sequelize = require('../config/db'); 
// const { DataTypes } = require('sequelize');

// Import the initialized FlightNumber model directly
const FlightNumber = require('../models/FlightNumber');
// Remove the incorrect initialization line:
// const FlightNumber = FlightNumberModel(sequelize, DataTypes); 

exports.getAll = async (req, res) => {
  try {
    const flightNumbers = await FlightNumber.findAll();
    res.json(flightNumbers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { number, destination, is_departure } = req.body;
    
    // Check for duplicates
    const existing = await FlightNumber.findOne({ 
      where: { 
        number,
        destination,
        is_departure
      } 
    });
    
    if (existing) {
      return res.status(400).send('Flight number already exists');
    }

    const flightNumber = await FlightNumber.create(req.body);
    res.status(201).json(flightNumber);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.delete = async (req, res) => {
  try {
    await FlightNumber.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err.message);
  }
};
