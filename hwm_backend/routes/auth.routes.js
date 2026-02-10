const router = require("express").Router();
const { register, login, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const validators = require("../middleware/validation.middleware");

router.post("/register", validators.registerValidator, register);
router.post("/login", validators.loginValidator, login);
router.post("/forgot-password", validators.forgotPasswordValidator, forgotPassword);
router.post("/reset-password", validators.resetPasswordValidator, resetPassword);

module.exports = router;
