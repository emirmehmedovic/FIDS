const { Op } = require('sequelize');
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const flightModel = require('../models/flightModel');

// Dohvati sve letove
exports.getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      include: [{
        model: Airline,
        as: 'Airline',
      }],
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
        as: 'Airline',
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
    const { airline_id, flight_number, departure_time, arrival_time, destination, is_departure } = req.body;

    // Validacija obavezna polja
    if (!airline_id || !flight_number || !destination) {
      return res.status(400).json({ error: 'Aviokompanija, broj leta i destinacija su obavezni!' });
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
    });

    res.status(201).json(createdFlight);
  } catch (err) {
    console.error('Error creating flight:', err);
    res.status(400).json({ error: err.message });
  }
};

// Ažuriraj postojeći let
exports.updateFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { airline_id, flight_number, departure_time, arrival_time, destination, is_departure } = req.body;

    // Validacija obavezna polja
    if (!airline_id || !flight_number || !destination) {
      return res.status(400).json({ error: 'Aviokompanija, broj leta i destinacija su obavezni!' });
    }

    // Pronađi let
    const flight = await Flight.findByPk(id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Ažuriraj let
    flight.airline_id = airline_id;
    flight.flight_number = flight_number;
    flight.departure_time = is_departure ? departure_time : null;
    flight.arrival_time = !is_departure ? arrival_time : null;
    flight.destination = destination;
    flight.is_departure = is_departure;

    await flight.save();

    res.json(flight);
  } catch (err) {
    console.error('Error updating flight:', err);
    res.status(400).json({ error: err.message });
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


// controllers/flightController.js (ažurirano)
exports.generateMonthlySchedule = async (req, res) => {
  try {
    const weeklySchedule = req.body;

    // Provjerite je li sedmični raspored ispravan
    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({ error: 'Invalid weekly schedule format!' });
    }

    const currentMonth = new Date().getMonth() + 1; // Trenutni mjesec
    const currentYear = new Date().getFullYear();   // Trenutna godina

    // Obriši sve letove za trenutni mjesec
    await flightModel.deleteMonthlyFlights(currentYear, currentMonth);

    // Generiranje datuma za cijeli mjesec
    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1)); // Prvi dan u mjesecu (UTC)
    const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0)); // Zadnji dan u mjesecu (UTC)
    const datesInMonth = [];
    let currentDate = new Date(firstDayOfMonth);

    // Petlja koja generira sve dane u mjesecu
    while (currentDate <= lastDayOfMonth) {
      datesInMonth.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Koristimo UTC datum
    }

    // Mapa dana u tjednu (0 = nedjelja, 1 = ponedjeljak, itd.)
    const dayOfWeekMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };

    // Generiranje letova na temelju sedmičnog rasporeda
    for (const day of weeklySchedule) {
      const dayOfWeek = day.day_of_week.toLowerCase();
      const dayNumber = dayOfWeekMap[dayOfWeek]; // Pretvori dan u broj

      if (dayNumber === undefined) {
        console.error(`Invalid day of week: ${day.day_of_week}`);
        continue; // Preskoči neispravne dane
      }

      // Filtriraj datume za određeni dan u tjednu (koristimo getUTCDay)
      const filteredDates = datesInMonth.filter((d) => d.getUTCDay() === dayNumber);

      for (const date of filteredDates) {
        for (const flight of day.flights) {
          const formattedDate = date.toISOString().split('T')[0];
          const departureTime = flight.is_departure ? `${formattedDate}T${flight.departure_time}:00Z` : null; // Dodajemo 'Z' za UTC
          const arrivalTime = !flight.is_departure ? `${formattedDate}T${flight.arrival_time}:00Z` : null; // Dodajemo 'Z' za UTC

          // Validacija podataka prije dodavanja
          if (!flight.airline_id || !flight.flight_number || !flight.destination) {
            console.error('Invalid flight data:', flight);
            continue; // Preskoči neispravne letove
          }

          // Kreiraj let
          await Flight.create({
            airline_id: flight.airline_id,
            flight_number: flight.flight_number,
            departure_time: departureTime,
            arrival_time: arrivalTime,
            destination: flight.destination,
            is_departure: flight.is_departure,
          });
        }
      }
    }

    res.json({ message: 'Monthly schedule generated successfully!' });
  } catch (err) {
    console.error('Error generating monthly schedule:', err);
    res.status(500).json({ error: err.message });
  }
};

// flightController.js (ažurirano)
exports.getDailyFlights = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Početak dana
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Kraj dana

    const flights = await Flight.findAll({
      where: {
        [Op.or]: [
          { departure_time: { [Op.between]: [startOfDay, endOfDay] } },
          { arrival_time: { [Op.between]: [startOfDay, endOfDay] } },
        ],
      },
      include: [{
        model: Airline,
        as: 'Airline',
      }],
    });

    res.status(200).json(flights);
  } catch (error) {
    console.error('Greška pri dobavljanju dnevnih letova:', error);
    res.status(500).json({ message: error.message });
  }
};
// Dohvati dnevne odlaske
exports.getDailyDepartures = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Početak dana
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Kraj dana

    const flights = await Flight.findAll({
      where: {
        departure_time: {
          [Op.between]: [startOfDay, endOfDay], // Filtriranje po danu
        },
      },
      include: [{
        model: Airline,
        as: 'Airline',
      }],
    });

    res.json(flights);
  } catch (error) {
    console.error('Greška pri dobavljanju dnevnih odlazaka:', error);
    res.status(500).json({ message: error.message });
  }
};

// Ažuriraj napomene za let
exports.updateFlightRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const flight = await Flight.findByPk(id);
    if (!flight) {
      return res.status(404).json({ error: 'Let nije pronađen.' });
    }

    flight.remarks = remarks;
    await flight.save();

    res.json({ message: 'Napomene uspješno ažurirane.', flight });
  } catch (error) {
    console.error('Greška pri ažuriranju napomena:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eksportuj sve napomene

// Dodajte u flightController.js
exports.exportRemarks = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      where: {
        remarks: {
          [Op.ne]: null,
        },
      },
    });
    res.json(flights);
  } catch (err) {
    console.error('Error exporting remarks:', err);
    res.status(500).json({ error: err.message });
  }
};