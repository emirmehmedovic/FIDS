const DisplaySession = require('../models/displaySessionModel');
const Flight = require('../models/Flight');
const Airline = require('../models/Airline');


const openSession = async (req, res) => {
  try {
    const { flightId, pageId, sessionType, isPriority } = req.body;

    // Provjeri da li je stranica za boarding (U1 ili U2)
    const isBoardingPage = pageId.startsWith('U');

    // Ako je stranica za boarding, a sessionType nije boarding, vrati grešku
    if (isBoardingPage && sessionType !== 'boarding') {
      throw new Error('Stranica je rezervirana za boarding sesije.');
    }

    // Zatvori sve aktivne sesije za ovaj pageId
    await DisplaySession.update(
      { is_active: false, end_time: new Date() },
      { where: { pageId, is_active: true } }
    );

    // Kreiraj novu sesiju
    const session = await DisplaySession.create({
      flightId,
      pageId,
      sessionType: isBoardingPage ? 'boarding' : sessionType, // Postavi sessionType
      isPriority,
      is_active: true,
      start_time: new Date()
    });

    console.log("Sesija kreirana:", session); // Debug
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
      include: [{
        model: Flight,
        as: 'Flight', // Eksplicitno koristite alias
        include: [{
          model: Airline,
          as: 'Airline' // Eksplicitno koristite alias
        }]
      }]
    });

    console.log("Aktivne sesije:", sessions); // Debug
    res.json(sessions);
  } catch (error) {
    console.error('Greška pri dobavljanju aktivnih sesija:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  openSession,
  closeSession,
  getActiveSessions,
};