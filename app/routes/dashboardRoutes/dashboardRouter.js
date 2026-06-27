const express = require("express");
const dashboardController = require("../../controller/dashboardController/dashboardController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");

const dashboard = express.Router();

// User Register
dashboard.get("/candidate/register", dashboardController.userRegisterPage);
dashboard.post("/candidate/register", dashboardController.userRegister);

// employer Register
dashboard.get("/employer/register", dashboardController.employerRegisterPage);
dashboard.post("/employer/register", dashboardController.employerRegister);

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

module.exports = dashboard;
