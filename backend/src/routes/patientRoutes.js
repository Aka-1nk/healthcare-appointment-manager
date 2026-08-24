const express = require('express');
const { createPatient, getPatientByUserId } = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', authenticate, createPatient);
router.get('/:userId', authenticate, getPatientByUserId);

module.exports = router;