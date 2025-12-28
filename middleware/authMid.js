const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'No token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // console.log('Authenticated user:', decoded);
    req.user = decoded
    // console.log('Token verified successfully for user:', req.user);
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}
