const User = require("./users.model");
const Auth = require("../auth/auth.model");

class UserService {
  // Get profile of the currently logged-in user
  async getUserProfile(userId) {
    const user = await User.findById(userId).populate({
      path: "auth",
      select: "email isVerified", // Only pull non-sensitive auth data
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  // Update profile details (Non-sensitive)
  async updateProfile(userId, updateData) {
    // Prevent role or auth-link from being changed via this method
    const allowedUpdates = ["firstName", "lastName", "avatar"];
    const filteredData = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) filteredData[key] = updateData[key];
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  // Admin: Get all users
  async getAllUsers() {
    return await User.find().populate("auth", "email isVerified");
  }

  // Complete Account Deletion
  async deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 1. Delete associated Auth record
    await Auth.findByIdAndDelete(user.auth);

    // 2. Delete User profile
    await User.findByIdAndDelete(userId);

    return { message: "Account and associated data deleted successfully" };
  }
}

module.exports = new UserService();
