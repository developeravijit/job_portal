const Application = require("../model/application");
const Job = require("../model/job");
const Notification = require("../model/notification");
const SaveJob = require("../model/saveJob");
const fileCleaner = require("../utils/fileCleaner");
const httpCodes = require("../utils/httpCode");
const mongoose = require("mongoose");

class userCandidateController {
  // Apply Job
  async applyJob(req, res) {
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
        await fileCleaner(req.file);
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Resume is required",
        });
      }

      const alreadyApplied = await Application.findOne({
        candidateID,
        jobID,
      });

      if (alreadyApplied) {
        await fileCleaner(req.file);

        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "You have already applied for this job",
        });
      }

      const data = new Application({
        candidateID,
        jobID,
        resume: req.file.path,
        public_id: req.file.filename,
        status: "submitted",
      });

      await data.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Job applied successfully",
        data,
      });
    } catch (error) {
      await fileCleaner(req.file);
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Applied Jobs
  async showAppliedJobs(req, res) {
    try {
      const limit = Number(req.query.limit) || 3;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const candidateID = req.user.id;

      const totalItems = await Application.countDocuments({
        candidateID: new mongoose.Types.ObjectId(candidateID),
      });

      const saveJob = await Application.aggregate([
        {
          $match: {
            candidateID: new mongoose.Types.ObjectId(candidateID),
          },
        },

        {
          $lookup: {
            from: "jobs",
            localField: "jobID",
            foreignField: "_id",
            as: "job",
          },
        },

        { $unwind: "$job" },

        {
          $lookup: {
            from: "users",
            localField: "job.employerID",
            foreignField: "_id",
            as: "employer",
          },
        },

        {
          $unwind: {
            path: "$employer",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            saveAt: "$createdAt",
            status: 1,

            jobID: "$job._id",
            title: "$job.title",
            salary: "$job.salary",
            location: "$job.location",
            skills: "$job.skills",

            employerName: "$employer.name",
          },
        },

        { $sort: { saveAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);

      const pageCount = Math.max(1, Math.ceil(totalItems / limit));

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Applied jobs details",
        data: {
          jobs: saveJob,
          pages: paginate.getArrayPages(req)(5, pageCount, page),
          pageCount,
          itemCount: totalItems,
          currentPage: page,
        },
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

      const job = await Job.findById(jobID);

      if (!job) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Job not found",
        });
      }

      const alreadySaved = await SaveJob.findOne({
        candidateID,
        jobID,
      });

      if (alreadySaved) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Job already saved",
        });
      }

      const data = new SaveJob({
        candidateID,
        jobID,
      });

      await data.save();

      return res.status(httpCodes.ok).json({
        success: false,
        message: "Job saved successfully",
        data,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Show Saved Jobs
  async showSavedJobs(req, res) {
    try {
      const limit = Number(req.query.limit) || 3;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const candidateID = new mongoose.Types.ObjectId(req.user.id);

      const totalItems = await SaveJob.countDocuments({
        candidateID,
      });

      const saveJob = await SaveJob.aggregate([
        {
          $match: {
            candidateID,
          },
        },
        {
          $lookup: {
            from: "jobs",
            localField: "jobID",
            foreignField: "_id",
            as: "job",
          },
        },
        {
          $unwind: "$job",
        },
        {
          $lookup: {
            from: "users",
            localField: "job.employerID",
            foreignField: "_id",
            as: "employer",
          },
        },
        {
          $unwind: {
            path: "$employer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            saveAt: "$createdAt",

            jobID: "$job._id",
            title: "$job.title",
            salary: "$job.salary",
            location: "$job.location",
            skills: "$job.skills",

            employerID: "$employer._id",
            employerName: "$employer.name",
          },
        },
        {
          $sort: {
            saveAt: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const pageCount = Math.max(1, Math.ceil(totalItems / limit));

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Saved jobs details",
        data: {
          jobs: saveJob,
          pages: paginate.getArrayPages(req)(5, pageCount, page),
          pageCount,
          itemCount: totalItems,
          currentPage: page,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userCandidateController();
