const jwt = require("jsonwebtoken");

const ISSUER = "library-backend";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d", issuer: ISSUER }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { issuer: ISSUER });
  } catch {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
