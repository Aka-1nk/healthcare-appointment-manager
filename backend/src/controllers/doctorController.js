const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a doctor profile (Admin only)
const createDoctor = async (req, res) => {
  try {
    const { 
      userId, 
      specialization, 
      workingHours, 
      slotDuration = 30, 
      consultationFee = 0 
    } = req.body;

    console.log('📝 Creating doctor for user:', userId);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'DOCTOR') {
      return res.status(400).json({ error: 'User must have DOCTOR role' });
    }

    // Check if doctor already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId }
    });

    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor profile already exists' });
    }

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        userId,
        specialization,
        workingHours: workingHours || { start: '09:00', end: '17:00' },
        slotDuration,
        consultationFee
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

    console.log('✅ Doctor created:', doctor.id);
    res.status(201).json({
      message: 'Doctor profile created successfully',
      doctor
    });
  } catch (error) {
    console.error('❌ Create doctor error:', error);
    res.status(500).json({ 
      error: 'Failed to create doctor',
      message: error.message 
    });
  }
};

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
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

    res.json({ 
      count: doctors.length,
      doctors 
    });
  } catch (error) {
    console.error('❌ Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

// Get doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Looking for doctor with ID:', id);

    const doctor = await prisma.doctor.findUnique({
      where: { id },
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

    if (!doctor) {
      console.log('❌ Doctor not found');
      return res.status(404).json({ error: 'Doctor not found' });
    }

    console.log('✅ Doctor found:', doctor.specialization);
    res.json({ doctor });
  } catch (error) {
    console.error('❌ Get doctor error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch doctor',
      message: error.message 
    });
  }
};

// Search doctors by specialization
const searchDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    console.log('🔍 Search query received:', specialization);

    if (!specialization) {
      return res.status(400).json({ error: 'Specialization query parameter is required' });
    }

    // Simple contains search (case-sensitive but works)
    const doctors = await prisma.doctor.findMany({
      where: {
        isActive: true,
        specialization: {
          contains: specialization
        }
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

    console.log(`✅ Found ${doctors.length} doctors matching "${specialization}"`);

    res.json({
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Failed to search doctors',
      details: error.message
    });
  }
};

// Update doctor profile
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialization, workingHours, slotDuration, consultationFee, isActive } = req.body;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        specialization: specialization || undefined,
        workingHours: workingHours || undefined,
        slotDuration: slotDuration || undefined,
        consultationFee: consultationFee !== undefined ? consultationFee : undefined,
        isActive: isActive !== undefined ? isActive : undefined
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

    res.json({
      message: 'Doctor profile updated successfully',
      doctor
    });
  } catch (error) {
    console.error('❌ Update doctor error:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
};

// Delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    await prisma.doctor.delete({
      where: { id }
    });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('❌ Delete doctor error:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  searchDoctors,
  updateDoctor,
  deleteDoctor
};