const httpCodes = require("../utils/httpCode");

const permission = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(httpCodes.forbidden).json({
        success: false,
        message: "Permission Denied",
      });
    }
    next();
  };
};

module.exports = permission;
