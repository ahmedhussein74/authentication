const authService = require("./auth.service");
const sendEmail = require("../../utils/email");

// 1. REGISTER
exports.register = async (req, res) => {
  try {
    const vToken = await authService.register(req.body);
    const url = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify-email/${vToken}`;
    await sendEmail({
      email: req.body.email,
      subject: "Verify Email",
      message: `Click here to verify: ${url}`,
    });
    res.status(201).json({ message: "Register success. Check email." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.json({ accessToken: data.accessToken, user: data.user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// 3. LOGOUT
exports.logout = async (req, res) => {
  try {
    const Auth = require("./auth.model");
    await Auth.findOneAndUpdate({ user: req.user.id }, { refreshToken: null });
    res.clearCookie("refreshToken").json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. REFRESH TOKEN
exports.refresh = async (req, res) => {
  try {
    const tokens = await authService.refresh(req.cookies.refreshToken);
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    res.status(401).json({ message: "Session expired" });
  }
};

// 5. EMAIL VERIFICATION
exports.verifyEmail = async (req, res) => {
  try {
    await authService.verifyEmail(req.params.token);
    res.json({ message: "Verified!" });
  } catch (err) {
    res.status(400).json({ message: "Token invalid" });
  }
};

exports.resendEmail = async (req, res) => {
  try {
    const vToken = await authService.generateResendToken(req.body.email);
    const url = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify-email/${vToken}`;
    await sendEmail({
      email: req.body.email,
      subject: "Verify Email",
      message: `Click here to verify: ${url}`,
    });
    res.json({ message: "Email sent" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 6. PASSWORD MANAGEMENT (The missing pieces)
exports.changePassword = async (req, res) => {
  try {
    await authService.changePassword(
      req.user.id,
      req.body.oldPassword,
      req.body.newPassword
    );
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const token = await authService.forgotPassword(req.body.email);
    const url = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${token}`;
    await sendEmail({
      email: req.body.email,
      subject: "Password Reset",
      message: `Reset your password here: ${url}`,
    });
    res.json({ message: "Reset email sent" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 7. SOCIAL AUTH SUCCESS
exports.socialSuccess = (req, res) => {
  res.cookie("refreshToken", req.user.refreshToken, {
    httpOnly: true,
    secure: true,
  });
  res.redirect(
    `${process.env.FRONTEND_URL}/success?token=${req.user.accessToken}`
  );
};
