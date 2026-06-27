const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [20, "Name can not be greater than 20 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },

    phone: {
      type: Number,
    },

    role: {
      type: String,
      enum: ["user", "employer", "admin"],
      default: "user",
    },

    avatar: {
      type: String,
      default: "",
    },

    public_id: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
      default: null,
    },

    resetPassword: {
      type: String,
      default: null,
      select: false,
    },

    status: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
