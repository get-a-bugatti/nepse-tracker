import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyJwt } from "../utils/verifyJwt.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers["Authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized.");
    }

    const decoded = await verifyJwt(token);

    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token.");
  }
});
