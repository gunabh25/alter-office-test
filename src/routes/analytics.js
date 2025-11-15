const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const requireApiKey = require('../middleware/requireApiKey')();
const rateLimiter = require('../middleware/rateLimiter');

router.post('/collect', rateLimiter, requireApiKey, analyticsController.collectEvent);
router.get('/event-summary', rateLimiter, analyticsController.eventSummary);
router.get('/user-stats', rateLimiter, analyticsController.userStats);

module.exports = router;
