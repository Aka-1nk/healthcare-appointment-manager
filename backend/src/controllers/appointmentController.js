const { PrismaClient } = require('@prisma/client');
const { generatePreVisitSummary } = require('../services/llmService');

const prisma = new PrismaClient();

// Get available slots for a doctor
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // Get doctor with working hours
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const workingHours = doctor.workingHours || { start: '09:00', end: '17:00' };
    const slotDuration = doctor.slotDuration || 30;

    // Get booked appointments for that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        datetime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        datetime: true,
        duration: true
      }
    });

    // Generate available slots
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const startMinute = parseInt(workingHours.start.split(':')[1]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    const endMinute = parseInt(workingHours.end.split(':')[1]);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMinute, 0, 0);

    while (slotStart < slotEnd) {
      const slotTime = new Date(slotStart);
      
      // Check if slot is booked
      const isBooked = bookedAppointments.some(booking => {
        const bookingTime = new Date(booking.datetime);
        return bookingTime.getTime() === slotTime.getTime();
      });

      if (!isBooked) {
        slots.push({
          time: slotTime.toISOString(),
          available: true
        });
      }

      slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
    }

    res.json({
      doctorId,
      date,
      workingHours,
      slotDuration,
      totalSlots: slots.length,
      availableSlots: slots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

// Book appointment (with LLM integration)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, datetime, symptoms, additionalInfo } = req.body;
    const patientUserId = req.user.id;

    console.log('📝 Booking appointment for patient:', patientUserId);

    // Check if patient profile exists
    const patient = await prisma.patient.findUnique({
      where: { userId: patientUserId }
    });

    if (!patient) {
      return res.status(404).json({ 
        error: 'Patient profile not found. Please create patient profile first.'
      });
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check for double booking
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        datetime: new Date(datetime),
        status: {
          not: 'CANCELLED'
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    // Generate pre-visit summary using LLM
    console.log('🤖 Generating pre-visit summary...');
    const preVisitSummary = await generatePreVisitSummary(symptoms);
    console.log('✅ Pre-visit summary generated:', preVisitSummary);

    // Create appointment with pre-visit summary
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: patient.id,
        datetime: new Date(datetime),
        symptoms,
        additionalInfo,
        preVisitSummary: preVisitSummary,
        status: 'PENDING'
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
      preVisitSummary
    });
  } catch (error) {
    console.error('❌ Book appointment error:', error);
    res.status(500).json({ 
      error: 'Failed to book appointment',
      details: error.message 
    });
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res) => {
  try {
    const patientUserId = req.user.id;

    const patient = await prisma.patient.findUnique({
      where: { userId: patientUserId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });

    res.json({
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get doctor appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });

    res.json({
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Appointment already cancelled' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: updated
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Complete appointment with post-visit summary
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes, diagnosis, prescription } = req.body;

    console.log('📝 Completing appointment:', id);

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      console.log('❌ Appointment not found');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('✅ Appointment found, status:', appointment.status);

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot complete cancelled appointment' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Appointment already completed' });
    }

    // Generate post-visit summary (with mock fallback)
    let postVisitSummary = null;
    try {
      console.log('🤖 Generating post-visit summary...');
      const { generatePostVisitSummary } = require('../services/llmService');
      postVisitSummary = await generatePostVisitSummary(doctorNotes, diagnosis, prescription);
      console.log('✅ Post-visit summary generated');
    } catch (error) {
      console.log('⚠️ LLM error, using mock:', error.message);
      postVisitSummary = {
        summary: `Doctor's notes: ${doctorNotes || 'No notes provided'}`,
        medication_schedule: prescription || 'No medication prescribed',
        follow_up: 'Please schedule a follow-up appointment if symptoms persist.',
        red_flags: 'Seek immediate medical attention if symptoms worsen.'
      };
    }

    // Update appointment - store postVisitSummary as JSON
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        doctorNotes,
        diagnosis,
        prescription,
        postVisitSummary: postVisitSummary, // This is now a JSON object
        status: 'COMPLETED'
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Appointment completed:', updated.id);

    res.json({
      message: 'Appointment completed successfully',
      appointment: updated,
      postVisitSummary
    });
  } catch (error) {
    console.error('❌ Complete appointment error:', error);
    res.status(500).json({ 
      error: 'Failed to complete appointment',
      details: error.message 
    });
  }
};

// Export all functions
module.exports = {
  getAvailableSlots,
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  getAppointmentById,
  completeAppointment
};