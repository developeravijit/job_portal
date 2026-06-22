const express = require("express");
const adminController = require("../../controller/adminDashboardController/adminController");

const admin = express.Router();

// Register
admin.get("/register-page", adminController.adminRegisterPage);
admin.post("/register", adminController.adminRegister);

// Verify
admin.get("/verify", adminController.adminVerifyPage);
admin.post("/verify", adminController.adminVerify);
admin.post("/resend-otp", adminController.resendOTP);

// Login
admin.get("/login-page", adminController.adminLoginPage);

// Forgot Password
admin.get("/forgot-password", adminController.adminForgotPasswordPage);
admin.post("/forgot-password", adminController.adminForgotPassword);
admin.get("/reset-password/:token", adminController.adminResetPasswordPage);
admin.post("/reset-password/:token", adminController.adminResetPassword);

module.exports = admin;
