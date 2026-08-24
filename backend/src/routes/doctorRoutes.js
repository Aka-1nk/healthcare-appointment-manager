const express = require('express');
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  searchDoctors,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/:id', getDoctorById);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), createDoctor);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteDoctor);

// Doctor (own profile) or Admin
router.put('/:id', authenticate, async (req, res, next) => {
  // Check if user is the doctor or admin
  const { id } = req.params;
  const doctor = await require('@prisma/client').PrismaClient()
    .doctor.findUnique({ where: { id } });
  
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  
  if (req.user.role === 'ADMIN' || req.user.id === doctor.userId) {
    return updateDoctor(req, res, next);
  }
  
  return res.status(403).json({ error: 'Unauthorized to update this doctor profile' });
});

module.exports = router;