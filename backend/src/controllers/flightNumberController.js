// controllers/flightNumberController.js
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Initialize the FlightNumber model
const FlightNumberModel = require('../models/flightNumber');
const FlightNumber = FlightNumberModel(sequelize, DataTypes);

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
