import { Alert } from "../models/alert.model";
import { scraperService } from "../services/scraper.service";
import ApiResponse from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createAlert = asyncHandler(async (req, res, next) => {
  const { symbol, targetPrice, condition } = req.body;

  const userId = req.user?._id;

  const newAlert = new Alert.create({
    userId,
    symbol,
    targetPrice,
    condition: condition?.toUpperCase(),
  });

  const targetShareExists = await TargetShare.findOne({
    symbol: symbol,
  });

  if (!targetShareExists) {
    const targetShareData = await scraperService.fetchLivePrices();
  }

  return res.json(
    new ApiResponse(200, "Alert created successfully.", {
      alertId: newAlert._id,
    })
  );
});
