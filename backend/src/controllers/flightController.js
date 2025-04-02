const { Op } = require('sequelize');
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const flightModel = require('../models/flightModel'); // Assuming this is still used for deleteMonthlyFlights

// Dohvati sve letove
exports.getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      include: [{
        model: Airline,
        as: 'Airline', // Ensure alias matches model association if defined
      }],
      order: [ // Optional: Add default ordering if desired
        ['departure_time', 'ASC'],
        ['arrival_time', 'ASC']
      ]
    });
    res.json(flights);
  } catch (err) {
    console.error('Error fetching all flights:', err);
    res.status(500).json({ error: err.message });
  }
};

// Dohvati jedan let po ID-u
exports.getFlightById = async (req, res) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findByPk(id, {
      include: [{
        model: Airline,
        as: 'Airline', // Ensure alias matches model association if defined
      }],
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json(flight);
  } catch (err) {
    console.error('Error fetching flight by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Dodaj novi let
exports.createFlight = async (req, res) => {
  try {
    // Added status
    const { airline_id, flight_number, departure_time, arrival_time, destination, is_departure, status, remarks } = req.body;

    // Validacija obavezna polja
    if (!airline_id || !flight_number || !destination) {
      return res.status(400).json({ error: 'Aviokompanija, broj leta i destinacija su obavezni!' });
    }
     // is_departure is also mandatory
     if (typeof is_departure !== 'boolean') {
        return res.status(400).json({ error: 'Polje is_departure (true/false) je obavezno!' });
     }
     // Time is mandatory depending on is_departure
     if (is_departure && !departure_time) {
        return res.status(400).json({ error: 'Vrijeme polaska je obavezno za odlazne letove!' });
     }
     if (!is_departure && !arrival_time) {
        return res.status(400).json({ error: 'Vrijeme dolaska je obavezno za dolazne letove!' });
     }


    // Provjera postojanja aviokompanije
    const airlineExists = await Airline.findByPk(airline_id);
    if (!airlineExists) {
      return res.status(400).json({ error: 'Aviokompanija ne postoji!' });
    }

    // Kreiraj let
    const createdFlight = await Flight.create({
      airline_id,
      flight_number,
      departure_time: is_departure ? departure_time : null,
      arrival_time: !is_departure ? arrival_time : null,
      destination,
      is_departure,
      status: status || 'Na vrijeme/On time', // Use provided status or default
      remarks: remarks || null
    });

    // Fetch the created flight with airline details to return
    const flightWithAirline = await Flight.findByPk(createdFlight.id, {
        include: [{ model: Airline, as: 'Airline' }]
    });

    res.status(201).json(flightWithAirline); // Return flight with airline details
  } catch (err) {
    console.error('Error creating flight:', err);
    // Check for validation errors
    if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error during flight creation.' });
  }
};

// Ažuriraj postojeći let (handles partial updates including status and remarks)
exports.updateFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get all data from body

    // Pronađi let
    const flight = await Flight.findByPk(id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Update only provided fields
    // Basic fields (check if they exist in updateData before assigning)
    if (updateData.airline_id !== undefined) flight.airline_id = updateData.airline_id;
    if (updateData.flight_number !== undefined) flight.flight_number = updateData.flight_number;
    if (updateData.destination !== undefined) flight.destination = updateData.destination;
    if (updateData.is_departure !== undefined) flight.is_departure = updateData.is_departure;

    // Handle time updates based on is_departure flag (if provided or existing)
    const isDeparture = updateData.is_departure !== undefined ? updateData.is_departure : flight.is_departure;
    if (isDeparture) {
        if (updateData.departure_time !== undefined) flight.departure_time = updateData.departure_time;
        if (updateData.arrival_time !== undefined) flight.arrival_time = null; // Clear arrival if it becomes departure
    } else {
        if (updateData.arrival_time !== undefined) flight.arrival_time = updateData.arrival_time;
        if (updateData.departure_time !== undefined) flight.departure_time = null; // Clear departure if it becomes arrival
    }

    // Update status and remarks if provided
    if (updateData.status !== undefined) flight.status = updateData.status;
    if (updateData.remarks !== undefined) flight.remarks = updateData.remarks;


    await flight.save();

    // Fetch the updated flight with airline details to return
    const updatedFlightWithAirline = await Flight.findByPk(id, {
        include: [{ model: Airline, as: 'Airline' }]
    });

    res.json(updatedFlightWithAirline); // Return updated flight with airline details
  } catch (err) {
    console.error('Error updating flight:', err);
     // Check for validation errors
     if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error during flight update.' });
  }
};


// Obriši let
exports.deleteFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findByPk(id);

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    await flight.destroy();
    res.json({ message: 'Flight deleted successfully' });
  } catch (err) {
    console.error('Error deleting flight:', err);
    res.status(500).json({ error: err.message });
  }
};


