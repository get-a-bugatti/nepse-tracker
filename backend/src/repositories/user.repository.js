import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export class UserRepository {
  // #standardProjection =
  //   "-password -refreshToken -accessToken -passwordResetOtp -passwordResetToken -telegramLinkToken -telegramLinkExpiry";
  // -------------------------------------------------------------
  // READ METHODS
  // -------------------------------------------------------------

  /**
   * Single parameter or optional object works cleanly here
   */
  async findAll({ projection } = {}) {
    let query = User.find();
    if (projection) query = query.select(projection);
    return await query.lean();
  }

  /**
   * Single required ID -> Keep simple positional parameter
   */
  async findById(id, { projection, returnType } = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("INVALID_ID_FORMAT");
    }

    let query = User.findById(id);
    if (projection) query = query.select(projection);

    if (returnType === "document") return await query;

    return await query.lean();
  }

  async findByEmailOrUsername(loginStr, { projection, returnType } = {}) {
    let query = await User.findOne({
      $or: [{ email: loginStr }, { username: loginStr }],
    });

    if (projection) query = query.select(projection);

    if (returnType === "document") return await query;
    return await query.lean();
  }

  async existsByUsername(username) {
    return await User.exists({ username });
  }

  async existsByEmail(email) {
    return await User.exists({ email });
  }

  // -------------------------------------------------------------
  // WRITE / UPDATE METHODS (Named Objects for multi-params)
  // -------------------------------------------------------------

  async create(userData) {
    const user = await User.create(userData);
    return user.toObject();
  }

  /**
   * Named object prevents mixing up accessToken and refreshToken
   */
  async updateTokens(userId, { accessToken, refreshToken }) {
    return await User.findByIdAndUpdate(
      userId,
      { accessToken, refreshToken },
      { new: true, runValidators: true }
    ).lean();
  }

  async unsetRefreshToken({ userId }) {
    return await User.findByIdAndUpdate(
      userId,
      { $unset: { refreshToken: 1 } },
      { new: true }
    ).lean();
  }

  /**
   * One function for all update fields
   */

  /**
   * Order no longer matters!
   */

  async updateFields(userId, { data }) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
  }
}

export const userRepository = new UserRepository();
