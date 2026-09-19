import mongoose, { Schema } from "mongoose";

const alertSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isTriggered: {
    type: Boolean,
    default: false,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  condition: {
    type: String,
    enum: ["ABOVE", "BELOW"],
    uppercase: true,
    trim: true,
    required: true,
  },
});

alertSchema.index({ userId: 1 });

alertSchema.index({
  symbol: 1,
  condition: 1,
  isTriggered: 1,
  targetPrice: 1,
});

alertSchema.pre("validate", async function (next) {
  try {
    // Only run when creating a new alert
    if (!this.isNew) return next();

    const share = await TargetShare.findOne(
      { symbol: this.symbol },
      { lastUpdatedPrice: 1 }
    ).lean();

    if (!share) {
      return next(new Error("Target share not found."));
    }

    const { lastUpdatedPrice } = share;

    const conditionAlreadyMet =
      (this.condition === "ABOVE" && lastUpdatedPrice >= this.targetPrice) ||
      (this.condition === "BELOW" && lastUpdatedPrice <= this.targetPrice);

    if (conditionAlreadyMet) {
      return next(
        new Error(
          `Cannot create alert. Current market price (${lastUpdatedPrice}) already satisfies the '${this.condition}' condition for target price ${this.targetPrice}.`
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
});
export const Alert = mongoose.model("Alert", alertSchema);
