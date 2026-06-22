const Application = require("../model/application");
const Job = require("../model/job");
const Notification = require("../model/notification");
const SaveJob = require("../model/saveJob");
const fileCleaner = require("../utils/fileCleaner");
const httpCodes = require("../utils/httpCode");

class userJobApplicationController {
  // Apply For Job
  async createJobApplication(req, res) {
    try {
      const candidateID = req.user.id;

      const { jobID } = req.params;

      const jobData = await Job.findById(jobID);

      if (!jobData) {
        await fileCleaner(req.file);
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Job not found",
        });
      }

      if (!req.file) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Resume is required",
        });
      }

      const existingApplication = await Application.findOne({
        candidateID,
        jobID,
      });

      if (existingApplication) {
        await fileCleaner(req.file);
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "You have already applied for this job",
        });
      }

      const applicationData = new Application({
        candidateID,
        jobID,
        resume: req.file.path,
        public_id: req.file.filename,
        status: "submitted",
      });

      const data = await applicationData.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Job application submitted successfully",
        data: data,
      });
    } catch (error) {
      await fileCleaner(req.file);
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show All Jobs
  async findJob(req, res) {
    try {
      const jobs = await Job.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "employeerID",
            foreignField: "_id",
            as: "employeer",
          },
        },
        {
          $unwind: {
            path: "$employeer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            skills: 1,
            salary: 1,
            location: 1,
            createdAt: 1,
            employeerName: "$employeer.name",
            employeerEmail: "$employeer.email",
            employeerPhone: "$employeer.phone",
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All Job Details",
        totalJobs: jobs.length,
        data: jobs,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Save Job
  async saveJob(req, res) {
    try {
      const candidateID = req.user.id;
      const { jobID } = req.params;

      const jobData = await Job.findById(jobID);

      if (!jobData) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Job not found",
        });
      }

      const existingSaveJob = await SaveJob.findOne({ candidateID, jobID });

      if (existingSaveJob) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Job already saved",
        });
      }

      const saveJobData = new SaveJob({
        candidateID,
        jobID,
      });

      const data = await saveJobData.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Job saved successfully",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  async showNotification(req, res) {
    try {
      const userID = req.user.id;

      const data = await Notification.find({ userID });

      if (!data || data.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "No notification found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All Notifications",
        data: {
          totalNotifications: data.length,
          data,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  async readNotification(req, res) {
    try {
      const { notificationID } = req.params;

      const data = await Notification.findByIdAndUpdate(
        {
          _id: notificationID,
          userID: req.user.id,
        },
        {
          isRead: true,
        },
        {
          new: true,
        },
      );

      if (!data) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Notification marked as read",
        data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userJobApplicationController();
