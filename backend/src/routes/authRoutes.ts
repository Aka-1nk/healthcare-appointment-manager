import express from 'express';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

// Temporary routes for testing
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint working!' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint working!' });
});

export default router;