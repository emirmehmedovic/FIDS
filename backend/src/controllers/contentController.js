const DisplaySession = require('../models/displaySessionModel');
const StaticPage = require('../models/StaticPage');
const Flight = require('../models/Flight'); // Import Flight model
const Airline = require('../models/Airline'); // Import Airline model (needed for include)
const Destination = require('../models/Destination'); // Import Destination model (needed for include)
const path = require('path');
const fs = require('fs').promises; // Use promises API for async operations
const fsSync = require('fs'); // Keep sync version for existsSync if needed
const { Op } = require('sequelize'); // Import Op for database operations

const getAllContent = async (req, res) => {
  try {
    const pages = await StaticPage.findAll({ order: [['pageId', 'ASC']] }); // Sort pages
    res.json(pages);
  } catch (error) {
    console.error('Error in getAllContent:', error);
    res.status(500).json({ message: error.message });
  }
};

const getImages = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads');

    // Ensure the uploads directory exists
    try {
      // Check if directory exists (using sync is acceptable here for startup/initial check)
      if (!fsSync.existsSync(uploadsDir)) {
        // Attempt to create it asynchronously if it doesn't exist
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log(`Created uploads directory: ${uploadsDir}`);
      }
    } catch (mkdirError) {
      // Log error if directory creation fails, but proceed cautiously
      console.error('Critical error: Could not create uploads directory:', mkdirError);
      // Depending on requirements, you might want to return an error response here
      // return res.status(500).json({ message: 'Server setup error: Cannot access storage.' });
    }

    // Now proceed to read the directory
    const imageFilesRaw = await fs.readdir(uploadsDir);
    const imageFiles = imageFilesRaw.filter(file => {
      const ext = path.extname(file).toLowerCase();
      // Allow common image types
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });

    // Vrati relativne putanje
    const imageUrls = imageFiles.map(file => `/uploads/${file}`);
    res.json(imageUrls);

  } catch (error) {
    console.error('Greška u getImages:', error);
    res.status(500).json({ message: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) throw new Error('Nijedna slika nije uploadovana');

    // Vrati relativnu putanju uploadovane slike
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });

    // Note: Upsert logic removed as per new plan (upload is separate from linking)

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updatePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { imageUrl } = req.body; // Only expect imageUrl for linking

    const page = await StaticPage.findOne({ where: { pageId } });
    if (!page) {
      return res.status(404).json({ message: 'Stranica nije pronađena' });
    }

    // Update only the imageUrl
    page.imageUrl = imageUrl || ''; // Use empty string instead of null for unlinking
    await page.save();

    res.json({ message: 'Veza slike sa stranicom uspješno ažurirana', page });
  } catch (error) {
    console.error('Greška pri ažuriranju stranice:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const createPage = async (req, res) => {
  try {
    const { pageType } = req.body; // Očekujemo 'check-in', 'boarding', ili 'general'

    if (!['check-in', 'boarding', 'general'].includes(pageType)) {
      return res.status(400).json({ message: 'Nevažeći tip stranice.' });
    }

    let prefix = '';
    if (pageType === 'check-in') prefix = 'C';
    else if (pageType === 'boarding') prefix = 'U';
    else prefix = 'G';

    // Pronađi sve stranice sa istim prefiksom
    const existingPages = await StaticPage.findAll({
      where: {
        pageId: {
          [Op.startsWith]: prefix // Use Op.startsWith
        }
      },
      order: [['pageId', 'ASC']] // Sortiraj da lakše nađemo najveći broj
    });

    let nextNumber = 1;
    if (existingPages.length > 0) {
      // Pronađi najveći postojeći broj
      const numbers = existingPages.map(p => parseInt(p.pageId.substring(1), 10)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const newPageId = `${prefix}${nextNumber}`;

    // Proveri da li ID već postoji (za svaki slučaj)
    const checkExisting = await StaticPage.findOne({ where: { pageId: newPageId } });
    if (checkExisting) {
      // Ovo ne bi trebalo da se desi ako je logika ispravna, ali za svaki slučaj
      return res.status(500).json({ message: 'Greška pri generisanju jedinstvenog ID-a.' });
    }

    // Kreiraj novu stranicu bez slike
    const newPage = await StaticPage.create({
      pageId: newPageId,
      pageType: pageType,
      imageUrl: '' // Use empty string instead of null
    });

    res.status(201).json(newPage);

  } catch (error) {
    console.error('Greška pri kreiranju stranice:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    // Basic validation to prevent directory traversal
    if (!filename || filename.includes('/') || filename.includes('..')) {
        return res.status(400).json({ message: 'Nevažeće ime fajla.' });
    }

    const imagePath = path.join(__dirname, '../public/uploads', filename);
    const relativeImagePath = `/uploads/${filename}`;

    // 1. Check if file exists (using async stat)
    try {
        await fs.stat(imagePath); 
    } catch (statError) {
        if (statError.code === 'ENOENT') {
            return res.status(404).json({ message: 'Slika nije pronađena na serveru.' });
        }
        // Re-throw other stat errors
        throw statError;
    }

    // 2. Unlink image from any pages using it by setting to empty string
    await StaticPage.update(
      { imageUrl: '' }, // Use empty string instead of null
      { where: { imageUrl: relativeImagePath } }
    );
    console.log(`Unlinked image ${relativeImagePath} from StaticPages.`);

    // 3. Delete the physical file asynchronously
    await fs.unlink(imagePath);
    console.log(`Deleted physical file: ${imagePath}`);

    res.json({ message: `Slika ${filename} uspješno obrisana.` });

  } catch (error) {
    console.error('Greška pri brisanju slike:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get combined content for a specific page (session or static)
const getPageContent = async (req, res) => {
  try {
    // Correctly read pageId from query parameter 'id'
    const { id: pageId } = req.query; 

    // Add a check if pageId is missing from query
    if (!pageId) {
      // Fallback: Check path parameters for compatibility with older attempts/direct links
      const { pageId: paramPageId } = req.params;
      if (paramPageId) {
         console.warn(`[Compatibility] Using pageId from path param: ${paramPageId}`);
         req.params.pageId = paramPageId; // Keep original behavior if query 'id' is missing
      } else {
        console.error('[getPageContent] Page ID is missing in query parameters (id).');
        return res.status(400).json({ message: 'Page ID (id) missing in query parameters.' });
      }
    } else {
      // If query 'id' exists, make sure req.params.pageId is also set for potential downstream use
      // in the console.error log or other logic if needed (though ideally refactor later)
       req.params.pageId = pageId;
       // console.log(`[getPageContent] Processing request for pageId from query: ${pageId}`);
    }

    // Find active session first using the determined pageId
    const activeSession = await DisplaySession.findOne({
      where: { 
        pageId: req.params.pageId, 
        isActive: true 
      },
      include: [
        {
          model: Flight,
          as: 'flight', 
          required: false, 
          include: [
              { model: Airline, as: 'Airline' },
              { model: Destination, as: 'DestinationInfo' }
          ]
        },
        // Include CustomAirline if needed for custom sessions
        {
           model: Airline,
           as: 'CustomAirline', 
           required: false
        },
        // ADD INCLUDES FOR DUAL FLIGHTS
        {
          model: Flight,
          as: 'flight1',
          required: false,
          include: [
              { model: Airline, as: 'Airline' },
              { model: Destination, as: 'DestinationInfo' }
          ]
        },
        {
          model: Flight,
          as: 'flight2',
          required: false,
          include: [
              { model: Airline, as: 'Airline' },
              { model: Destination, as: 'DestinationInfo' }
          ]
        }
      ]
    });

    if (activeSession) {
      const plainSession = activeSession.toJSON();

      // Handle Dual Flight Data Construction
      if (plainSession.flight1Id && plainSession.flight2Id && plainSession.flight1 && plainSession.flight2) {
          // console.log(`[getPageContent] Found dual flight session for page ${req.params.pageId}`);
          // Create a synthetic 'flight' object for the renderer
          plainSession.flight = {
              // Combine flight numbers
              flight_number: `${plainSession.flight1.flight_number} / ${plainSession.flight2.flight_number}`,
              // Combine destinations - check if names are same, codes different?
              // Assuming different destinations for now
              destination: `${plainSession.flight1.DestinationInfo?.name || 'N/A'} / ${plainSession.flight2.DestinationInfo?.name || 'N/A'}`,
              // Use departure time from the first flight? Or earliest?
              departure_time: plainSession.flight1.departure_time, 
              is_departure: plainSession.flight1.is_departure, // Assume both are same type
              arrival_time: plainSession.flight1.arrival_time, // Use first flight
              // Combine airlines if different, otherwise use first
              Airline: plainSession.flight1.Airline, // Default to first airline
              // Construct combined DestinationInfo if needed by renderer (use combined name)
              DestinationInfo: {
                  name: `${plainSession.flight1.DestinationInfo?.name || 'N/A'} / ${plainSession.flight2.DestinationInfo?.name || 'N/A'}`,
                  code: `${plainSession.flight1.DestinationInfo?.code || ''} / ${plainSession.flight2.DestinationInfo?.code || ''}`
              },
              // Add other fields if necessary, possibly null or combined
              status: null, 
              remarks: null 
          };
          // Clean up individual flight data from root if desired
          // delete plainSession.flight1;
          // delete plainSession.flight2;
      } 
      // Handle Custom Session Data Construction (Existing logic)
      else if (plainSession.customFlightNumber && plainSession.CustomAirline) { // Check CustomAirline exists
          // console.log(`[getPageContent] Found custom flight session for page ${req.params.pageId}`);
          // ... (existing custom flight logic remains largely the same) ...
          // Ensure CustomFlightData is structured like the standard 'flight' object
           const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
           const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
           let actualFlight = null;
           try {
               actualFlight = await Flight.findOne({
                   where: {
                       flight_number: plainSession.customFlightNumber,
                       airline_id: plainSession.CustomAirline.id,
                       [Op.or]: [
                           { departure_time: { [Op.between]: [todayStart, todayEnd] } },
                           { arrival_time: { [Op.between]: [todayStart, todayEnd] } }
                       ]
                   },
                   include: [{ model: Destination, as: 'DestinationInfo' }] // Include DestinationInfo
               });
           } catch (flightError) {
                console.error("Error fetching actual flight for custom session in getPageContent:", flightError);
           }

           // Construct the CustomFlightData to mimic the 'flight' object structure
           plainSession.flight = { // Assign to 'flight' for renderer
               Airline: plainSession.CustomAirline, // Use the included CustomAirline
               flight_number: plainSession.customFlightNumber,
               departure_time: actualFlight ? actualFlight.departure_time : null,
               arrival_time: actualFlight ? actualFlight.arrival_time : null,
               is_departure: actualFlight ? actualFlight.is_departure : null,
               status: actualFlight ? actualFlight.status : null,
               remarks: actualFlight ? actualFlight.remarks : null,
               destination: plainSession.customDestination2 ? `${plainSession.customDestination1} / ${plainSession.customDestination2}` : plainSession.customDestination1,
               // Add DestinationInfo similar to how it's structured for standard flights
               DestinationInfo: actualFlight?.DestinationInfo ? { 
                   name: actualFlight.DestinationInfo.name, 
                   code: actualFlight.DestinationInfo.code 
               } : { 
                   name: plainSession.customDestination2 ? `${plainSession.customDestination1} / ${plainSession.customDestination2}` : plainSession.customDestination1,
                   code: '' // No code available for custom destinations
               }
           };
           // Clean up original custom fields
           delete plainSession.customAirlineId; delete plainSession.customFlightNumber; delete plainSession.customDestination1; delete plainSession.customDestination2; delete plainSession.CustomAirline;
       } 
       // Standard session (existing flight relation)
       else if (plainSession.flight) {
            // console.log(`[getPageContent] Found standard flight session for page ${req.params.pageId}`);
            // Ensure flight object is clean (no custom fields needed)
            delete plainSession.customAirlineId; delete plainSession.customFlightNumber; delete plainSession.customDestination1; delete plainSession.customDestination2; delete plainSession.CustomAirline;
       }

      // Ensure the final response structure is consistent
      return res.json({
        content: plainSession, // Return session, now with a consistent plainSession.flight structure
        isSessionActive: true
      });
    }

    // If no active session, find static content
    const staticContent = await StaticPage.findOne({ 
      where: { pageId: req.params.pageId } // Use the potentially updated req.params.pageId
    });

    // Handle case where neither session nor static page exists
    if (!staticContent) {
        return res.status(404).json({ message: `Sadržaj za stranicu ${req.params.pageId} nije pronađen.` });
    }

    res.json({
      content: staticContent,
      isSessionActive: false
    });

  } catch (error) {
    // Use the potentially updated req.params.pageId for logging
    console.error(`Greška u getPageContent for pageId ${req.params.pageId}:`, error); 
    res.status(500).json({ 
      message: 'Server error fetching page content',
      error: error.message 
    });
  }
};


module.exports = {
  getAllContent,
  getImages,
  uploadImage,
  updatePage,
  createPage,
  deleteImage, // Dodajemo novu funkciju
  getPageContent // Export new function
};
