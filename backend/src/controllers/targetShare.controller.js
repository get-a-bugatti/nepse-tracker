import { asyncHandler } from "../utils/asyncHandler";
import { urls } from "../constants";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { scraperService } from "../services/scraper.service.js";

import axios from "axios";

const createTargetShare = asyncHandler(async (req, res, next) => {
  const { symbol } = req.body;

  if (!targetShare) {
    throw new ApiError(400, "Missing targetShare.");
  }
});
