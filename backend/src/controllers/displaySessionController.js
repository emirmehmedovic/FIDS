const DisplaySession = require('../models/displaySessionModel');
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');
const StaticPage = require('../models/StaticPage');
const Destination = require('../models/Destination'); // Make sure Destination is imported
const { Op } = require('sequelize'); // Import Op once here
// Import sequelize instance directly from config if needed for transactions
const sequelize = require('../config/db'); 
// The duplicate Op import was here and is now removed.

// --- Helper function to format time (HH:MM) ---
const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Error formatting time:", dateString, e);
    return '';
  }
};

// --- Helper function to replace placeholders ---
const replacePlaceholders = (text, flightData) => {
    if (!text || !flightData) return text;

    let processedText = text;

    // Basic flight data replacements
    processedText = processedText.replace(/{flight_number}/g, flightData.flight_number || '');
    // Use destination_id_new if available in flightData, otherwise use constructed destination string
    let destinationText = '';
    if (flightData.DestinationInfo) { // Use DestinationInfo model if included
        destinationText = flightData.DestinationInfo.name || '';
    } else if (flightData.destination) { // Fallback to string if provided
        destinationText = flightData.destination;
    }
    processedText = processedText.replace(/{destination}/g, destinationText);

    // Determine the relevant time (departure or arrival) and format it
    const relevantTime = flightData.is_departure ? flightData.departure_time : flightData.arrival_time;
    const formattedTime = formatTime(relevantTime);
    processedText = processedText.replace(/{time}/g, formattedTime);

    // Add more replacements if needed, e.g., airline name
    if (flightData.Airline) {
        processedText = processedText.replace(/{airline_name}/g, flightData.Airline.name || '');
    }
    
    // Add status replacement
    processedText = processedText.replace(/{status}/g, flightData.status || ''); // Use status from flight data

    // Remarks replacement
    processedText = processedText.replace(/{remarks}/g, flightData.remarks || '');

    // Other placeholders remain untouched for frontend/manual handling
    return processedText;
};


