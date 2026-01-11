const userService = require("./users.service");

exports.getMe = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.status(200).json({ status: "success", data: user });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ status: "success", data: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    const result = await userService.deleteAccount(req.user.id);
    res.clearCookie("refreshToken"); // Clear session on delete
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res
      .status(200)
      .json({ status: "success", results: users.length, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
