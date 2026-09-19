import mongoose from "mongoose";
import { DB_NAME, APP_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    // Replace with your actual connection string or process.env.MONGODB_URI
    const mongoUri =
      `${process.env.MONGODB_URI}/${DB_NAME}?appName=${APP_NAME}` ||
      "mongodb://localhost:24017/mydatabase";

    const connectionInstance = await mongoose.connect(mongoUri);

    console.log(
      `📡 MongoDB Connected! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    // Exit process with failure code if connection fails
    process.exit(1);
  }
};
