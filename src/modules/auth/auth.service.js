const Auth = require("./auth.model");
const User = require("../users/users.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class AuthService {
  // Token Helper
  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
  }

  // 1. Register + Auto-Verify Email Trigger
  async register(data) {
    const existing = await Auth.findOne({ email: data.email });
    if (existing) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const vToken = crypto.randomBytes(32).toString("hex");

    const auth = new Auth({
      email: data.email,
      password: hashedPassword,
      verificationToken: vToken,
    });
    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      auth: auth._id,
    });

    auth.user = user._id;
    await auth.save();
    await user.save();
    return vToken; // Returned to controller to send the email
  }

  // 2. Login
  async login(email, password) {
    const auth = await Auth.findOne({ email }).populate("user");
    if (
      !auth ||
      !auth.password ||
      !(await bcrypt.compare(password, auth.password))
    )
      throw new Error("Invalid credentials");
    if (!auth.isVerified) throw new Error("Email not verified");

    const tokens = this.generateTokens(auth.user);
    auth.refreshToken = tokens.refreshToken;
    await auth.save();
    return { user: auth.user, ...tokens };
  }

  // 3. Refresh Token (Rotation)
  async refresh(token) {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const auth = await Auth.findOne({
      user: decoded.id,
      refreshToken: token,
    }).populate("user");
    if (!auth) throw new Error("Session invalid");

    const tokens = this.generateTokens(auth.user);
    auth.refreshToken = tokens.refreshToken;
    await auth.save();
    return tokens;
  }

  // 4. Verify & Resend
  async verifyEmail(token) {
    const auth = await Auth.findOne({ verificationToken: token });
    if (!auth) throw new Error("Invalid or expired token");
    auth.isVerified = true;
    auth.verificationToken = undefined;
    await auth.save();
  }

  async generateResendToken(email) {
    const auth = await Auth.findOne({ email, isVerified: false });
    if (!auth) throw new Error("Account verified or not found");
    const vToken = crypto.randomBytes(32).toString("hex");
    auth.verificationToken = vToken;
    await auth.save();
    return vToken;
  }

  // 5. Password Logic
  async changePassword(userId, oldPass, newPass) {
    const auth = await Auth.findOne({ user: userId });
    if (!(await bcrypt.compare(oldPass, auth.password)))
      throw new Error("Old password wrong");
    auth.password = await bcrypt.hash(newPass, 12);
    auth.refreshToken = null; // Logout other devices
    await auth.save();
  }

  async forgotPassword(email) {
    const auth = await Auth.findOne({ email });
    if (!auth) throw new Error("User not found");
    const token = crypto.randomBytes(32).toString("hex");
    auth.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    auth.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await auth.save();
    return token;
  }

  // 6. Social Login (Google, Github, Apple)
  async socialLogin(profile) {
    let auth = await Auth.findOne({
      [`${profile.provider}Id`]: profile.id,
    }).populate("user");
    if (!auth) {
      auth = await Auth.findOne({ email: profile.email }).populate("user");
      if (auth) {
        auth[`${profile.provider}Id`] = profile.id;
      } else {
        auth = new Auth({
          email: profile.email,
          [`${profile.provider}Id`]: profile.id,
          isVerified: true,
        });
        const user = new User({
          firstName: profile.firstName,
          lastName: profile.lastName,
          auth: auth._id,
        });
        auth.user = user._id;
        await auth.save();
        await user.save();
        auth.user = user;
      }
    }
    const tokens = this.generateTokens(auth.user);
    auth.refreshToken = tokens.refreshToken;
    await auth.save();
    return tokens;
  }
}

module.exports = new AuthService();
