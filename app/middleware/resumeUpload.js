const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const FILE_TYPE = ["pdf"];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUD_FOLDER,
    allowed_formats: FILE_TYPE,
    resource_type: "raw",
    public_id: (req, file) => {
      const originalName = file.originalname.split(".")[0].trim();
      const uniqueName = originalName.replace(/\s+/g, "_") + "_" + Date.now();

      return uniqueName;
    },
  },
});

const uploadResume = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

module.exports = uploadResume;
