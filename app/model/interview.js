const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    applicationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },

    date: {
      type: Date,
    },

    time: {
      type: String,
    },

    meetingLink: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

const Interview = mongoose.model("Interview", interviewSchema);
module.exports = Interview;
