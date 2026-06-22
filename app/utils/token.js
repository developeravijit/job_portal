const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};

const resetPasswordToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_RESET_PASSWORD,
    { expiresIn: "1h" },
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  resetPasswordToken,
};
