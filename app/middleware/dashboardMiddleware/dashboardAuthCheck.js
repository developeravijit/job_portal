const jwt = require("jsonwebtoken");
const User = require("../../model/user");
const { generateAccessToken } = require("../../utils/token");
const httpCodes = require("../../utils/httpCode");

// const authCheck = async (req, res, next) => {
//   try {
//     const accessToken = req.cookies.accessToken;

//     // Access token exists
//     if (accessToken) {
//       try {
//         const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

//         req.user = decoded;
//         return next();
//       } catch (error) {
//         // return res.status(httpCodes.unauthorized).json({
//         //   success: false,
//         //   message: error.message,
//         // });
//       }
//     }

//     // Check refresh token
//     const refreshToken = req.cookies.refreshToken;

//     if (!refreshToken) {
//       return res.redirect("/dashboard/login");
//     }

//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//     const user = await User.findById(decoded.id);

//     if (!user || user.refreshToken !== refreshToken) {
//       res.clearCookie("accessToken");
//       res.clearCookie("refreshToken");

//       return res.redirect("/dashboard/login");
//     }

//     // Generate new access token
//     const newAccessToken = generateAccessToken(user);

//     res.cookie("accessToken", newAccessToken, {
//       httpOnly: true,
//       secure: false,
//       sameSite: "strict",
//       maxAge: 30 * 60 * 1000,
//     });

//     req.user = jwt.verify(newAccessToken, process.env.JWT_SECRET);

//     next();
//   } catch (error) {
//     res.clearCookie("accessToken");
//     res.clearCookie("refreshToken");

//     return res.redirect("/dashboard/login");
//   }
// };

const authCheck = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // For login/register pages - prevent authenticated users from accessing
    const loginRegisterPaths = [
      "/login",
      "/user/register",
      "/employer/register",
      "/forgot-password",
    ];

    if (loginRegisterPaths.includes(req.path)) {
      try {
        // Check access token first
        if (accessToken) {
          try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

            if (decoded.role === "user") {
              return res.redirect("/candidate/home");
            }

            if (decoded.role === "employer") {
              return res.redirect("/employer/dashboard/home");
            }
          } catch (error) {
            // Access token invalid, continue to check refresh token
          }
        }

        // Check refresh token
        if (refreshToken) {
          try {
            const decoded = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH_SECRET,
            );

            const user = await User.findById(decoded.id);

            // Verify refresh token matches stored token
            if (user && user.refreshToken === refreshToken) {
              // Generate new access token
              const newAccessToken = generateAccessToken(user);

              res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 30 * 60 * 1000,
              });

              if (user.role === "user") {
                return res.redirect("/candidate/home");
              }

              if (user.role === "employer") {
                return res.redirect("/employer/dashboard/home");
              }
            }
          } catch (error) {
            // Refresh token invalid, clear cookies and allow access to login page
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
          }
        }
      } catch (error) {
        // On error, clear cookies and allow access to login page
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
      }

      return next();
    }

    // Protected routes logic
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        req.user = decoded;
        return next();
      } catch (error) {}
    }

    if (!refreshToken) {
      return res.redirect("/job-portal/login");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/job-portal/login");
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });

    req.user = jwt.verify(newAccessToken, process.env.JWT_SECRET);

    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.redirect("/job-portal/login");
  }
};

module.exports = authCheck;
