const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
  
  const token = authHeader?.replace('Bearer ', '').trim();
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token, please login' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (ex) {
    console.log('JWT Verify error:', ex.message);
    if (ex.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};