const openSession = async (req, res) => {
  try {
    // Destructure fields for standard and custom sessions
    const {
      flightId, flight1Id, flight2Id, pageId, sessionType, isPriority, // Standard fields
      // Use camelCase consistently based on model update
      customAirlineId, customFlightNumber, 
      customDestination1, customDestination2, 
      notificationText 
    } = req.body;

    // Determine if it's intended as a custom session based on provided fields
    const isAttemptingCustomSession = !!(customAirlineId || customFlightNumber || customDestination1);
    // Determine if it's a dual flight session (has both flight1Id and flight2Id)
    const isDualFlightSession = !!(flight1Id && flight2Id);

    // Validation
    if (!flightId && !isAttemptingCustomSession && !isDualFlightSession) {
      return res.status(400).json({ message: 'Morate proslijediti ID leta, podatke za sesiju po broju leta, ili dva leta za dvojni check-in.' });
    }
    if ((flightId && isAttemptingCustomSession) || (flightId && isDualFlightSession) || (isAttemptingCustomSession && isDualFlightSession)) {
      return res.status(400).json({ message: 'Ne možete istovremeno koristiti više tipova sesija. Odaberite standard, custom ili dual.' });
    }
    if (!pageId || !sessionType) {
         return res.status(400).json({ message: 'Polja Ekran (pageId) i Tip sesije (sessionType) su obavezna.' });
    }

    // Validate required fields for the custom session type
    if (isAttemptingCustomSession) {
      if (!customAirlineId || !customFlightNumber || !customDestination1) {
         return res.status(400).json({ message: 'Za sesiju po broju leta, obavezni su: Aviokompanija (customAirlineId), Broj leta (customFlightNumber) i Destinacija 1 (customDestination1).' });
      }
    }

    // Validate dual flight sessions
    if (isDualFlightSession) {
      if (flight1Id === flight2Id) {
        return res.status(400).json({ message: 'Za dvojni check-in, morate odabrati dva različita leta.' });
      }
    }

    // Validate notification text for notice type
    if (sessionType === 'notice' && !notificationText) {
        return res.status(400).json({ message: 'Tekst obavještenja (notificationText) je obavezan za sesiju obavještenja.' });
    }

    // Check if page type matches session type (allow 'notice' on any page type)
    // Fetch StaticPage to verify type (more robust)
    const staticPage = await StaticPage.findOne({ where: { pageId } });
    if (!staticPage) {
        return res.status(404).json({ message: `Stranica sa ID ${pageId} nije pronađena.` });
    }

    if (sessionType !== 'notice') {
        if (staticPage.pageType === 'boarding' && sessionType !== 'boarding') {
            return res.status(400).json({ message: `Stranica ${pageId} je tipa 'boarding' i prihvata samo boarding sesije.` });
        }
        if (staticPage.pageType === 'check-in' && sessionType !== 'check-in') {
            return res.status(400).json({ message: `Stranica ${pageId} je tipa 'check-in' i prihvata samo check-in sesije.` });
        }
        // Add check for 'general' pages if needed
    }

    // Zatvori sve aktivne sesije za ovaj pageId
    await DisplaySession.update(
      { isActive: false, endTime: new Date() }, // Use camelCase model fields
      { where: { pageId, isActive: true } } // Use camelCase model fields
    );

    // Kreiraj novu sesiju - use camelCase fields from model
    const sessionData = {
      pageId,
      sessionType, 
      isPriority: isPriority || false,
      isActive: true,
      startTime: new Date(),
      flightId: flightId || null,
      flight1Id: isDualFlightSession ? flight1Id : null,
      flight2Id: isDualFlightSession ? flight2Id : null,
      customAirlineId: isAttemptingCustomSession ? customAirlineId : null,
      customFlightNumber: isAttemptingCustomSession ? customFlightNumber : null,
      customDestination1: isAttemptingCustomSession ? customDestination1 : null,
      customDestination2: isAttemptingCustomSession ? customDestination2 : null,
      notificationText: sessionType === 'notice' ? notificationText : null // Store raw text initially
    };

    // --- Placeholder Replacement Logic ---
    let finalNotificationText = sessionData.notificationText; // Use camelCase
    if (sessionType === 'notice' && finalNotificationText) {
      let flightDataForPlaceholder = null;
      try { // Wrap DB lookups in try-catch
          if (flightId) {
            // Fetch standard flight details including Destination
            flightDataForPlaceholder = await Flight.findByPk(flightId, { 
                include: [
                    { model: Airline, as: 'Airline' },
                    { model: Destination, as: 'DestinationInfo' } 
                ]
            });
          } else if (isAttemptingCustomSession) {
            // Construct flight data object for custom session
            const customAirline = await Airline.findByPk(customAirlineId);
            flightDataForPlaceholder = {
              flight_number: customFlightNumber,
              // Destination will be set below based on actual flight or custom data
              destination: '', // Initialize destination
              departure_time: null, // Placeholder
              arrival_time: null,   // Placeholder
              is_departure: null, // Placeholder
              status: null, // Placeholder
              remarks: null, // Placeholder
              Airline: customAirline ? customAirline.toJSON() : null,
              DestinationInfo: null // Initialize DestinationInfo
            };
            // Optionally try to fetch actual flight for today to get more details
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
            const actualFlight = await Flight.findOne({
                where: {
                    flight_number: customFlightNumber,
                    airline_id: customAirlineId, // Match airline too
                    [Op.or]: [
                        { departure_time: { [Op.between]: [todayStart, todayEnd] } },
                        { arrival_time: { [Op.between]: [todayStart, todayEnd] } }
                    ]
                },
                include: [{ model: Destination, as: 'DestinationInfo' }] // Include destination
            });
            if (actualFlight) {
                flightDataForPlaceholder.departure_time = actualFlight.departure_time;
                flightDataForPlaceholder.arrival_time = actualFlight.arrival_time;
                flightDataForPlaceholder.is_departure = actualFlight.is_departure;
                flightDataForPlaceholder.status = actualFlight.status;
                flightDataForPlaceholder.remarks = actualFlight.remarks;
                // Use DestinationInfo from the actual flight if found
                flightDataForPlaceholder.DestinationInfo = actualFlight.DestinationInfo; 
                flightDataForPlaceholder.destination = actualFlight.DestinationInfo?.name || ''; // Set destination from actual flight
            } else {
                 // If no actual flight found, use custom destinations
                 flightDataForPlaceholder.destination = customDestination2 ? `${customDestination1} / ${customDestination2}` : customDestination1;
            }
          } else if (isDualFlightSession) {
            // For dual flight sessions, use the first flight for notification placeholders
            flightDataForPlaceholder = await Flight.findByPk(flight1Id, { 
                include: [
                    { model: Airline, as: 'Airline' },
                    { model: Destination, as: 'DestinationInfo' }
                ]
            });
          }

      } catch (dbError) {
          console.error('Error fetching flight data for placeholder replacement:', dbError);
          // Decide how to proceed: maybe log and continue without replacement? 
          // Or return an error? For now, log and continue without replacement.
          flightDataForPlaceholder = null; // Ensure it's null if lookup failed
      }

      if (flightDataForPlaceholder) {
        try { // Wrap replacement in try-catch
          finalNotificationText = replacePlaceholders(finalNotificationText, flightDataForPlaceholder.toJSON ? flightDataForPlaceholder.toJSON() : flightDataForPlaceholder);
        } catch (replaceError) {
           console.error('Error during placeholder replacement:', replaceError);
           // Keep original text if replacement fails
           finalNotificationText = sessionData.notificationText; 
        }
      }
    }
    // Update sessionData with processed text
    sessionData.notificationText = finalNotificationText; // Use camelCase
    // --- End Placeholder Replacement ---

    // console.log('[DEBUG] Attempting to create session with data:', JSON.stringify(sessionData, null, 2)); // Add detailed logging

    const session = await DisplaySession.create(sessionData);

    // Fetch the created session with includes for response consistency
    const createdSessionWithIncludes = await DisplaySession.findByPk(session.id, {
         include: [
             { 
                model: Flight, 
                as: 'flight', // Use alias 'flight'
                required: false, // Make Flight optional
                attributes: { 
                  exclude: ['destination_id'] // Exclude destination_id from the query
                },
                include: [
                    { model: Airline, as: 'Airline' },
                    { model: Destination, as: 'DestinationInfo' } // Include DestinationInfo here too
                ] 
             }, 
             { model: Airline, as: 'CustomAirline', required: false } // Make CustomAirline optional
         ]
    });

    // console.log("Sesija kreirana:", createdSessionWithIncludes.toJSON());

    // Use camelCase consistently
    res.status(201).json(createdSessionWithIncludes); 

  } catch (error) {
    console.error('Greška pri otvaranju sesije:', error);
    // Handle validation errors specifically
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
        const messages = error.errors ? error.errors.map(e => e.message) : [error.message];
        return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error during session opening.' });
  }
};

const closeSession = async (req, res) => {
  try {
    const session = await DisplaySession.findByPk(req.params.id);
    if (!session) {
       return res.status(404).json({ message: 'Session not found' });
    }

    session.isActive = false; // Use camelCase
    session.endTime = new Date(); // Use camelCase
    await session.save();

    res.json(session); // Return updated session
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(400).json({ message: error.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { page } = req.query;

    const whereClause = {
      isActive: true, // Use camelCase
      ...(page && { pageId: page })
    };

    const sessions = await DisplaySession.findAll({
      where: whereClause,
      include: [
        {
          model: Flight,
          as: 'flight', // Use alias 'flight'
          required: false,
          attributes: { 
            exclude: ['destination_id'] // Exclude destination_id from the query
          },
          include: [
              { model: Airline, as: 'Airline', attributes: { exclude: ['createdAt', 'updatedAt'] } },
              { model: Destination, as: 'DestinationInfo', attributes: ['name', 'code'] } // Include Destination using the correct alias
          ]
        },
        {
           model: Airline,
           as: 'CustomAirline', 
           required: false, 
           attributes: { exclude: ['createdAt', 'updatedAt'] } 
         }
      ],
      // Exclude raw custom FKs if CustomAirline is included and provides the data
      // attributes: { exclude: ['customAirlineId'] } 
    });

     // Process results to potentially fetch actual flight details for custom sessions
     const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
     const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

     const results = await Promise.all(sessions.map(async (session) => {
        const plainSession = session.toJSON(); // Convert to plain object

        // Check if it's a dual flight session
        if (plainSession.flight1Id && plainSession.flight2Id) {
          try {
            // Fetch both flights with their details
            const [flight1, flight2] = await Promise.all([
              Flight.findByPk(plainSession.flight1Id, {
                include: [
                  { model: Airline, as: 'Airline' },
                  { model: Destination, as: 'DestinationInfo' }
                ]
              }),
              Flight.findByPk(plainSession.flight2Id, {
                include: [
                  { model: Airline, as: 'Airline' },
                  { model: Destination, as: 'DestinationInfo' }
                ]
              })
            ]);

            if (flight1 && flight2) {
              // Create CustomFlightData for dual flight session
              const flight1Data = flight1.toJSON();
              const flight2Data = flight2.toJSON();

              // Create combined destination string
              const destination1 = flight1Data.DestinationInfo ? 
                  `${flight1Data.DestinationInfo.name}` : 
                  'N/A';
              const destination2 = flight2Data.DestinationInfo ? 
                  `${flight2Data.DestinationInfo.name}` : 
                  'N/A';
                  
              // Use flight1's airline for display
              plainSession.CustomFlightData = {
                Airline: flight1Data.Airline,
                flight_number: `${flight1Data.flight_number}/${flight2Data.flight_number}`,
                destination: `${destination1} / ${destination2}`,
                departure_time: flight1Data.departure_time,
                arrival_time: flight1Data.arrival_time,
                // Force is_departure to true for dual flights to ensure POLAZAK/DEPARTURE label
                is_departure: true,
                status: flight1Data.status,
                remarks: flight1Data.remarks,
                DestinationInfo: {
                  name: `${destination1} / ${destination2}`,
                  code: `${flight1Data.DestinationInfo?.code || ''}/${flight2Data.DestinationInfo?.code || ''}`
                }
              };
            }
          } catch (error) {
            console.error("Error processing dual flight session:", error);
          }

          // Clean up flight IDs from top level
          delete plainSession.flight1Id;
          delete plainSession.flight2Id;
        }
        // If it's a custom session (has customFlightNumber and CustomAirline, but no Flight)
        else if (plainSession.customFlightNumber && !plainSession.flight && plainSession.CustomAirline) { // Check !plainSession.flight
             try {
                // Find the actual flight for today based on the custom flight number AND airline
                const actualFlight = await Flight.findOne({
                    where: {
                        flight_number: plainSession.customFlightNumber,
                        airline_id: plainSession.CustomAirline.id, // Use ID from included CustomAirline
                        [Op.or]: [
                            { departure_time: { [Op.between]: [todayStart, todayEnd] } },
                            { arrival_time: { [Op.between]: [todayStart, todayEnd] } }
                        ]
                    },
                    include: [{ model: Destination, as: 'DestinationInfo' }] // Include destination
                });

                // Structure the custom data similarly to Flight data
                plainSession.CustomFlightData = {
                    Airline: plainSession.CustomAirline, // Use the included CustomAirline data
                    flight_number: plainSession.customFlightNumber,
                    // Get details from the actual flight found for today if available
                    departure_time: actualFlight ? actualFlight.departure_time : null,
                    arrival_time: actualFlight ? actualFlight.arrival_time : null,
                    is_departure: actualFlight ? actualFlight.is_departure : true, // Default to true if not available 
                    status: actualFlight ? actualFlight.status : null, // Get status
                    remarks: actualFlight ? actualFlight.remarks : null, // Get remarks
                    // Use actual flight destination if available, else construct from custom data
                    destination: actualFlight?.DestinationInfo?.name || (plainSession.customDestination2 
                                   ? `${plainSession.customDestination1} / ${plainSession.customDestination2}`
                                   : plainSession.customDestination1),
                    DestinationInfo: actualFlight?.DestinationInfo || null // Include DestinationInfo object if available
                };

             } catch (flightError) {
                 console.error("Error fetching actual flight for custom session:", flightError);
                 // Provide a fallback structure with only the known custom data
                 plainSession.CustomFlightData = { 
                    Airline: plainSession.CustomAirline,
                    flight_number: plainSession.customFlightNumber,
                    destination: plainSession.customDestination2 ? `${plainSession.customDestination1} / ${plainSession.customDestination2}` : plainSession.customDestination1,
                    departure_time: null, 
                    arrival_time: null, 
                    is_departure: true, // Default to true for custom sessions
                    status: null, 
                    remarks: null,
                    DestinationInfo: null // Add null DestinationInfo for consistency
                 };
             }
             // Clean up raw custom fields and the extra CustomAirline object from the top level
             delete plainSession.customAirlineId; 
             delete plainSession.customFlightNumber;
             delete plainSession.customDestination1;
             delete plainSession.customDestination2;
             delete plainSession.CustomAirline; 

        } else if (plainSession.CustomAirline) {
             // Clean up CustomAirline if Flight data is present (shouldn't happen with correct FK logic)
             delete plainSession.CustomAirline;
             delete plainSession.customAirlineId; 
             delete plainSession.customFlightNumber;
             delete plainSession.customDestination1;
             delete plainSession.customDestination2;
        } else {
             // Clean up custom fields even if Flight is present (just in case)
             delete plainSession.customAirlineId; 
             delete plainSession.customFlightNumber;
             delete plainSession.customDestination1;
             delete plainSession.customDestination2;
        }
        
        // Ensure Flight object uses DestinationInfo
        if (plainSession.flight && !plainSession.flight.DestinationInfo) {
            // This case should ideally not happen if the include is correct, but as a fallback:
            plainSession.flight.DestinationInfo = null; 
            plainSession.flight.destination = plainSession.flight.destination || 'N/A'; // Use existing string if needed
        } else if (plainSession.flight) {
             plainSession.flight.destination = plainSession.flight.DestinationInfo?.name || plainSession.flight.destination || 'N/A';
        }


        return plainSession;
     }));


    // console.log("Aktivne sesije (obrađene):", results.length);
    res.json(results);
  } catch (error) {
    console.error('Greška pri dobavljanju aktivnih sesija:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
};

// New function to update notification text
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params; // Session ID
        const { notificationText } = req.body; // Expect camelCase

        // Fetch session with related data needed for placeholder replacement
        const session = await DisplaySession.findByPk(id, {
            include: [ 
                { 
                    model: Flight, 
                    as: 'flight', // Use alias 'flight'
                    required: false,
                    attributes: { 
                      exclude: ['destination_id'] // Exclude destination_id from the query
                    },
                    include: [
                        { model: Airline, as: 'Airline' },
                        { model: Destination, as: 'DestinationInfo' } // Include Destination
                    ]
                },
                { model: Airline, as: 'CustomAirline', required: false }
            ]
        });

        if (!session) {
            return res.status(404).json({ message: 'Sesija nije pronađena.' });
        }

        if (!session.isActive) { // Use camelCase
             return res.status(400).json({ message: 'Ne možete ažurirati obavještenje neaktivne sesije.' });
        }
        
        // Removed check restricting notification updates to 'notice' type only

        let finalNotificationText = notificationText || null; // Use camelCase

        // --- Placeholder Replacement Logic for Update ---
        if (finalNotificationText) { // Only process if text is provided
            let flightDataForPlaceholder = null;
            
            if (session.flight) { // Check session.flight (correct alias)
                flightDataForPlaceholder = session.flight.toJSON(); 
            } else if (session.customFlightNumber && session.CustomAirline) { // If it's a custom session
                 // Construct flight data object for custom session
                 flightDataForPlaceholder = {
                    flight_number: session.customFlightNumber,
                    // Destination will be set below based on actual flight or custom data
                    destination: '', // Initialize
                    departure_time: null, // Placeholder - fetch actual if critical
                    arrival_time: null,   // Placeholder
                    is_departure: null, // Placeholder
                    status: null, // Placeholder
                    remarks: null, // Placeholder
                    Airline: session.CustomAirline.toJSON(),
                    // Include DestinationInfo if available from the session's custom data (though unlikely unless fetched earlier)
                    DestinationInfo: null // Initialize
                 };
                 // Optionally fetch actual flight data again here if needed for placeholders like {destination}
                 const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                 const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                 const actualFlight = await Flight.findOne({
                     where: {
                         flight_number: session.customFlightNumber,
                         airline_id: session.CustomAirline.id,
                         [Op.or]: [
                             { departure_time: { [Op.between]: [todayStart, todayEnd] } },
                             { arrival_time: { [Op.between]: [todayStart, todayEnd] } }
                         ]
                     },
                     include: [{ model: Destination, as: 'DestinationInfo' }]
                 });
                 if (actualFlight) {
                     flightDataForPlaceholder.departure_time = actualFlight.departure_time;
                     flightDataForPlaceholder.arrival_time = actualFlight.arrival_time;
                     flightDataForPlaceholder.is_departure = actualFlight.is_departure;
                     flightDataForPlaceholder.status = actualFlight.status;
                     flightDataForPlaceholder.remarks = actualFlight.remarks;
                     flightDataForPlaceholder.DestinationInfo = actualFlight.DestinationInfo;
                     flightDataForPlaceholder.destination = actualFlight.DestinationInfo?.name || '';
                 } else {
                     flightDataForPlaceholder.destination = session.customDestination2 ? `${session.customDestination1} / ${session.customDestination2}` : session.customDestination1;
                 }
            }

            if (flightDataForPlaceholder) {
                finalNotificationText = replacePlaceholders(finalNotificationText, flightDataForPlaceholder);
            }
        }
        // --- End Placeholder Replacement ---

        session.notificationText = finalNotificationText; // Save processed text to camelCase field
        await session.save();

        console.log(`Notification updated for session ${id}:`, finalNotificationText); 
        // Return the updated session object
        res.json({ message: 'Obavještenje uspješno ažurirano.', session: session.toJSON() }); 

    } catch (error) {
        console.error('Greška pri ažuriranju obavještenja:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

module.exports = {
  openSession,
  closeSession,
  getActiveSessions,
  updateNotification // Export the new function
};
