const { Op } = require('sequelize');
// Removed date-fns-tz import as it's causing issues
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const Destination = require('../models/Destination'); // Import Destination model
const flightModel = require('../models/flightModel'); // Assuming this is still used for deleteMonthlyFlights
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// Define allowed statuses consistent with the model
const allowedStatuses = ['SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED', 'BOARDING', 'DIVERTED'];

// Dohvati sve letove
exports.getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      attributes: {
        exclude: ['destination_id'] // Exclude destination_id from the query
      },
      include: [
        {
          model: Airline,
          as: 'Airline', // Re-added alias
          attributes: ['id', 'name', 'logo_url', 'iata_code'] // Specify needed attributes
        },
        {
          model: Destination,
          as: 'DestinationInfo', // Use the alias defined in Flight model
          attributes: ['id', 'name', 'code'] // Specify needed attributes
        }
      ],
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
      attributes: {
        exclude: ['destination_id'] // Exclude destination_id from the query
      },
      include: [
        {
          model: Airline,
          as: 'Airline', // Re-added alias
        },
        {
          model: Destination,
          as: 'DestinationInfo' // Include Destination using the correct alias
        }
      ],
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
    // Use destination_id and ensure status matches ENUM
    const { airline_id, flight_number, departure_time, arrival_time, destination_id, is_departure, status, remarks } = req.body;

    // Validacija obavezna polja
    if (!airline_id || !flight_number || destination_id === undefined || destination_id === null) { // Check for destination_id
      return res.status(400).json({ error: 'Aviokompanija, broj leta i ID destinacije su obavezni!' });
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

    // Validate status if provided - Use the updated allowedStatuses list
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status value. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    // Kreiraj let
    const createdFlight = await Flight.create({
      airline_id,
      flight_number,
      departure_time: is_departure ? departure_time : null,
      arrival_time: !is_departure ? arrival_time : null,
      destination_id_new: destination_id, // Map destination_id from request to destination_id_new in model
      is_departure,
      status: status || null, // Changed default status to null
      remarks: remarks || null
    }, {
      // Explicitly define the columns to return, excluding the old 'destination_id'
      returning: ['id', 'airline_id', 'flight_number', 'departure_time', 'arrival_time', 'destination_id_new', 'destination', 'is_departure', 'remarks', 'status']
    });

    // Fetch the created flight with airline details to return
    // Note: We use createdFlight.id which comes directly from the successful create operation
    const flightWithDetails = await Flight.findByPk(createdFlight.id, {
        attributes: {
          exclude: ['destination_id'] // Exclude destination_id from the query
        },
        include: [
          { model: Airline, as: 'Airline' }, // Re-added alias
          { model: Destination, as: 'DestinationInfo' }
        ]
    });

    res.status(201).json(flightWithDetails); // Return flight with details
  } catch (err) {
    console.error('Error creating flight:', err);
    // Check for validation errors (including model validation)
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
    if (updateData.destination_id !== undefined) flight.destination_id_new = updateData.destination_id; // Map destination_id to destination_id_new
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

    // Update status and remarks if provided - Use the updated allowedStatuses list
    if (updateData.status !== undefined) {
        // Allow setting status to null
        if (updateData.status !== null && !allowedStatuses.includes(updateData.status)) {
             const error = new Error(`Invalid status value. Allowed values: ${allowedStatuses.join(', ')} or null`);
             error.name = 'ValidationError';
             throw error;
        }
        flight.status = updateData.status; // Assign null or the valid status string
    }
    if (updateData.remarks !== undefined) flight.remarks = updateData.remarks;

    await flight.save(); // Model validation will run here

    // Fetch the updated flight with airline details to return
    const updatedFlightWithDetails = await Flight.findByPk(id, {
        attributes: {
          exclude: ['destination_id'] // Exclude destination_id from the query
        },
        include: [
          { model: Airline, as: 'Airline' }, // Re-added alias
          { model: Destination, as: 'DestinationInfo' }
        ]
    });

    res.json(updatedFlightWithDetails); // Return updated flight with details
  } catch (err) {
    console.error('Error updating flight:', err);
     // Check for validation errors (including the custom one and model validation)
     if (err.name === 'SequelizeValidationError' || err.name === 'ValidationError') {
        const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
        return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error during flight update.' });
  }
};


