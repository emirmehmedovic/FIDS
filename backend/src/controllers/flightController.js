const { Op } = require('sequelize');
// Removed date-fns-tz import as it's causing issues
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const Destination = require('../models/Destination'); // Import Destination model
const flightModel = require('../models/flightModel'); // Assuming this is still used for deleteMonthlyFlights
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// Define allowed statuses consistent with the model
const allowedStatuses = ['SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED', 'BOARDING', 'DIVERTED', 'ESTIMATED', 'CHECK_IN_CLOSED', 'GATE_CLOSED'];

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
    // Handle both old format (array) and new format (object with weeklySchedule, targetMonth, targetYear)
    let weeklySchedule;
    let clientTimezoneOffset = 0; // Default to 0 if not provided
    let targetMonth, targetYear;
    
    if (Array.isArray(req.body)) {
      // Old format - just an array of weekly schedule
      weeklySchedule = req.body;
    } else if (req.body && req.body.weeklySchedule) {
      // New format - object with weeklySchedule and other parameters
      weeklySchedule = req.body.weeklySchedule;
      
      // Get the timezone offset if provided
      if (req.body.clientTimezoneOffset !== undefined) {
        clientTimezoneOffset = Number(req.body.clientTimezoneOffset);
        console.log(`Client timezone offset provided: ${clientTimezoneOffset} hours from UTC`);
      }
      
      // Get targetMonth and targetYear if provided
      if (req.body.targetMonth !== undefined) {
        targetMonth = Number(req.body.targetMonth);
        console.log(`Target month provided: ${targetMonth}`);
      }
      
      if (req.body.targetYear !== undefined) {
        targetYear = Number(req.body.targetYear);
        console.log(`Target year provided: ${targetYear}`);
      }
    } else {
      return res.status(400).json({ error: 'Invalid request format! Expected array or object with weeklySchedule' });
    }

    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({ error: 'Invalid weekly schedule format!' });
    }

    // Koristimo targetMonth i targetYear ako su poslani, inače koristimo tekući mjesec i godinu
    // Napomena: targetMonth je 0-based (0=januar, 1=februar, itd.), pa dodajemo 1 za human-readable format
    const currentMonth = targetMonth !== undefined ? targetMonth + 1 : new Date().getMonth() + 1;
    const currentYear = targetYear !== undefined ? targetYear : new Date().getFullYear();
    
    console.log(`Generating monthly schedule for ${currentMonth}/${currentYear}`);

    // Try to delete monthly flights for the target month, but don't fail if some can't be deleted
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

