const express = require('express');
const {
  getAvailableSlots,
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  getAppointmentById,
  completeAppointment
} = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/doctors/:doctorId/slots', getAvailableSlots);

// Protected routes
router.post('/book', authenticate, bookAppointment);
router.get('/my-appointments', authenticate, getPatientAppointments);
router.get('/doctors/:doctorId/appointments', authenticate, getDoctorAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.put('/:id/cancel', authenticate, cancelAppointment);
router.put('/:id/complete', authenticate, completeAppointment);

module.exports = router;