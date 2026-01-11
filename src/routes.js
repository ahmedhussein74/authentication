const router = require("express").Router();
const authRoutes = require("./modules/auth/auth.route");
const userRoutes = require("./modules/users/users.route");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

module.exports = router;
