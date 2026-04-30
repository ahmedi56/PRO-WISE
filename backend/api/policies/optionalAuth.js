/**
 * optionalAuth
 *
 * @description :: Policy to populate req.user if a token is present, but doesn't block if missing.
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
  }

  if (!token) {
    return proceed();
  }

  try {
    const secret = sails.config.custom.jwtSecret;
    const decoded = jwt.verify(token, secret);
    
    if (decoded.type !== 'refresh') {
      req.user = decoded;
    }
    return proceed();
  } catch (err) {
    // If token is invalid or expired, we just proceed as guest
    return proceed();
  }
};
