import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // e.g., "NABIL"
      unique: true,
    },
    securityId: {
      type: Number,
      unique: true,
      required: true, // e.g., 137
    },
    lastUpdatedPrice: {
      type: Number,
      required: true, // Closing price / LTP
    },
    lastUpdatedAt: {
      type: Date,
      required: true,
    },
    lastCheckedAt: {
      type: Date,
      required: true,
    },
    watcherCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

shareSchema.index(
  { isActive: 1 },
  { partialFilterExpression: { isActive: true } }
);

export const TargetShare = mongoose.model(
  "TargetShare",
  shareSchema,
  "target_share"
);
