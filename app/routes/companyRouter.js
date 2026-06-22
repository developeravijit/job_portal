const express = require("express");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");
const companyController = require("../controller/companyController");

const company = express.Router();

// Create company
company.post(
  "/create-company",
  authCheck,
  permission("employeer", "admin"),
  companyController.createCompany,
);

// Create Job
company.post(
  "/create-job",
  authCheck,
  permission("employeer"),
  companyController.createJob,
);

// Create Interview
company.post(
  "/create-interview",
  authCheck,
  permission("employeer"),
  companyController.createInterview,
);

// Create Notification
company.post(
  "/create-notification",
  authCheck,
  permission("employeer"),
  companyController.createNotification,
);

// Show All Employeers and Companies
company.get(
  "/all-company",
  authCheck,
  permission("employeer", "admin"),
  companyController.showAllCompanies,
);

// Show Company by employeers
company.get(
  "/my-company",
  authCheck,
  permission("employeer", "admin"),
  companyController.showCompanyAsPerEmployeer,
);

// Employeers who do not created companies
company.get(
  "/no-comapny",
  authCheck,
  permission("employeer", "admin"),
  companyController.noCompaniesEmployeer,
);

module.exports = company;
