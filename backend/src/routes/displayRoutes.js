const express = require('express');
const router = express.Router();
const DisplaySession = require('../models/displaySessionModel'); 
const { openSession, closeSession, getActiveSessions } = require('../controllers/displaySessionController');

router.post('/sessions', openSession);
router.put('/sessions/:id/close', closeSession);
router.get('/active', getActiveSessions); 
router.get('/active', async (req, res) => {
    try {
      const whereClause = { 
        is_active: true,
        ...(req.query.page && { pageId: req.query.page }) 
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
  });
module.exports = router;