const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    candidateID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    jobID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },

    resume: {
      type: String,
    },

    public_id: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["submitted", "reviewing", "selected", "rejected"],
    },
  },
  { timestamps: true, versionKey: false },
);

applicationSchema.index(
  {
    candidateID: 1,
    jobID: 1,
  },
  { unique: true },
);

const Application = mongoose.model("Application", applicationSchema);
module.exports = Application;
