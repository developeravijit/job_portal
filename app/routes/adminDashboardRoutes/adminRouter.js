const express = require("express");
const adminController = require("../../controller/adminDashboardController/adminController");
const adminAuthCheck = require("../../middleware/adminMiddleware/adminAuthCheck");

const admin = express.Router();

// Register
admin.get("/register", adminController.adminRegisterPage);
admin.post("/register", adminController.adminRegister);

// Verify
admin.get("/verify", adminController.adminVerifyPage);
admin.post("/verify", adminController.adminVerify);
admin.post("/resend-otp", adminController.resendOTP);

// Forgot Password
admin.get("/forgot-password", adminController.adminForgotPasswordPage);
admin.post("/forgot-password", adminController.adminForgotPassword);
admin.get("/reset-password/:token", adminController.adminResetPasswordPage);
admin.post("/reset-password/:token", adminController.adminResetPassword);

// Login
admin.get("/login", adminAuthCheck, adminController.adminLoginPage);
admin.post("/login", adminController.login);

// Logout
admin.get("/logout", adminAuthCheck, adminController.logout);

// Admin Home Page
admin.get("/home", adminAuthCheck, adminController.homePage);

// All Candidates
admin.get("/candidates", adminAuthCheck, adminController.candidates);

// All Employers
admin.get("/employers", adminAuthCheck, adminController.employers);

// All Companies
admin.get("/companies", adminAuthCheck, adminController.companies);

module.exports = admin;
