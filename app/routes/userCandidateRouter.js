const express = require("express");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");
const uploadResume = require("../middleware/resumeUpload");
const userCandidateController = require("../controller/userCandidateController");

const candidate = express.Router();

// Apply Job
/**
 * @swagger
 * tags:
 *   - name: Candidate
 *     description: Candidate APIs
 */
/**
 * @swagger
 * /api/v1/candidate/job/apply:
 *   post:
 *     summary: Apply for Job
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Job applied successfully
 */
candidate.post(
  "/job/apply",
  authCheck,
  permission("user"),
  userCandidateController.applyJob,
);

// Show Applied Jobs
/**
 * @swagger
 * /api/v1/candidate/job/applied:
 *   get:
 *     summary: Get Applied Jobs
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applied jobs list
 */
candidate.get(
  "/job/applied",
  authCheck,
  permission("user"),
  userCandidateController.showAppliedJobs,
);

// Save Job
/**
 * @swagger
 * /api/v1/candidate/job/save/{jobID}:
 *   post:
 *     summary: Save Job
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Job saved
 */
candidate.post(
  "/job/save/:jobID",
  authCheck,
  permission("user"),
  userCandidateController.saveJob,
);

// Show Saved Jobs
/**
 * @swagger
 * /api/v1/candidate/job/saved:
 *   get:
 *     summary: Get Saved Jobs
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs list
 */
candidate.get(
  "/job/saved",
  authCheck,
  permission("user"),
  userCandidateController.showSavedJobs,
);

module.exports = candidate;