// Obriši let
exports.deleteFlight = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid flight ID' });
    }
    
    // First check if the flight exists
    const flight = await Flight.findByPk(id);
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    // Check if this flight is referenced in display_sessions
    const DisplaySession = require('../models/displaySessionModel');
    
    // Find references to this flight in display_sessions
    const sessionReferences = await sequelize.query(
      `SELECT id, flight_id, flight1_id, flight2_id 
       FROM display_sessions 
       WHERE flight_id = :id OR flight1_id = :id OR flight2_id = :id`,
      { 
        replacements: { id },
        type: QueryTypes.SELECT 
      }
    );
    
    if (sessionReferences.length > 0) {
      console.log(`Flight ${id} is referenced in ${sessionReferences.length} display sessions. Nullifying references...`);
      
      // Update all references to null
      const updatePromises = sessionReferences.map(session => {
        const updates = {};
        
        if (session.flight_id === parseInt(id)) {
          updates.flight_id = null;
        }
        
        if (session.flight1_id === parseInt(id)) {
          updates.flight1_id = null;
        }
        
        if (session.flight2_id === parseInt(id)) {
          updates.flight2_id = null;
        }
        
        return DisplaySession.update(updates, {
          where: { id: session.id }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`Nullified all references to flight ${id} in display_sessions`);
    }
    
    // Now it's safe to delete the flight
    await flight.destroy();
    res.json({ 
      message: 'Flight deleted successfully',
      referencesRemoved: sessionReferences.length
    });
  } catch (err) {
    console.error('Error deleting flight:', err);
    res.status(500).json({ error: err.message });
  }
};


// Generate Monthly Schedule (includes status)
exports.generateMonthlySchedule = async (req, res) => {
  try {
    // Handle both old format (array) and new format (object with weeklySchedule and clientTimezoneOffset)
    let weeklySchedule;
    let clientTimezoneOffset = 0; // Default to 0 if not provided
    
    if (Array.isArray(req.body)) {
      // Old format - just an array of weekly schedule
      weeklySchedule = req.body;
    } else if (req.body && req.body.weeklySchedule) {
      // New format - object with weeklySchedule and clientTimezoneOffset
      weeklySchedule = req.body.weeklySchedule;
      
      // Get the timezone offset if provided
      if (req.body.clientTimezoneOffset !== undefined) {
        clientTimezoneOffset = Number(req.body.clientTimezoneOffset);
        console.log(`Client timezone offset provided: ${clientTimezoneOffset} hours from UTC`);
      }
    } else {
      return res.status(400).json({ error: 'Invalid request format! Expected array or object with weeklySchedule' });
    }

    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({ error: 'Invalid weekly schedule format!' });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Try to delete monthly flights, but don't fail if some can't be deleted
    try {
      const deletedCount = await flightModel.deleteMonthlyFlights(currentYear, currentMonth);
      console.log(`Deleted ${deletedCount} flights for ${currentMonth}/${currentYear}`);
    } catch (deleteError) {
      console.error('Error deleting monthly flights, will proceed to add new ones:', deleteError);
      // Continue with adding new flights even if delete failed
    }

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

    const createdFlightsCount = { success: 0, error: 0 };

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
          const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
          
          let finalDateTimeUTC = null; // Use a single variable

          try {
            let timeStringUTC = null;
            if (flight.is_departure && flight.departure_time) {
              timeStringUTC = flight.departure_time;
            } else if (!flight.is_departure && flight.arrival_time) {
              timeStringUTC = flight.arrival_time;
            }

            if (timeStringUTC) {
              // Parse the incoming UTC ISO string
              const incomingDate = new Date(timeStringUTC);
              if (isNaN(incomingDate.getTime())) {
                throw new Error(`Invalid date string received from frontend: ${timeStringUTC}`);
              }

              // Extract UTC hours and minutes from the incoming date
              const hoursUTC = incomingDate.getUTCHours();
              const minutesUTC = incomingDate.getUTCMinutes();

              // Create the final Date object using the loop's current date (year, month, day) 
              // and the UTC time extracted from the incoming string.
              // Ensure we are using UTC methods for date parts.
              finalDateTimeUTC = new Date(Date.UTC(
                date.getUTCFullYear(), // Use UTC year from loop date
                date.getUTCMonth(),    // Use UTC month from loop date
                date.getUTCDate(),     // Use UTC day from loop date
                hoursUTC,              // Use UTC hours from incoming time
                minutesUTC             // Use UTC minutes from incoming time
                // Seconds and milliseconds default to 0
              ));

              // Double-check if the resulting date is valid
              if (isNaN(finalDateTimeUTC.getTime())) {
                  throw new Error(`Failed to construct valid final UTC date for ${formattedDate} ${hoursUTC}:${minutesUTC}`);
              }
            } else {
               // Handle cases where expected time is missing (though previous checks should catch this)
               console.warn(`Missing expected time for flight on ${formattedDate}:`, flight);
               createdFlightsCount.error++;
               continue; 
            }

          } catch (timeParsingError) {
            console.error(`Error processing time for flight ${flight.flight_number} on ${formattedDate}: ${timeParsingError.message}`);
            createdFlightsCount.error++;
            continue; // Skip this flight if time parsing or construction fails
          }

          // Use destination_id and validate status
          if (!flight.airline_id || !flight.flight_number || flight.destination_id === undefined || flight.destination_id === null || typeof flight.is_departure !== 'boolean') {
            console.warn('Invalid flight data (missing required fields) skipped in schedule generation:', flight);
            createdFlightsCount.error++;
            continue;
          }
          
          // Default to SCHEDULED status if not provided
          const flightStatus = flight.status || 'SCHEDULED';
          
          if (!allowedStatuses.includes(flightStatus)) {
            console.warn(`Invalid status "${flightStatus}" in schedule data, using 'SCHEDULED' instead`);
          }
          
          if (flight.is_departure && !flight.departure_time) {
            console.warn('Missing departure_time for departure flight skipped:', flight);
            createdFlightsCount.error++;
            continue;
          }
          if (!flight.is_departure && !flight.arrival_time) {
            console.warn('Missing arrival_time for arrival flight skipped:', flight);
            createdFlightsCount.error++;
            continue;
          }

          try {
            await Flight.create({
              airline_id: flight.airline_id,
              flight_number: flight.flight_number,
              // Assign the correctly constructed date to the appropriate field
              departure_time: flight.is_departure ? finalDateTimeUTC : null,
              arrival_time: !flight.is_departure ? finalDateTimeUTC : null,
              destination_id_new: flight.destination_id, // Map destination_id to destination_id_new
              is_departure: flight.is_departure,
              status: allowedStatuses.includes(flightStatus) ? flightStatus : 'SCHEDULED',
              remarks: flight.remarks || null
            }, {
              returning: false
            });
            createdFlightsCount.success++;
          } catch (creationError) {
            console.error(`Error creating flight for date ${formattedDate}:`, creationError, flight);
            createdFlightsCount.error++;
            // Continue with other flights
          }
        }
      }
    }

    res.json({ 
      message: 'Monthly schedule generated successfully!',
      stats: {
        created: createdFlightsCount.success,
        errors: createdFlightsCount.error
      }
    });
  } catch (err) {
    console.error('Error generating monthly schedule:', err);
    // Check for model validation errors during bulk create simulation
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
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
      attributes: {
        exclude: ['destination_id'] // Exclude destination_id from the query
      },
      where: {
        [Op.or]: [
          { departure_time: { [Op.between]: [startOfDay, endOfDay] } },
          { arrival_time: { [Op.between]: [startOfDay, endOfDay] } },
        ],
      },
      include: [
        {
          model: Airline,
          as: 'Airline', // Re-added alias
        },
        {
          model: Destination,
          as: 'DestinationInfo' // Include Destination using the correct alias
        }
      ],
      order: [ // Optional: Add default ordering
        ['departure_time', 'ASC'],
        ['arrival_time', 'ASC']
      ]
    });

    // Send response only if res object is available (called via HTTP)
    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(flights);
    }
    // Always return flights for other callers (like CRON)
    return flights;

  } catch (error) {
    console.error('Greška pri dobavljanju dnevnih letova:', error);
    // Send error response only if res object is available
    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(500).json({ message: error.message });
    }
    // Return empty array in case of error for other callers (like CRON)
    return [];
  }
};

// Get Daily Departures (includes status implicitly via model)
exports.getDailyDepartures = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const flights = await Flight.findAll({
      attributes: {
        exclude: ['destination_id'] // Exclude destination_id from the query
      },
      where: {
        departure_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
        is_departure: true // Explicitly check for departures
      },
      include: [
        {
          model: Airline,
          as: 'Airline', // Re-added alias
        },
        {
          model: Destination,
          as: 'DestinationInfo' // Include Destination using the correct alias
        }
      ],
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
      attributes: ['id', 'flight_number', 'remarks'], // Select only needed fields, exclude destination_id
      include: [
        {
          model: Airline,
          as: 'Airline', // Re-added alias
          attributes: ['name'] // Only get airline name
        },
        {
          model: Destination,
          as: 'DestinationInfo',
          attributes: ['name', 'code'] // Get destination info
        }
      ],
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
