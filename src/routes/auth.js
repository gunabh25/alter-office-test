const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', rateLimiter, authController.registerApp);
router.get('/api-key', rateLimiter, authController.getApiKey);
router.post('/revoke', rateLimiter, authController.revokeApiKey);
router.post('/regenerate', rateLimiter, authController.regenerateApiKey);

module.exports = router;
