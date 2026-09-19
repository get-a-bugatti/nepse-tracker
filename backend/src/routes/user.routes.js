import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getAllUsers,
  getUserById,
  forgotPassword,
  updatePassword,
  updateAvatar,
  updateAccountDetails,
  updateCoverImage,
  verifyOtp,
  setNewPassword,
  linkTelegram,
  getTelegramStatus,
  skipOnboardingTelegram,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/signup").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// Auth
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-otp").post(verifyOtp);
router.route("/set-new-password").post(setNewPassword);
router.route("/logout").get(requireAuth, logoutUser);
router.route("/refresh-tokens").get(refreshAccessToken);

// Me
router.route("/me").get(requireAuth, getCurrentUser); // FIX : There is an extra useless API Call.
router.route("/me/password").patch(requireAuth, updatePassword);
router
  .route("/me/avatar")
  .patch(requireAuth, upload.single("avatar"), updateAvatar);
router
  .route("/me/cover-image")
  .patch(requireAuth, upload.single("coverImage"), updateCoverImage);
router.route("/me/account-details").patch(requireAuth, updateAccountDetails);

router.route("/all").get(requireAuth, getAllUsers);

// Telegram :
router.route("/telegram/link").post(requireAuth, linkTelegram);
router.route("/telegram/status").get(requireAuth, getTelegramStatus);
router.route("/telegram/skip").post(requireAuth, skipOnboardingTelegram);

// router.route("/search").post(requireAuth, getUserByUsername);
// router.route("/others").get(requireAuth, getAllOtherUsers);

router.route("/:userId").get(requireAuth, getUserById);

export default router;
