const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { register, login } = require('./controllers/authController');
const { authenticate } = require('./middleware/auth');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server works!' });
});

// Auth routes (public)
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Protected route
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ 
    message: 'Protected route accessed successfully!',
    user: req.user 
  });
});

// Doctor routes
app.use('/api/doctors', doctorRoutes);

// Patient routes
app.use('/api/patients', patientRoutes);

// Appointment routes
app.use('/api/appointments', appointmentRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me (Protected)`);
  console.log(`   GET  /api/doctors`);
  console.log(`   GET  /api/doctors/search?specialization=`);
  console.log(`   GET  /api/doctors/:id`);
  console.log(`   POST /api/patients (Protected)`);
  console.log(`   GET  /api/patients/:userId (Protected)`);
  console.log(`   GET  /api/appointments/doctors/:doctorId/slots?date=YYYY-MM-DD`);
  console.log(`   POST /api/appointments/book (Protected)`);
  console.log(`   GET  /api/appointments/my-appointments (Protected)`);
  console.log(`   PUT  /api/appointments/:id/cancel (Protected)`);
});