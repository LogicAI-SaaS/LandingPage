const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hasher un mot de passe
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Comparer un mot de passe
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'logicai_super_secret_jwt_key_change_in_production_2024',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Vérifier un token JWT
const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'logicai_super_secret_jwt_key_change_in_production_2024'
  );
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
