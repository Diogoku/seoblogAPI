const express = require("express");

// controlers
const {
  preSignup,
  signup,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require("../controlers/auth");

// validators
const { runValidation } = require("../validators");
const {
  userSignupValidator,
  userSigninValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth");

// router
const router = express.Router();

// routes
router.post("/pre-signup", userSignupValidator, runValidation, preSignup);
router.post("/signup", signup);
router.post("/signin", userSigninValidator, runValidation, signin);
router.get("/signout", signout);
router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
);
router.post("/google-login", googleLogin);

module.exports = router;
