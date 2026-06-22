const mongoose = require("mongoose");

const saveJobSchema = new mongoose.Schema(
  {
    candidateID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    jobID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  },
  { timestamps: true, versionKey: false },
);

saveJobSchema.index(
  {
    candidateID: 1,
    jobID: 1,
  },
  { unique: true },
);

const SaveJob = mongoose.model("SaveJob", saveJobSchema);
module.exports = SaveJob;
