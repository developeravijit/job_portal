const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    subject: {
      type: String,
    },

    message: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({
  userID: 1,
  isRead: 1,
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
