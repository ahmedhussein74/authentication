const router = require("express").Router();
const authController = require("./auth.controller");
const passport = require("passport");
const { protect } = require("../../middlewares/auth.middleware");
const { loginLimiter } = require("../../middlewares/limiter.middleware");

// Standard
router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh", authController.refresh);

// Verification & Passwords
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", authController.resendEmail);
router.patch("/change-password", protect, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

// Social
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.socialSuccess
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  authController.socialSuccess
);

// Apple Fix: Must handle POST
router.get("/apple", passport.authenticate("apple"));
router.post(
  "/apple/callback",
  passport.authenticate("apple", { session: false }),
  authController.socialSuccess
);

module.exports = router;
