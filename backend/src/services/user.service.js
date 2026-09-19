import { userRepository } from "../repositories/user.repository.js";
import { storageService } from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/nodemailer.js";

class UserService {
  async generateTokens({ user }) {
    try {
      const accessToken = await user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken();

      await userRepository.updateTokens(user._id, {
        accessToken,
        refreshToken,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
  }

  async registerUser({
    fullName,
    username,
    email,
    password,
    avatarLocalPath,
    coverImageLocalPath,
  }) {
    const usernameCheck = await userRepository.existsByUsername(username);
    if (usernameCheck) throw new ApiError(400, "Username unavailable.");

    const emailCheck = await userRepository.existsByEmail(email);
    if (emailCheck) throw new ApiError(400, "Email unavailable.");

    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required.");
    const avatar = await storageService.uploadOnCloudinary(avatarLocalPath);

    let coverImage = null;
    if (coverImageLocalPath) {
      const uploadedCover = await storageService.uploadOnCloudinary(
        coverImageLocalPath
      );
      coverImage = uploadedCover?.url || null;
    }

    const userData = {
      fullName,
      username,
      email,
      password,
      avatar: avatar.url,
      ...(coverImage && { coverImage }),
    };

    const createdUser = await userRepository.create(userData);

    delete createdUser.password;
    delete createdUser.__v;
    return createdUser;
  }

  async loginUser({ login, password }) {
    const user = await userRepository.findByEmailOrUsername(login.trim(), {
      returnType: "document",
    });
    if (!user) throw new ApiError(404, "User does not exist.");

    const isPasswordCorrect = await user.isPasswordCorrect(password.trim());
    if (!isPasswordCorrect) throw new ApiError(403, "Invalid Password.");

    const { accessToken, refreshToken } = await this.generateTokens({ user });

    const userObj = user.toObject();

    return { userObj, accessToken, refreshToken };
  }

  async logoutUser({ userId }) {
    await userRepository.unsetRefreshToken(userId);
  }

  async updatePassword({ userId, oldPassword, newPassword }) {
    const targetUser = await userRepository.findById(userId, {
      returnType: "document",
    });
    if (!targetUser) throw new ApiError(404, "User not found.");

    const isPasswordCorrect = await targetUser.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid Old Password.");
    }

    const isOldAndNewPassSame = await targetUser.isPasswordCorrect(newPassword);
    if (isOldAndNewPassSame) {
      throw new ApiError(403, "New password cannot be same as old password.");
    }

    await userRepository.setFields({ userId, data: { password: newPassword } });
  }

  async getCurrentUser({ userId }) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "Couldn't find user.");
    }
    return user;
  }
  async refreshAccessToken({ incomingRefreshToken }) {
    let decodedToken;
    try {
      decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch (error) {
      throw new ApiError(401, "Expired or invalid refresh token.");
    }

    const user = await userRepository.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(400, "Refresh Token is expired or used.");
    }

    // Reuse your existing generateTokens service method
    const { accessToken, refreshToken } = await this.generateTokens(user);
    return { accessToken, refreshToken };
  }

  async updatePassword({ userId, oldPassword, newPassword }) {
    const targetUser = await userRepository.findById(userId, {
      returnType: "document",
    });
    if (!targetUser) throw new ApiError(404, "User not found.");

    const isPasswordCorrect = await targetUser.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid Old Password.");
    }

    const isOldAndNewPassSame = await targetUser.isPasswordCorrect(newPassword);
    if (isOldAndNewPassSame) {
      throw new ApiError(403, "New password cannot be same as old password.");
    }

    await userRepository.updatePassword(userId, newPassword);
  }

  async getCurrentUser({ userId }) {
    const projection = "-password -refreshToken -otp -passwordReset";
    const user = await userRepository.findByIdWithProjection(
      userId,
      projection
    );

    if (!user) {
      throw new ApiError(404, "Couldn't find user.");
    }
    return user;
  }

  async updateAccountDetails({ userId, username, email, fullName }) {
    const updatedUser = await userRepository.updateFields(
      String(userId).trim(),
      {
        data: {
          fullName: String(fullName).trim(),
          email: String(email).trim(),
          username: String(username).trim(),
        },
      }
    );

    if (!updatedUser) throw new ApiError(404, "User not found.");
    return updatedUser;
  }

  // Generalized helper method to process file uploads, clean local disk, and save to DB
  async updateUserImageFile({ userId, localPath, fieldName }) {
    try {
      const uploadResult = await storageService.uploadOnCloudinary(localPath);
      if (!uploadResult?.url) {
        throw new ApiError(
          400,
          `Failed to upload ${fieldName} to cloud storage.`
        );
      }

      const updatedUser = await userRepository.updateSingleField({
        userId,
        fieldName,
        value: uploadResult.url,
        projection: "-password",
      });

      return updatedUser;
    } finally {
      // Always cleanup local files regardless of success or database failure
      if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  }

  async getAllUsers({ projection } = {}) {
    return await userRepository.findAll({ projection });
  }

  async getUserById(userId, { projection, returnType } = {}) {
    const isIdValid = await userRepository.isValidId(userId);
    if (!isIdValid) throw new ApiError(400, "Invalid ID format.");

    const user = await userRepository.findById(userId, {
      projection,
      returnType,
    });
    if (!user) throw new ApiError(404, "Couldn't find user.");

    return user;
  }

  async forgotPassword({ login }) {
    const user = await userRepository.findByEmailOrUsername(login.trim(), {
      returnType: "document",
    });
    if (!user) throw new ApiError(404, "Couldn't find user.");

    const resetToken = crypto.randomBytes(32).toString("hex").substring(0, 6);
    await user.setOtp(resetToken);
    await sendEmail(user.email, resetToken);
  }

  async verifyOtp({ login, otp }) {
    const user = await userRepository.findByEmailOrUsername(login.trim(), {
      returnType: "document",
    });
    if (!user) throw new ApiError(404, "Couldn't find user.");

    const isOtpValid = await user.isOtpValid(otp.trim());
    if (!isOtpValid) throw new ApiError(400, "Invalid or expired OTP.");

    await user.resetOtp();
    const resetToken = crypto.randomBytes(32).toString("hex");
    await user.setPasswordResetToken(resetToken);

    return resetToken;
  }

  async setNewPassword({ login, resetToken, password }) {
    const user = await userRepository.findByEmailOrUsername(login.trim());
    if (!user) throw new ApiError(404, "Couldn't find user.");

    const isTokenValid = await user.isResetTokenValid(resetToken);
    if (!isTokenValid)
      throw new ApiError(400, "Invalid or expired reset token.");

    user.password = password.trim();
    await user.save({ validateBeforeSave: false });
  }

  async linkTelegram({ userId }) {
    const token = crypto.randomBytes(16).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const response = await userRepository.setFields({
      userId,
      data: { telegramLinkToken: token, telegramLinkExpiry: expiry },
    });
    if (!response) throw new ApiError(404, "User not found.");

    const botName = process.env.TELEGRAM_BOT_NAME;

    if (!botName)
      throw new Error("TELEGRAM_BOT_NAME is not defined in env files.");

    return {
      userId: response._id,
      telegramLink: `https://t.me/${botName}?start=${token}`,
    };
  }

  async getTelegramStatus({ userId }) {
    const response = await userRepository.findById(userId);
    if (!response) throw new ApiError(404, "User not found.");

    return {
      linked: !!response.telegram?.linked,
    };
  }

  async skipOnboardingTelegram({ userId }) {
    const response = await userRepository.setFields({
      userId,
      data: { "onboarding.telegramCompleted": true },
    });
    if (!response) throw new ApiError(404, "User not found.");

    return {
      userId: response._id,
      next: "/",
    };
  }
}

export const userService = new UserService();
