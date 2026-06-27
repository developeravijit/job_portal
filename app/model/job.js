const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
    },

    description: {
      type: String,
    },

    skills: {
      type: String,
    },

    salary: {
      type: String,
    },

    location: {
      type: String,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
