import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { userService } from "../services/user.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some((el) => !el || el.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const result = await userService.registerUser({
    fullName,
    username,
    email,
    password,
    avatarLocalPath,
    coverImageLocalPath,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully.", result));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  const { userObj, accessToken, refreshToken } = await userService.loginUser({
    login,
    password,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Logged in successfully.", {
        ...userObj,
        accessToken,
        refreshToken,
      })
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized.");
  }
  await userService.logoutUser({ userId });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully."));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Missing refresh token.");
  }

  const { accessToken, refreshToken } = await userService.refreshAccessToken(
    incomingRefreshToken
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Tokens renewed successfully.", {
        accessToken,
        refreshToken,
      })
    );
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User cannot be unauthenticated.");
  }

  if (
    [oldPassword, newPassword, confPassword].some(
      (el) => !el || String(el).trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  if (newPassword !== confPassword) {
    throw new ApiError(400, "Both Password fields must be same.");
  }

  await userService.updatePassword(userId, oldPassword, newPassword);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully.", {}));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized Access.");
  }

  const user = await userService.getCurrentUser(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully.", user));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email, fullName } = req.body;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof fullName !== "string"
  ) {
    throw new ApiError(400, "Invalid input type.");
  }

  if (!username.trim() || !email.trim() || !fullName.trim()) {
    throw new ApiError(400, "All fields are required.");
  }

  const updatedUser = await userService.updateAccountDetails(req.user?._id, {
    username,
    email,
    fullName,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Account details updated successfully", updatedUser)
    );
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not found.");
  }

  const user = await userService.updateUserImageFile(
    req.user?._id,
    avatarLocalPath,
    "avatar"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar Updated Successfully.", user));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file not found.");
  }

  const user = await userService.updateUserImageFile(
    req.user?._id,
    coverImageLocalPath,
    "coverImage"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image Updated Successfully.", user));
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully.", users));
});

export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User ID param is required.");
  }

  const user = await userService.getUserById(userId);
  return res.status(200).json(new ApiResponse(200, "User found.", user));
});

// const getUserByUsername = asyncHandler(async (req, res, next) => {
//   const { username } = req.body;

//   if (!username.trim() || typeof username !== "string") {
//     throw new ApiError(400, "Invalid Username.");
//   }

//   const users = await User.find({
//     username,
//   }).select("-password -refreshToken -otp -passwordReset");

//   if (!users) {
//     throw new ApiError(404, "Couldn't find user.");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, "Users fetched successfully.", users));
// });

export const forgotPassword = asyncHandler(async (req, res) => {
  const { login } = req.body;
  if (!login || !login.trim()) {
    throw new ApiError(400, "Missing Login.");
  }

  await userService.forgotPassword(login);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password Reset instructions sent successfully. Check Your Email.",
        {}
      )
    );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { login, otp } = req.body;
  if (!login || !login.trim()) throw new ApiError(400, "Missing Login.");
  if (!otp || !otp.trim()) throw new ApiError(400, "Missing OTP.");

  const resetToken = await userService.verifyOtp(login, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully.", { resetToken }));
});

export const setNewPassword = asyncHandler(async (req, res) => {
  const { login, resetToken, password, confirmPassword } = req.body;

  if (!resetToken || typeof resetToken !== "string") {
    throw new ApiError(400, "Missing or invalid reset token.");
  }
  if (!login || !login.trim()) throw new ApiError(400, "Missing Login.");

  if (!password || !confirmPassword)
    throw new ApiError(400, "Password and verification are required.");

  if (password.trim() !== confirmPassword.trim()) {
    throw new ApiError(400, "Passwords do not match.");
  }

  await userService.setNewPassword(login, resetToken, password);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully.", {}));
});

export const linkTelegram = asyncHandler(async (req, res) => {
  const result = await userService.linkTelegram(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Telegram linked successfully.", result));
});

export const getTelegramStatus = asyncHandler(async (req, res) => {
  const result = await userService.getTelegramStatus(req.user?._id);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Telegram status fetched successfully.", result)
    );
});

export const skipOnboardingTelegram = asyncHandler(async (req, res) => {
  const result = await userService.skipOnboardingTelegram(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, "Onboarding skipped successfully.", result));
});
