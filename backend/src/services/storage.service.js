// Handles all storage related actions (cloud-storage, local-disk, etc.)

import fs from "fs";

class Storage {
  async uploadOnCloudinary(localFilePath) {
    try {
      if (!localFilePath) return null;

      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "image",
      });

      // console.log("File is successfully uploaded on cloudinary.", response.url);

      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return response;
    } catch (error) {
      fs.unlinkSync(localFilePath);

      throw new Error(error.message);
    }
  }
}

export const storageService = new Storage();
