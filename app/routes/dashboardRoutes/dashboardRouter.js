const express = require("express");
const dashboardController = require("../../controller/dashboardController/dashboardController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");

const dashboard = express.Router();

// User Register
dashboard.get(
  "/user/register",
  authCheck,
  dashboardController.userRegisterPage,
);
dashboard.post("/user/register", dashboardController.userRegister);

// Employeer Register
dashboard.get(
  "/employeer/register",
  authCheck,
  dashboardController.employeerRegisterPage,
);
dashboard.post("/employeer/register", dashboardController.employeerRegister);

// Verify
dashboard.get("/verify", dashboardController.verifyPage);
dashboard.post("/verify", dashboardController.verifyUser);
dashboard.post("/resend-otp", dashboardController.resendOTP);

// Login & Logout
dashboard.get("/login", authCheck, dashboardController.loginPage);
dashboard.post("/login", dashboardController.login);
dashboard.get("/logout", authCheck, dashboardController.logout);

// Forgot Password
dashboard.get("/forgot-password", dashboardController.forgotPasswordPage);
dashboard.post("/forgot-password", dashboardController.forgotPassword);
dashboard.get("/reset-password/:token", dashboardController.resetPasswordPage);
dashboard.post("/reset-password/:token", dashboardController.resetPassword);

// User Home Page
dashboard.get("/user/home", authCheck, dashboardController.userHomePage);

// Employeer Home Page
dashboard.get(
  "/employeer/home",
  authCheck,
  dashboardController.employeerHomePage,
);

module.exports = dashboard;
