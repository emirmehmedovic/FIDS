// controllers/destinationController.js
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Initialize the Destination model
const DestinationModel = require('../models/Destination');
const Destination = DestinationModel(sequelize, DataTypes);

exports.getAll = async (req, res) => {
  try {
    const destinations = await Destination.findAll();
    res.json(destinations);
  } catch (err) {
    res.status(500).send(err.message);
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
        return res.status(400).send('Destinacija već postoji');
      }
  
      const destination = await Destination.create(req.body);
      res.status(201).json(destination);
    } catch (err) {
      res.status(400).send(err.message);
    }
  };

exports.delete = async (req, res) => {
  try {
    await Destination.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err.message);
  }
};
