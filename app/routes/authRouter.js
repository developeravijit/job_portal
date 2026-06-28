const express = require("express");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");
const authController = require("../controller/authController");
const uploadImage = require("../middleware/imageUpload,js");

const user = express.Router();

/* ============================Register/Login=============================================== */
// Resigter User/Employer/Admin
/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register User, Employer or Admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: User registered successfully
 */
user.post("/register", authController.register);

// Login User/employer/Admin
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login User
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
user.post("/login", authController.login);

/* ================================Email Verification=========================================== */
// Verify User/employer/Admin
/**
 * @swagger
 * /api/v1/auth/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User verified successfully
 */
user.post("/verify", authController.verifyUser);

// Resend OTP
/**
 * @swagger
 * /api/v1/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
user.post("/resend-otp", authController.resendOTP);

/* =====================================New Access Token====================================== */
// Generate New Access Token
/**
 * @swagger
 * /api/v1/auth/new-token:
 *   post:
 *     summary: Generate New Access Token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New token generated
 */
user.post("/new-token", authController.newToken);

/* ====================================Forgot Password======================================= */
// Forgot Password User/employer/Admin
/**
 * @swagger
 * /api/v1/auth/reset-link:
 *   post:
 *     summary: Send Reset Password Link
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Reset link sent
 */
user.post("/reset-link", authController.resetPasswordLink);

// Reset Password
/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Reset Password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
user.post("/reset-password/:token", authController.resetPassword);

/* ===============================User, employer & Admin List============================================ */
// Get all candidates
/**
 * @swagger
 * /api/v1/auth/candidates:
 *   get:
 *     summary: Get All Users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 */
user.get(
  "/candidates",
  authCheck,
  permission("admin"),
  authController.showUser,
);

// Get all employers
/**
 * @swagger
 * /api/v1/auth/employers:
 *   get:
 *     summary: Get All Employers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer list
 */
user.get(
  "/employers",
  authCheck,
  permission("admin"),
  authController.showemployer,
);

// Get all admins
/**
 * @swagger
 * /api/v1/auth/admins:
 *   get:
 *     summary: Get All Admins
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin list
 */
user.get("/admins", authCheck, permission("admin"), authController.showAdmin);

/* =============================Update Data============================================== */
// Update User Data
/**
 * @swagger
 * /api/v1/auth/update-user/{id}:
 *   put:
 *     summary: Update User Profile
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
user.put(
  "/update-user/:id",
  authCheck,
  permission("user", "admin"),
  uploadImage.single("avatar"),
  authController.updateUser,
);

// Update employer Data
/**
 * @swagger
 * /api/v1/auth/update-employer/{id}:
 *   put:
 *     summary: Update Employer Profile
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Employer ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Employer updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employer not found
 *       500:
 *         description: Internal server error
 */
user.put(
  "/update-employer/:id",
  authCheck,
  permission("employer", "admin"),
  authController.updateemployer,
);

// Update Admin Data
/**
 * @swagger
 * /api/v1/auth/update-admin/{id}:
 *   put:
 *     summary: Update Admin Profile
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Admin ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
user.put(
  "/update-admin/:id",
  authCheck,
  permission("admin"),
  authController.updateAdmin,
);

/* =============================Change Status============================================== */
// Inactive User and restore
/**
 * @swagger
 * /api/v1/auth/user-inactive/{id}:
 *   patch:
 *     summary: Inactivate User
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User inactivated successfully
 */
user.patch(
  "/user-inactive/:id",
  authCheck,
  permission("admin"),
  authController.inactiveUser,
);

// Inactive users list
/**
 * @swagger
 * /api/v1/auth/inactive-users:
 *   get:
 *     summary: Get Inactive Users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inactive users list
 */
user.get(
  "/inactive-users",
  authCheck,
  permission("admin"),
  authController.showInactiveUsers,
);

// Restore Inactive Users
/**
 * @swagger
 * /api/v1/auth/restore-user/{id}:
 *   patch:
 *     summary: Restore User
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User restored successfully
 */
user.patch(
  "/restore-user/:id",
  authCheck,
  permission("admin"),
  authController.restoreUser,
);

// Inactive employer and restore
/**
 * @swagger
 * /api/v1/auth/employer-inactive/{id}:
 *   patch:
 *     summary: Inactivate Employer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employer inactivated successfully
 */
user.patch(
  "/employer-inactive/:id",
  authCheck,
  permission("admin"),
  authController.inactiveemployer,
);

// Show Inactive employers List
/**
 * @swagger
 * /api/v1/auth/inactive-employers:
 *   get:
 *     summary: Get Inactive Employers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inactive employers list
 */
user.get(
  "/inactive-employers",
  authCheck,
  permission("admin"),
  authController.showInactiveemployers,
);

// Restore Inactive employers
/**
 * @swagger
 * /api/v1/auth/restore-employer/{id}:
 *   patch:
 *     summary: Restore Employer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employer restored successfully
 */
user.patch(
  "/restore-employer/:id",
  authCheck,
  permission("admin"),
  authController.restoreemployer,
);

module.exports = user;
