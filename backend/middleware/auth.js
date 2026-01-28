const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Full Auth Header:', authHeader);
  
  const token = authHeader?.replace('Bearer ', '').trim();
  console.log('Extracted token preview:', token ? token.slice(0, 30) + '...' : 'EMPTY');
  console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES (length: ' + process.env.JWT_SECRET.length + ')' : 'NO');
  
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified for user ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (ex) {
    console.log('JWT Verify error:', ex.message);
    res.status(400).json({ error: 'Invalid token' });
  }
};
