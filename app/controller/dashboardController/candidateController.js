const mongoose = require("mongoose");
const Job = require("../../model/job");
const httpCodes = require("../../utils/httpCode");
const Application = require("../../model/application");
const fileCleaner = require("../../utils/fileCleaner");
const SaveJob = require("../../model/saveJob");
const paginate = require("express-paginate");
const User = require("../../model/user");

class candidateController {
  // Update Candidate Profile Page
  async profilePage(req, res) {
    try {
      const user = await User.findById(req.user.id);

      res.render("candidateProfile", {
        user,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  async updateProfilePage(req, res) {
    try {
      const user = await User.findById(req.user.id);

      res.render("candidateUpdateProfile", {
        user,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        fileCleaner(req.file);
        return res.status(httpCodes.not_found).render("500", {
          error: "User not found",
        });
      }

      if (!user.status) {
        fileCleaner(req.file);
        return res.status(httpCodes.unauthorized).render("500", {
          error: "Your profile is not active",
        });
      }

      const { name, phone } = req.body;

      user.name = name;
      user.phone = phone;

      if (req.file) {
        user.avatar = req.file.path;
        user.public_id = req.file.filename;
      }

      await user.save();

      return res.redirect("/candidate/profile");
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Save Job Page
  async saveJobPage(req, res) {
    try {
      const limit = req.query.limit || 3;
      const page = req.query.page || 1;
      const skip = (page - 1) * limit;

      const candidateID = req.user.id;

      const totalItems = await SaveJob.countDocuments({
        candidateID,
      });

      const saveJob = await SaveJob.aggregate([
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
            localField: "job.employeerID",
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
          $project: {
            _id: 1,
            saveAt: "$createdAt",

            jobID: "$job._id",
            title: "$job.title",
            salary: "$job.salary",
            location: "$job.location",
            skills: "$job.skills",

            employeerName: "$employeer.name",
          },
        },

        { $sort: { saveAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);

      const pageCount = Math.ceil(totalItems / limit);

      return res.render("saveJobs", {
        jobs: saveJob,
        pages: paginate.getArrayPages(req)(5, pageCount, page),
        pageCount,
        itemCount: totalItems,
        currentPage: Number(page),
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Apply Job
  async applyJob(req, res) {
    try {
      const candidateID = req.user.id;

      const { jobID } = req.params;

      const jobData = await Job.findById(jobID);

      if (!jobData) {
        await fileCleaner(req.file);
        return res.status(httpCodes.not_found).render("500", {
          error: "Job not found",
        });
      }

      if (!req.file) {
        return res.status(httpCodes.bad_request).render("500", {
          error: "Resume is required",
        });
      }

      const alreadyApplied = await Application.findOne({
        candidateID,
        jobID,
      });

      if (alreadyApplied) {
        await fileCleaner(req.file);

        return res.status(httpCodes.bad_request).render("500", {
          error: "You have already applied for this job",
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

      return res.redirect(`/dashboard/user/home?jobId=${jobID}`);
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
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
        return res.status(httpCodes.bad_request).render("500", {
          error: "Job not found",
        });
      }

      const alreadySaved = await SaveJob.findOne({
        candidateID,
        jobID,
      });

      if (alreadySaved) {
        return res.redirect("/candidate/jobs");
      }

      const data = new SaveJob({
        candidateID,
        jobID,
      });

      await data.save();

      return res.redirect(`/dashboard/user/home?jobId=${jobID}`);
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }
}

module.exports = new candidateController();
