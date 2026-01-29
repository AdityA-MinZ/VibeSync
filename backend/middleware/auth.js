const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Auth header:', authHeader);
  
  const token = authHeader?.replace('Bearer ', '').trim();
  console.log('Token preview:', token?.slice(0, 30));
  
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded.id);
    req.user = decoded;
    next();
  } catch (ex) {
    console.log('Verify error:', ex.message);
    res.status(400).json({ error: 'Invalid token' });
  }
};
