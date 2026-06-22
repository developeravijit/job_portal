const express = require("express");
const userController = require("../controller/userController");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");

const user = express.Router();

/* ============================Register/Login=============================================== */

// Resigter User/Employeer/Admin
user.post("/register", userController.register);
// Login User/Employeer/Admin
user.post("/login", userController.login);

/* ================================Email Verification=========================================== */

// Verify User/Employeer/Admin
user.post("/verify", userController.verifyUser);
user.post("/resend-otp", userController.resendOTP);

/* =====================================New Access Token====================================== */

// Generate New Access Token
user.post("/new-token", userController.newToken);

/* ====================================Forgot Password======================================= */

// Forgot Password User/Employeer/Admin
user.post("/reset-link", userController.resetPasswordLink);
user.post("/reset-password/:token", userController.resetPassword);

/* ===============================User, Employeer & Admin List============================================ */

// Get all users
user.get("/users", authCheck, permission("admin"), userController.showUser);
// Get all employeers
user.get(
  "/employeers",
  authCheck,
  permission("admin"),
  userController.showEmployeer,
);
// Get all admins
user.get("/admins", authCheck, permission("admin"), userController.showAdmin);

/* =============================Update Data============================================== */

// Update User Data
user.put(
  "/update-user/:id",
  authCheck,
  permission("user", "admin"),
  userController.updateUser,
);
// Update Employeer Data
user.put(
  "/update-employeer/:id",
  authCheck,
  permission("employeer", "admin"),
  userController.updateEmployeer,
);
// Update Admin Data
user.put(
  "/update-admin/:id",
  authCheck,
  permission("admin"),
  userController.updateAdmin,
);

/* =============================Change Status============================================== */

// Inactive User and restore
user.patch(
  "/user-inactive/:id",
  authCheck,
  permission("admin"),
  userController.inactiveUser,
);

// Inactive users list
user.get(
  "/inactive-users",
  authCheck,
  permission("admin"),
  userController.showInactiveUsers,
);

// Restore Inactive Users
user.patch(
  "/restore-user/:id",
  authCheck,
  permission("admin"),
  userController.restoreUser,
);

// Inactive Employeer and restore
user.patch(
  "/employeer-inactive/:id",
  authCheck,
  permission("admin"),
  userController.inactiveEmployeer,
);

// Show Inactive Employeers List
user.get(
  "/inactive-employeers",
  authCheck,
  permission("admin"),
  userController.showInactiveEmployeers,
);

// Restore Inactive Employeers
user.patch(
  "/restore-employeer/:id",
  authCheck,
  permission("admin"),
  userController.restoreEmployeer,
);

/* =========================================================================== */

// Get all Employeers and companies List
user.get(
  "/employeer-companies",
  authCheck,
  permission("admin"),
  userController.employeerCompanies,
);

module.exports = user;
