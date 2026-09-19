import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      select: false,
    },

    passwordResetOtp: {
      // password reset OTP
      pinHash: {
        type: String,
        default: null,
        select: false,
      },
      expiresAt: {
        type: Date,
        default: null,
        select: false,
      },
    },

    passwordResetToken: {
      // password resetToken
      tokenHash: {
        type: String,
        default: null,
        select: false,
      },
      expiresAt: {
        type: Date,
        default: null,
        select: false,
      },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    telegram: {
      chatId: String,
      username: String,
      linked: {
        type: Boolean,
        default: false,
      },
    },
    telegramLinkToken: {
      type: String,
      default: null,
      select: false,
    },

    telegramLinkExpiry: {
      type: Date,
      default: null,
      select: false,
    },

    onboarding: {
      telegramCompleted: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// access tokens
userSchema.methods.generateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// password Reset Otp
userSchema.pre("save", async function () {
  if (!this.isModified("passwordResetOtp.pinHash")) return;

  if (!this.passwordResetOtp.pinHash) return;

  this.passwordResetOtp.pinHash = await bcrypt.hash(
    this.passwordResetOtp.pinHash,
    10
  );
});

userSchema.methods.setOtp = async function (pin) {
  this.passwordResetOtp.pinHash = pin;
  this.passwordResetOtp.expiresAt = new Date(Date.now() + 60000 * 10);

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetOtp = async function () {
  this.passwordResetOtp.pinHash = null;
  this.passwordResetOtp.expiresAt = null;

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.isOtpValid = async function (pin) {
  if (!this.passwordResetOtp || !this.passwordResetOtp.pinHash) return false;

  const isValid =
    (await bcrypt.compare(pin, this.passwordResetOtp.pinHash)) &&
    this.passwordResetOtp.expiresAt > Date.now();

  return isValid;
};

// password Reset Token
userSchema.pre("save", async function () {
  if (!this.isModified("passwordResetToken.tokenHash")) return;

  if (!this.passwordResetToken.tokenHash) return;

  this.passwordResetToken.tokenHash = await bcrypt.hash(
    this.passwordResetToken.tokenHash,
    10
  );
});

userSchema.methods.setPasswordResetToken = async function (token) {
  this.passwordResetToken.tokenHash = token;
  this.passwordResetToken.expiresAt = new Date(Date.now() + 60000 * 10);

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetPasswordResetToken = async function () {
  this.passwordResetToken.tokenHash = null;
  this.passwordResetToken.expiresAt = null;

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.isResetTokenValid = async function (token) {
  if (!this.passwordResetToken.tokenHash || !this.passwordResetToken.expiresAt)
    return false;

  return (
    (await bcrypt.compare(token, this.passwordResetToken.tokenHash)) &&
    this.passwordResetToken.expiresAt > Date.now()
  );
};

export const User = new mongoose.model("User", userSchema);
