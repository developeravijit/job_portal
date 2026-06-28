const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
