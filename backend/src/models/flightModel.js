// models/flightModel.js (ispravljeno)
const Flight = require('../models/Flight'); // Uvoz Flight modela
const { Op } = require('sequelize'); // Uvoz Sequelize operatora
const sequelize = require('../config/db');

// Dohvati sve letove
const getAllFlights = async () => {
  try {
    const flights = await Flight.findAll({
      include: [{
        model: require('../models/Airline'), // Uključite aviokompaniju
        as: 'Airline',
      }],
    });
    return flights;
  } catch (err) {
    console.error('Error fetching all flights:', err);
    throw err;
  }
};

// Funkcija za dohvaćanje dnevnih polazaka
const getDailyDepartures = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const departures = await Flight.findAll({
      where: {
        is_departure: true,
        departure_time: {
          [Op.between]: [startOfDay, endOfDay], // Koristite Op umjesto Sequelize.Op
        },
      },
      include: [
        {
          model: require('../models/Airline'), // Uključite aviokompaniju
          as: 'Airline',
        },
      ],
    });

    return departures;
  } catch (error) {
    console.error('Error in getDailyDepartures:', error);
    throw error;
  }
};

// Dohvati jedan let po ID-u
const getFlightById = async (id) => {
  try {
    const flight = await Flight.findByPk(id);
    if (!flight) throw new Error('Flight not found');
    return flight;
  } catch (err) {
    console.error('Error fetching flight by ID:', err);
    throw err;
  }
};

// Kreiraj novi let
const createFlight = async ({
  airline_id,
  flight_number,
  departure_time,
  arrival_time,
  destination,
  is_departure,
  remarks,
}) => {
  try {
    // Validacija obaveznih polja
    if (!airline_id || !flight_number || !destination) {
      throw new Error('Missing required fields: airline_id, flight_number, or destination');
    }

    // Validacija vremena
    if (is_departure && !departure_time) {
      throw new Error('Departure time is required for departure flights');
    }
    if (!is_departure && !arrival_time) {
      throw new Error('Arrival time is required for arrival flights');
    }

    const flight = await Flight.create({
      airline_id,
      flight_number,
      departure_time: departure_time || null,
      arrival_time: arrival_time || null,
      destination,
      is_departure,
      remarks: remarks || '',
    });
    return flight;
  } catch (err) {
    console.error('Error in createFlight:', err);
    throw err;
  }
};

// Ažuriraj postojeći let
const updateFlight = async (id, {
  airline_id,
  flight_number,
  departure_time,
  arrival_time,
  destination,
  is_departure,
  remarks,
}) => {
  try {
    const flight = await Flight.findByPk(id);
    if (!flight) throw new Error('Flight not found');

    flight.airline_id = airline_id;
    flight.flight_number = flight_number;
    flight.departure_time = is_departure ? departure_time || null : null;
    flight.arrival_time = !is_departure ? arrival_time || null : null;
    flight.destination = destination;
    flight.is_departure = is_departure;
    flight.remarks = remarks || '';
    await flight.save();
    return flight;
  } catch (err) {
    console.error('Error in updateFlight:', err);
    throw err;
  }
};

// Obriši let po ID-u
const deleteFlight = async (id) => {
  try {
    const flight = await Flight.findByPk(id);
    if (!flight) throw new Error('Flight not found');
    await flight.destroy();
    return true;
  } catch (err) {
    console.error('Error in deleteFlight:', err);
    throw err;
  }
};

// Obriši sve letove za određeni mjesec
const deleteMonthlyFlights = async (year, month) => {
  try {
    // Ensure year and month are numbers
    const targetYear = parseInt(year, 10);
    const targetMonth = parseInt(month, 10);

    if (isNaN(targetYear) || isNaN(targetMonth)) {
      throw new Error('Invalid year or month provided for deletion.');
    }

    console.log('Deleting all flights for year:', targetYear, 'and month:', targetMonth);
    
    const result = await Flight.destroy({
      where: {
        [Op.or]: [
          // Condition for departure time within the target month and year
          {
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "departure_time"')), targetYear),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "departure_time"')), targetMonth)
            ]
          },
          // Condition for arrival time within the target month and year
          {
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "arrival_time"')), targetYear),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "arrival_time"')), targetMonth)
            ]
          }
        ]
      }
    });
    console.log(`Deleted flights count for ${targetMonth}/${targetYear}:`, result);
    return result;
  } catch (err) {
    console.error('Error in deleteMonthlyFlights:', err);
    throw err;
  }
};

// Dohvati letove za tekući dan
const getDailyFlights = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const flights = await Flight.findAll({
      where: {
        [Op.or]: [
          { departure_time: { [Op.between]: [startOfDay, endOfDay] } },
          { arrival_time: { [Op.between]: [startOfDay, endOfDay] } },
        ],
      },
    });
    return flights;
  } catch (err) {
    console.error('Error in getDailyFlights:', err);
    throw err;
  }
};

// Ažuriraj remarks za let
const updateRemarks = async (id, remarks) => {
  try {
    const flight = await Flight.findByPk(id);
    if (!flight) throw new Error('Flight not found');
    flight.remarks = remarks;
    await flight.save();
    return flight;
  } catch (err) {
    console.error('Error in updateRemarks:', err);
    throw err;
  }
};

// Eksportuj sve remarks
const exportRemarks = async () => {
  try {
    const flights = await Flight.findAll({
      attributes: ['id', 'flight_number', 'remarks'],
    });
    return flights;
  } catch (err) {
    console.error('Error in exportRemarks:', err);
    throw err;
  }
};

module.exports = {
  getAllFlights,
  getDailyDepartures,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  deleteMonthlyFlights,
  getDailyFlights,
  updateRemarks,
  exportRemarks,
};
