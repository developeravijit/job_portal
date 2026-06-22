const cloudinary = require("../config/cloudinary");

const fileCleaner = async (file) => {
  if (file?.filename) {
    try {
      await cloudinary.uploader.destroy(file.filename, {
        resource_type: "raw",
      });
    } catch (error) {
      console.log(`Image Cleaner error:- ${error.message}`);
    }
  }
};

module.exports = fileCleaner;
