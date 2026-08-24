const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create patient profile
const createPatient = async (req, res) => {
  try {
    const { userId, dateOfBirth, phoneNumber, medicalHistory } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'PATIENT') {
      return res.status(400).json({ error: 'User must have PATIENT role' });
    }

    // Check if patient already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { userId }
    });

    if (existingPatient) {
      return res.status(400).json({ error: 'Patient profile already exists' });
    }

    const patient = await prisma.patient.create({
      data: {
        userId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        phoneNumber,
        medicalHistory
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Patient profile created successfully',
      patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

// Get patient by user ID
const getPatientByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

module.exports = { createPatient, getPatientByUserId };