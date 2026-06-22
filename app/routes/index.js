const express = require("express");
const user = require("./userRouter");
const company = require("./companyRouter");
const dashboard = require("./dashboardRoutes/dashboardRouter");
const admin = require("./adminDashboardRoutes/adminRouter");
const jobApplication = require("./jobApplicationRouter");
const employeer = require("./dashboardRoutes/employeerRouter");
const candidate = require("./dashboardRoutes/candidateRouter");

const router = express.Router();

const cloudinary = require("../config/cloudinary");

// Users
router.use("/api/v1/user", user);

// Company
router.use("/api/v1/company", company);

// Job Application
router.use("/api/application", jobApplication);

// Dashboard
router.use("/dashboard", dashboard);

// Employeer Dashboard Pages
router.use("/employeer", employeer);

// Candidate Dashboard Pages
router.use("/candidate", candidate);

// Admin Dashboard
router.use("/admin", admin);

module.exports = router;
