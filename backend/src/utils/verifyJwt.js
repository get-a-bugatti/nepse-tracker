import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJwt = async (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const userId = decodedToken?._id;

    if (!userId) {
      throw new Error("Invalid access token.");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new Error("Invalid access token.");
    }

    return decodedToken;
  } catch (error) {
    throw new Error(error.message || "Error while verifying token.");
  }
};