// Generate Monthly Schedule (includes status)
exports.generateMonthlySchedule = async (req, res) => {
  try {
    const weeklySchedule = req.body;

    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({ error: 'Invalid weekly schedule format!' });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Consider using a transaction if delete and create need to be atomic
    await flightModel.deleteMonthlyFlights(currentYear, currentMonth);

    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0));
    const datesInMonth = [];
    let currentDate = new Date(firstDayOfMonth);

    while (currentDate <= lastDayOfMonth) {
      datesInMonth.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const dayOfWeekMap = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
    };

    for (const day of weeklySchedule) {
      const dayOfWeek = day.day_of_week.toLowerCase();
      const dayNumber = dayOfWeekMap[dayOfWeek];

      if (dayNumber === undefined) {
        console.warn(`Invalid day of week skipped: ${day.day_of_week}`);
        continue;
      }

      const filteredDates = datesInMonth.filter((d) => d.getUTCDay() === dayNumber);

      for (const date of filteredDates) {
        for (const flight of day.flights) {
          const formattedDate = date.toISOString().split('T')[0];
          const departureTime = flight.is_departure ? `${formattedDate}T${flight.departure_time}:00Z` : null;
          const arrivalTime = !flight.is_departure ? `${formattedDate}T${flight.arrival_time}:00Z` : null;

          if (!flight.airline_id || !flight.flight_number || !flight.destination || typeof flight.is_departure !== 'boolean') {
            console.warn('Invalid flight data skipped in schedule generation:', flight);
            continue;
          }
           if (flight.is_departure && !flight.departure_time) {
               console.warn('Missing departure_time for departure flight skipped:', flight);
               continue;
           }
           if (!flight.is_departure && !flight.arrival_time) {
               console.warn('Missing arrival_time for arrival flight skipped:', flight);
               continue;
           }


          try {
              await Flight.create({
                airline_id: flight.airline_id,
                flight_number: flight.flight_number,
                departure_time: departureTime,
                arrival_time: arrivalTime,
                destination: flight.destination,
                is_departure: flight.is_departure,
                status: flight.status || 'Na vrijeme/On time', // Add status from schedule or default
                remarks: flight.remarks || null
              });
          } catch (creationError) {
              console.error(`Error creating flight for date ${formattedDate}:`, creationError, flight);
              // Decide if you want to stop or continue processing other flights
          }
        }
      }
    }

    res.json({ message: 'Monthly schedule generated successfully!' });
  } catch (err) {
    console.error('Error generating monthly schedule:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get Daily Flights (includes status implicitly via model)
exports.getDailyFlights = async (req, res) => {
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
      include: [{
        model: Airline,
        as: 'Airline', // Ensure alias matches model association if defined
      }],
      order: [ // Optional: Add default ordering
        ['departure_time', 'ASC'],
        ['arrival_time', 'ASC']
      ]
    });

    res.status(200).json(flights);
  } catch (error) {
    console.error('Greška pri dobavljanju dnevnih letova:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Daily Departures (includes status implicitly via model)
exports.getDailyDepartures = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const flights = await Flight.findAll({
      where: {
        departure_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
        is_departure: true // Explicitly check for departures
      },
      include: [{
        model: Airline,
        as: 'Airline', // Ensure alias matches model association if defined
      }],
      order: [ ['departure_time', 'ASC'] ] // Order departures by time
    });

    res.json(flights);
  } catch (error) {
    console.error('Greška pri dobavljanju dnevnih odlazaka:', error);
    res.status(500).json({ message: error.message });
  }
};


// Removed updateFlightRemarks as updateFlight now handles it.

// Export all remarks (remains the same)
exports.exportRemarks = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      where: {
        remarks: {
          [Op.ne]: null, // Find flights where remarks is not null
          [Op.ne]: ''    // Optionally, also exclude empty strings if desired
        },
      },
      attributes: ['id', 'flight_number', 'destination', 'remarks'], // Select only needed fields
      include: [{
        model: Airline,
        as: 'Airline',
        attributes: ['name'] // Only get airline name
      }],
      order: [ // Optional ordering
        ['departure_time', 'ASC'],
        ['arrival_time', 'ASC']
      ]
    });
    res.json(flights);
  } catch (err) {
    console.error('Error exporting remarks:', err);
    res.status(500).json({ error: err.message });
  }
};
