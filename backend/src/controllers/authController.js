const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    console.log('📝 Full request body:', req.body);
    console.log('📝 Content-Type:', req.headers['content-type']);
    
    const { email, password, name, role = 'PATIENT' } = req.body;

    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ Empty body received');
      return res.status(400).json({ 
        error: 'Request body is empty. Make sure you are sending JSON with Content-Type: application/json',
        received: req.body
      });
    }

    // Validate input
    if (!email || !password || !name) {
      console.log('❌ Missing fields:', { email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ 
        error: 'All fields are required',
        missing: { 
          email: !email, 
          password: !password, 
          name: !name 
        },
        received: req.body
      });
    }

    console.log('🔍 Checking if user exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('💾 Creating user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    });

    console.log('✅ User created:', user.id);

    console.log('🔑 Generating JWT...');
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('📝 Login request:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🔍 Finding user:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 Checking password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for:', email);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
};

module.exports = { register, login };