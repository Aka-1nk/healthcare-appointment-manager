const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  console.log('🔐 Authenticating request...');
  
  const authHeader = req.headers.authorization;
  console.log('📋 Authorization header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'Authentication required - No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token in authorization header');
    return res.status(401).json({ error: 'Authentication required - Invalid token format' });
  }

  try {
    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('✅ Token verified for user:', decoded.email);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };