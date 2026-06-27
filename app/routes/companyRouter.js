const express = require("express");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");
const companyController = require("../controller/companyController");

const company = express.Router();

// Create company
/**
 * @swagger
 * tags:
 *   - name: Employer
 *     description: Employer APIs
 */
/**
 * @swagger
 * /api/v1/employer/create-company:
 *   post:
 *     summary: Create Company
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Company created successfully
 */
company.post(
  "/create-company",
  authCheck,
  permission("employer"),
  companyController.createCompany,
);

// Show Company
/**
 * @swagger
 * /api/v1/employer/company:
 *   get:
 *     summary: Show Company
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company details
 */
company.get(
  "/company",
  authCheck,
  permission("employer"),
  companyController.showCompany,
);

// Edit Company
/**
 * @swagger
 * /api/v1/employer/edit/company/{id}:
 *   patch:
 *     summary: Update Company
 *     tags: [Employer]
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
 *         description: Company updated successfully
 */
company.patch(
  "/edit/company/:id",
  authCheck,
  permission("employeer"),
  companyController.editCompany,
);

// Create Job
/**
 * @swagger
 * /api/v1/employer/create-job:
 *   post:
 *     summary: Create Job
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Job created
 */
company.post(
  "/create-job",
  authCheck,
  permission("employer"),
  companyController.createJob,
);

// Show Jobs
/**
 * @swagger
 * /api/v1/employer/jobs:
 *   get:
 *     summary: Get All Jobs
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job list
 */
company.get(
  "/jobs",
  authCheck,
  permission("employeer"),
  companyController.showJobs,
);

// Edit job
/**
 * @swagger
 * /api/v1/employer/edit/job/{id}:
 *   patch:
 *     summary: Update Job
 *     tags: [Employer]
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
 *         description: Job updated
 */
company.patch(
  "/edit/job/:id",
  authCheck,
  permission("employeer"),
  companyController.editJob,
);

// Create Interview
/**
 * @swagger
 * /api/v1/employer/create-interview:
 *   post:
 *     summary: Create Interview
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Interview created
 */
company.post(
  "/create-interview",
  authCheck,
  permission("employer"),
  companyController.createInterview,
);

// Change Application Status
/**
 * @swagger
 * /api/v1/employer/change-status:
 *   post:
 *     summary: Change Candidate Status
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status changed
 */
company.post(
  "/change-status",
  authCheck,
  permission("employeer"),
  companyController.applicationStatus,
);

// Send Notification
/**
 * @swagger
 * /api/v1/employer/send-notification:
 *   post:
 *     summary: Send Notification
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Notification sent
 */
company.post(
  "/send-notification",
  authCheck,
  permission("employer"),
  companyController.sendNotification,
);

module.exports = company;
