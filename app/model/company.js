const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    employeerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      unique: true,
    },

    website: {
      type: String,
      trim: true,
    },

    industry: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