// Delete monthly schedule
exports.deleteMonthlySchedule = async (req, res) => {
  try {
    const { year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const deletedCount = await flightModel.deleteMonthlyFlights(yearNum, monthNum);

    res.json({
      message: `Successfully deleted ${deletedCount} flights for ${monthNum}/${yearNum}`,
      deletedCount
    });
  } catch (err) {
    console.error('Error deleting monthly schedule:', err);
    res.status(500).json({ error: 'Failed to delete monthly schedule' });
  }
};

// Preview CSV file without importing (for user verification)
exports.previewCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());

    // Check if this is the new format (Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije)
    const isNewFormat = header.includes('Datum') && header.includes('Tip leta') && header.includes('Vrijeme');

    // Required fields depend on format
    let requiredFields;
    if (isNewFormat) {
      requiredFields = ['Datum', 'Tip leta', 'IATA', 'Vrijeme', 'IATA kod aviokompanije'];
    } else {
      // flight_number is now optional - will be looked up from flight_numbers table
      requiredFields = ['airline_code', 'destination_code', 'is_departure'];
    }

    // Validate header
    const missingFields = requiredFields.filter(field => !header.includes(field));
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields in CSV: ${missingFields.join(', ')}`
      });
    }

    const results = {
      flights: [],
      errors: [],
      warnings: []
    };

    // Import FlightNumber model for lookup
    const FlightNumber = require('../models/FlightNumber');

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (simple parsing - doesn't handle quoted commas)
        const values = line.split(',').map(v => v.trim());
        const row = {};
        header.forEach((field, index) => {
          row[field] = values[index] || '';
        });

        let airlineCode, flightNumber, isDeparture, departureTime, arrivalTime, destinationCode, destinationName, airlineName;

        if (isNewFormat) {
          // New format: Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije
          airlineCode = row['IATA kod aviokompanije'];
          airlineName = row['Avio kompanija'];
          destinationCode = row['IATA'];
          destinationName = row['Destinacija'];
          isDeparture = row['Tip leta'] === 'Departure';

          // Combine date and time
          const dateTime = `${row['Datum']} ${row['Vrijeme']}`;
          if (isDeparture) {
            departureTime = new Date(dateTime);
            arrivalTime = null;
          } else {
            arrivalTime = new Date(dateTime);
            departureTime = null;
          }

          // Lookup flight number from flight_numbers table
          let flightNumberRecord = await FlightNumber.findOne({
            where: {
              airline_code: airlineCode.toUpperCase(),
              destination: destinationName,
              is_departure: isDeparture
            }
          });

          // Fallback: try without airline_code for backward compatibility with old records
          if (!flightNumberRecord) {
            flightNumberRecord = await FlightNumber.findOne({
              where: {
                airline_code: null,
                destination: destinationName,
                is_departure: isDeparture
              }
            });
          }

          if (!flightNumberRecord) {
            results.errors.push(`Line ${i + 1}: No flight number mapping found for ${airlineCode} - ${destinationName} (${isDeparture ? 'Departure' : 'Arrival'}). Please create mapping first.`);
            continue;
          }

          flightNumber = flightNumberRecord.number;
        } else {
          // Original format
          airlineCode = row['airline_code'];
          destinationCode = row['destination_code'];
          isDeparture = row['is_departure'] === 'true' || row['is_departure'] === '1' || row['is_departure'] === 'TRUE';

          // Check if flight_number is provided
          if (row['flight_number']) {
            flightNumber = row['flight_number'];
          } else {
            // Lookup from flight_numbers table using destination code
            const destination = await Destination.findOne({
              where: { code: destinationCode.toUpperCase() }
            });

            if (!destination) {
              results.errors.push(`Line ${i + 1}: Destination with code '${destinationCode}' not found`);
              continue;
            }

            destinationName = destination.name;

            let flightNumberRecord = await FlightNumber.findOne({
              where: {
                airline_code: airlineCode.toUpperCase(),
                destination: destination.name,
                is_departure: isDeparture
              }
            });

            // Fallback: try without airline_code for backward compatibility with old records
            if (!flightNumberRecord) {
              flightNumberRecord = await FlightNumber.findOne({
                where: {
                  airline_code: null,
                  destination: destination.name,
                  is_departure: isDeparture
                }
              });
            }

            if (!flightNumberRecord) {
              results.errors.push(`Line ${i + 1}: No flight number mapping found for ${airlineCode} - ${destination.name} (${isDeparture ? 'Departure' : 'Arrival'}). Please create mapping first.`);
              continue;
            }

            flightNumber = flightNumberRecord.number;
          }

          // Parse times
          if (isDeparture) {
            if (!row['departure_time']) {
              results.errors.push(`Line ${i + 1}: Departure time is required for departure flights`);
              continue;
            }
            departureTime = new Date(row['departure_time']);
            if (isNaN(departureTime.getTime())) {
              results.errors.push(`Line ${i + 1}: Invalid departure time format '${row['departure_time']}'. Use YYYY-MM-DD HH:MM`);
              continue;
            }
            arrivalTime = null;
          } else {
            if (!row['arrival_time']) {
              results.errors.push(`Line ${i + 1}: Arrival time is required for arrival flights`);
              continue;
            }
            arrivalTime = new Date(row['arrival_time']);
            if (isNaN(arrivalTime.getTime())) {
              results.errors.push(`Line ${i + 1}: Invalid arrival time format '${row['arrival_time']}'. Use YYYY-MM-DD HH:MM`);
              continue;
            }
            departureTime = null;
          }
        }

        // Find airline by IATA code
        const airline = await Airline.findOne({
          where: { iata_code: airlineCode.toUpperCase() }
        });
        if (!airline) {
          results.errors.push(`Line ${i + 1}: Airline with code '${airlineCode}' not found`);
          continue;
        }

        if (!airlineName) {
          airlineName = airline.name;
        }

        // Find destination by code
        const destination = await Destination.findOne({
          where: { code: destinationCode.toUpperCase() }
        });
        if (!destination) {
          results.errors.push(`Line ${i + 1}: Destination with code '${destinationCode}' not found`);
          continue;
        }

        if (!destinationName) {
          destinationName = destination.name;
        }

        // Validate status if provided
        const status = row.status || 'SCHEDULED';
        if (status && !allowedStatuses.includes(status.toUpperCase())) {
          results.warnings.push(`Line ${i + 1}: Invalid status '${status}', will use 'SCHEDULED' instead`);
        }

        // Add flight to preview (NOT to database)
        results.flights.push({
          flight_number: flightNumber,
          airline_code: airlineCode.toUpperCase(),
          airline_name: airlineName,
          destination_code: destinationCode.toUpperCase(),
          destination_name: destinationName,
          departure_time: departureTime ? departureTime.toISOString() : null,
          arrival_time: arrivalTime ? arrivalTime.toISOString() : null,
          is_departure: isDeparture,
          status: allowedStatuses.includes(status.toUpperCase()) ? status.toUpperCase() : 'SCHEDULED',
          remarks: row.remarks || ''
        });

      } catch (error) {
        results.errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    // Send preview response
    res.json({
      message: `CSV preview completed`,
      total: lines.length - 1,
      flights: results.flights,
      errors: results.errors,
      warnings: results.warnings
    });

  } catch (err) {
    console.error('Error previewing CSV:', err);
    res.status(500).json({ error: 'Failed to preview CSV file: ' + err.message });
  }
};

// Import flights from CSV
exports.importFlightsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());

    // Check if this is the new format (Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije)
    const isNewFormat = header.includes('Datum') && header.includes('Tip leta') && header.includes('Vrijeme');

    // Required fields depend on format
    let requiredFields;
    if (isNewFormat) {
      requiredFields = ['Datum', 'Tip leta', 'IATA', 'Vrijeme', 'IATA kod aviokompanije'];
    } else {
      // flight_number is now optional - will be looked up from flight_numbers table
      requiredFields = ['airline_code', 'destination_code', 'is_departure'];
    }

    // Validate header
    const missingFields = requiredFields.filter(field => !header.includes(field));
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields in CSV: ${missingFields.join(', ')}`
      });
    }

    const results = {
      success: 0,
      errors: [],
      warnings: []
    };

    // Import FlightNumber model for lookup
    const FlightNumber = require('../models/FlightNumber');

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (simple parsing - doesn't handle quoted commas)
        const values = line.split(',').map(v => v.trim());
        const row = {};
        header.forEach((field, index) => {
          row[field] = values[index] || '';
        });

        let airlineCode, flightNumber, isDeparture, departureTime, arrivalTime, destinationCode;

        if (isNewFormat) {
          // New format: Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije
          airlineCode = row['IATA kod aviokompanije'];
          destinationCode = row['IATA'];
          isDeparture = row['Tip leta'] === 'Departure';

          // Combine date and time
          const dateTime = `${row['Datum']} ${row['Vrijeme']}`;
          if (isDeparture) {
            departureTime = new Date(dateTime);
            arrivalTime = null;
          } else {
            arrivalTime = new Date(dateTime);
            departureTime = null;
          }

          // Lookup flight number from flight_numbers table
          const destinationName = row['Destinacija'];
          let flightNumberRecord = await FlightNumber.findOne({
            where: {
              airline_code: airlineCode.toUpperCase(),
              destination: destinationName,
              is_departure: isDeparture
            }
          });

          // Fallback: try without airline_code for backward compatibility with old records
          if (!flightNumberRecord) {
            flightNumberRecord = await FlightNumber.findOne({
              where: {
                airline_code: null,
                destination: destinationName,
                is_departure: isDeparture
              }
            });
          }

          if (!flightNumberRecord) {
            results.errors.push(`Line ${i + 1}: No flight number mapping found for ${airlineCode} - ${destinationName} (${isDeparture ? 'Departure' : 'Arrival'}). Please create mapping first.`);
            continue;
          }

          flightNumber = flightNumberRecord.number;
        } else {
          // Original format
          airlineCode = row['airline_code'];
          destinationCode = row['destination_code'];
          isDeparture = row['is_departure'] === 'true' || row['is_departure'] === '1' || row['is_departure'] === 'TRUE';

          // Check if flight_number is provided
          if (row['flight_number']) {
            flightNumber = row['flight_number'];
          } else {
            // Lookup from flight_numbers table using destination code
            const destination = await Destination.findOne({
              where: { code: destinationCode.toUpperCase() }
            });

            if (!destination) {
              results.errors.push(`Line ${i + 1}: Destination with code '${destinationCode}' not found`);
              continue;
            }

            let flightNumberRecord = await FlightNumber.findOne({
              where: {
                airline_code: airlineCode.toUpperCase(),
                destination: destination.name,
                is_departure: isDeparture
              }
            });

            // Fallback: try without airline_code for backward compatibility with old records
            if (!flightNumberRecord) {
              flightNumberRecord = await FlightNumber.findOne({
                where: {
                  airline_code: null,
                  destination: destination.name,
                  is_departure: isDeparture
                }
              });
            }

            if (!flightNumberRecord) {
              results.errors.push(`Line ${i + 1}: No flight number mapping found for ${airlineCode} - ${destination.name} (${isDeparture ? 'Departure' : 'Arrival'}). Please create mapping first.`);
              continue;
            }

            flightNumber = flightNumberRecord.number;
          }

          // Parse times
          if (isDeparture) {
            if (!row['departure_time']) {
              results.errors.push(`Line ${i + 1}: Departure time is required for departure flights`);
              continue;
            }
            departureTime = new Date(row['departure_time']);
            if (isNaN(departureTime.getTime())) {
              results.errors.push(`Line ${i + 1}: Invalid departure time format '${row['departure_time']}'. Use YYYY-MM-DD HH:MM`);
              continue;
            }
            arrivalTime = null;
          } else {
            if (!row['arrival_time']) {
              results.errors.push(`Line ${i + 1}: Arrival time is required for arrival flights`);
              continue;
            }
            arrivalTime = new Date(row['arrival_time']);
            if (isNaN(arrivalTime.getTime())) {
              results.errors.push(`Line ${i + 1}: Invalid arrival time format '${row['arrival_time']}'. Use YYYY-MM-DD HH:MM`);
              continue;
            }
            departureTime = null;
          }
        }

        // Find airline by IATA code
        const airline = await Airline.findOne({
          where: { iata_code: airlineCode.toUpperCase() }
        });
        if (!airline) {
          results.errors.push(`Line ${i + 1}: Airline with code '${airlineCode}' not found`);
          continue;
        }

        // Find destination by code
        const destination = await Destination.findOne({
          where: { code: destinationCode.toUpperCase() }
        });
        if (!destination) {
          results.errors.push(`Line ${i + 1}: Destination with code '${destinationCode}' not found`);
          continue;
        }

        // Validate status if provided
        const status = row.status || 'SCHEDULED';
        if (status && !allowedStatuses.includes(status.toUpperCase())) {
          results.warnings.push(`Line ${i + 1}: Invalid status '${status}', using 'SCHEDULED' instead`);
        }

        // Create flight
        await Flight.create({
          airline_id: airline.id,
          flight_number: flightNumber,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          destination_id_new: destination.id,
          is_departure: isDeparture,
          status: allowedStatuses.includes(status.toUpperCase()) ? status.toUpperCase() : 'SCHEDULED',
          remarks: row.remarks || ''
        });

        results.success++;
      } catch (error) {
        results.errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    // Send response
    res.json({
      message: `CSV import completed`,
      results: {
        total: lines.length - 1,
        success: results.success,
        failed: results.errors.length,
        warnings: results.warnings.length
      },
      errors: results.errors,
      warnings: results.warnings
    });

  } catch (err) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ error: 'Failed to import CSV file: ' + err.message });
  }
};
