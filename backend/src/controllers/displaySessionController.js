const DisplaySession = require('../models/displaySessionModel');
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const { Op } = require('sequelize'); // Import Op
const { sequelize } = require('../models/displaySessionModel'); // Import sequelize instance if needed for transactions

const openSession = async (req, res) => {
  try {
    // Destructure fields for standard and custom sessions
    const {
      flightId, pageId, sessionType, isPriority, // Standard fields
      custom_airline_id, custom_flight_number, // Custom fields (required for custom type)
      custom_destination1, custom_destination2, // Custom fields (required/optional)
      notification_text // Added for notice sessions
    } = req.body;

    // Determine if it's intended as a custom session based on provided fields
    const isAttemptingCustomSession = custom_flight_number || custom_airline_id || custom_destination1;

    // Validation
    if (!flightId && !isAttemptingCustomSession) {
      return res.status(400).json({ message: 'Morate proslijediti ili ID leta ili podatke za sesiju po broju leta.' });
    }
    if (flightId && isAttemptingCustomSession) {
      return res.status(400).json({ message: 'Ne možete proslijediti i ID leta i podatke za sesiju po broju leta istovremeno.' });
    }

    // Validate required fields for the custom session type
    if (isAttemptingCustomSession) {
      if (!custom_airline_id || !custom_flight_number || !custom_destination1 || !sessionType || !pageId) {
         return res.status(400).json({ message: 'Za sesiju po broju leta, obavezni su: Ekran, Tip sesije, Aviokompanija, Broj leta i Destinacija 1.' });
      }
    }

    // Validate notification text for notice type
    if (sessionType === 'notice' && !notification_text) {
        return res.status(400).json({ message: 'Tekst obavještenja je obavezan za sesiju obavještenja.' });
    }

    // Check if page type matches session type (allow 'notice' on any page type)
    if (sessionType !== 'notice') {
        const isBoardingPage = pageId.startsWith('U');
        if (isBoardingPage && sessionType !== 'boarding') {
          return res.status(400).json({ message: 'Stranica je rezervirana za boarding sesije.' });
        }
         // Add check for check-in pages if needed
         const isCheckinPage = pageId.startsWith('C');
         if (isCheckinPage && sessionType !== 'check-in') {
             return res.status(400).json({ message: 'Stranica je rezervirana za check-in sesije.' });
         }
    }


    // Zatvori sve aktivne sesije za ovaj pageId
    await DisplaySession.update(
      { is_active: false, end_time: new Date() },
      { where: { pageId, is_active: true } }
    );

    // Kreiraj novu sesiju
    const sessionData = {
      pageId,
      sessionType, // Use the provided sessionType
      isPriority: isPriority || false,
      is_active: true,
      start_time: new Date(),
      flightId: flightId || null, // Set flightId to null if custom
      // Add custom fields if provided
      custom_airline_id: isAttemptingCustomSession ? custom_airline_id : null,
      custom_flight_number: isAttemptingCustomSession ? custom_flight_number : null,
      custom_destination1: isAttemptingCustomSession ? custom_destination1 : null,
      custom_destination2: isAttemptingCustomSession ? custom_destination2 : null,
      notification_text: sessionType === 'notice' ? notification_text : null // Add notification text only for notice type
    };

    const session = await DisplaySession.create(sessionData);

    console.log("Sesija kreirana:", session.toJSON()); // Debug
    res.status(201).json(session);

  } catch (error) {
    console.error('Greška pri otvaranju sesije:', error);
    res.status(400).json({ message: error.message });
  }
};

