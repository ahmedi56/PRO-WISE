/**
 * isAuthenticated
 *
 * @description :: Policy to check if a user is logged in.
 */
const jwt = require('jsonwebtoken');

module.exports = async function (req, res, proceed) {
  let token;

  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  } else if (req.query && req.query.token) {
    token = req.query.token;
    delete req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No authorization token was found' });
  }

  try {
    const secret = sails.config.custom.jwtSecret;
    const decoded = jwt.verify(token, secret);
    
    // Check if token is the right type
    if (decoded.type === 'refresh') {
      return res.status(401).json({ message: 'Cannot use refresh token for API access' });
    }

    req.user = decoded;
    return proceed();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'E_TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
