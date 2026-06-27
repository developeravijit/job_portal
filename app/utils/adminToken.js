const jwt = require("jsonwebtoken");

const adminAccessToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_ADMIN_SECRET,
    {
      expiresIn: "30m",
    },
  );
};

const adminRefreshToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
    },
    process.env.JWT_ADMIN_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const adminResetPasswordToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
    },
    process.env.JWT_ADMIN_RESET_PASSWORD,
    { expiresIn: "1h" },
  );
};

module.exports = {
  adminAccessToken,
  adminRefreshToken,
  adminResetPasswordToken,
};
