const router = require("express").Router();
const userController = require("./users.controller");
const { protect, restrictTo } = require("../../middlewares/auth.middleware");

// All routes here require the user to be logged in
router.use(protect);

router.get("/me", userController.getMe);
router.patch("/update-me", userController.updateMe);
router.delete("/delete-me", userController.deleteMe);

// Admin Only routes
router.get("/", restrictTo("admin"), userController.getAllUsers);

module.exports = router;
