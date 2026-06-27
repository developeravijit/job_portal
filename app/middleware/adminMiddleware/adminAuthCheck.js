const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { adminAccessToken } = require("../../utils/adminToken");

const adminAuthCheck = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Prevent logged-in admin from accessing login page
    const loginPaths = ["/login"];

    if (req.originalUrl === "/admin/dashboard/login") {
      try {
        // Check access token
        if (accessToken) {
          try {
            jwt.verify(accessToken, process.env.JWT_ADMIN_SECRET);
            return res.redirect("/admin/dashboard/home");
          } catch (error) {
            // Access token expired, continue to refresh token
          }
        }

        // Check refresh token
        if (refreshToken) {
          try {
            const decoded = jwt.verify(
              refreshToken,
              process.env.JWT_ADMIN_REFRESH_SECRET,
            );

            const admin = await User.findById(decoded.id);

            if (admin && admin.refreshToken === refreshToken) {
              const newAccessToken = adminAccessToken(admin);

              res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 30 * 60 * 1000,
              });

              return res.redirect("/admin/dashboard/home");
            }
          } catch (error) {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
          }
        }
      } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
      }

      return next();
    }

    // Protected routes
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ADMIN_SECRET);

        req.user = decoded;
        return next();
      } catch (error) {
        // Access token expired, check refresh token
      }
    }

    if (!refreshToken) {
      return res.redirect("/admin/dashboard/login");
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_ADMIN_REFRESH_SECRET,
    );

    const admin = await User.findById(decoded.id);

    if (!admin || admin.refreshToken !== refreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/admin/dashboard/login");
    }

    const newAccessToken = adminAccessToken(admin);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });

    req.user = jwt.verify(newAccessToken, process.env.JWT_ADMIN_SECRET);

    return next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.redirect("/admin/dashboard/login");
  }
};

module.exports = adminAuthCheck;