const closeSession = async (req, res) => {
  try {
    const session = await DisplaySession.findByPk(req.params.id);
    if (!session) throw new Error('Session not found');

    session.is_active = false;
    session.end_time = new Date();
    await session.save();

    res.json(session);
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(400).json({ message: error.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { page } = req.query;

    const whereClause = {
      is_active: true,
      ...(page && { pageId: page })
    };

    const sessions = await DisplaySession.findAll({
      where: whereClause,
      include: [
        {
          model: Flight,
          as: 'Flight', // Alias for the standard flight relation
          required: false, // Make it optional (LEFT JOIN)
          include: [{
            model: Airline,
            as: 'Airline', // Alias for the airline within the standard flight
             attributes: { exclude: ['createdAt', 'updatedAt'] } // Exclude timestamps if not needed
          }]
        },
         // Include Airline directly for custom sessions based on custom_airline_id
         {
           model: Airline,
           as: 'CustomAirline', // Use the same alias as in the controller include
           required: false, // Make it optional
           attributes: { exclude: ['createdAt', 'updatedAt'] } // Exclude timestamps
         }
      ],
      attributes: { exclude: ['custom_airline_id'] } // Exclude raw custom FK from final session object if CustomAirline is included
    });

     // Process results to fetch actual flight details for custom sessions
     const todayStart = new Date();
     todayStart.setHours(0, 0, 0, 0);
     const todayEnd = new Date();
     todayEnd.setHours(23, 59, 59, 999);

     const results = await Promise.all(sessions.map(async (session) => {
        const plainSession = session.toJSON(); // Convert to plain object

        // If it's a custom session (has custom_flight_number and CustomAirline)
        if (plainSession.custom_flight_number && !plainSession.Flight && plainSession.CustomAirline) {
             try {
                // Find the actual flight for today based on the custom flight number
                const actualFlight = await Flight.findOne({
                    where: {
                        flight_number: plainSession.custom_flight_number,
                        [Op.or]: [
                            { departure_time: { [Op.between]: [todayStart, todayEnd] } },
                            { arrival_time: { [Op.between]: [todayStart, todayEnd] } }
                        ]
                    }
                });

                // Structure the custom data similarly to Flight data
                plainSession.CustomFlightData = {
                    Airline: plainSession.CustomAirline, // Use the included CustomAirline data
                    flight_number: plainSession.custom_flight_number,
                    // Get time and type from the actual flight found for today
                    departure_time: actualFlight ? actualFlight.departure_time : null,
                    arrival_time: actualFlight ? actualFlight.arrival_time : null,
                    is_departure: actualFlight ? actualFlight.is_departure : null, // Get type from actual flight
                    // Use custom destinations
                    destination: plainSession.custom_destination2
                                   ? `${plainSession.custom_destination1} / ${plainSession.custom_destination2}`
                                   : plainSession.custom_destination1,
                    // Add remarks if needed, maybe from actualFlight?
                    remarks: actualFlight ? actualFlight.remarks : null
                };

                // If no actual flight found for today, indicate it (optional)
                if (!actualFlight) {
                    console.warn(`No flight found for today with number: ${plainSession.custom_flight_number}`);
                    // You might want to adjust CustomFlightData further, e.g., set times to null explicitly
                    plainSession.CustomFlightData.departure_time = null;
                    plainSession.CustomFlightData.arrival_time = null;
                    plainSession.CustomFlightData.is_departure = null; // Indicate unknown type
                }

             } catch (flightError) {
                 console.error("Error fetching actual flight for custom session:", flightError);
                 plainSession.CustomFlightData = { // Provide a fallback structure
                    Airline: plainSession.CustomAirline,
                    flight_number: plainSession.custom_flight_number,
                    destination: plainSession.custom_destination1, // At least show destination 1
                    // Indicate missing data
                    departure_time: null,
                    arrival_time: null,
                    is_departure: null
                 };
             }
             // Clean up raw custom fields and the extra CustomAirline object
             // delete plainSession.custom_airline_id; // Keep for potential debugging? Or remove.
             delete plainSession.custom_flight_number;
             delete plainSession.custom_destination1;
             delete plainSession.custom_destination2;
             delete plainSession.CustomAirline; // Remove the separate CustomAirline object

        } else if (plainSession.CustomAirline) {
             // Clean up CustomAirline if Flight data is present (shouldn't happen often)
             delete plainSession.CustomAirline;
        }
        // Remove unnecessary custom fields even if Flight is present (redundant but safe)
        // delete plainSession.custom_airline_id;
        delete plainSession.custom_flight_number;
        delete plainSession.custom_destination1;
        delete plainSession.custom_destination2;


        // Ensure notification_text is included (it should be by default unless excluded)
        // No specific action needed here if it's part of the model attributes fetched

        return plainSession;
     }));


    console.log("Aktivne sesije (obrađene):", results.length); // Debug count
    res.json(results); // Send the processed results
  } catch (error) {
    console.error('Greška pri dobavljanju aktivnih sesija:', error);
    res.status(500).json({ error: error.message });
  }
};

// New function to update notification text
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params; // Session ID
        const { notification_text } = req.body; // Expecting { "notification_text": "New message" } or { "notification_text": "" } to clear

        const session = await DisplaySession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Sesija nije pronađena.' });
        }

        if (!session.is_active) {
             return res.status(400).json({ message: 'Ne možete dodati obavještenje neaktivnoj sesiji.' });
        }

        session.notification_text = notification_text || null; // Set to null if empty string is sent
        await session.save();

        console.log(`Notification updated for session ${id}:`, notification_text); // Debug
        res.json({ message: 'Obavještenje uspješno ažurirano.', session });

    } catch (error) {
        console.error('Greška pri ažuriranju obavještenja:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  openSession,
  closeSession,
  getActiveSessions,
  updateNotification // Export the new function
};
