const jwt = require("jsonwebtoken");
const httpCodes = require("../utils/httpCode");

const authCheck = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(httpCodes.unauthorized).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(httpCodes.unauthorized).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = authCheck;
