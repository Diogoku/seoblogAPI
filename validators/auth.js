const { check } = require("express-validator");

exports.userSignupValidator = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email")
    .isEmail()
    .withMessage("Email field must be an email")
    .matches(/.+\@.+\..+/)
    .withMessage("Email must contain @")
    .isLength({
      min: 4,
      max: 32,
    })
    .withMessage("Email must be between 4 and 32 characters"),
  check("password")
    .notEmpty()
    .withMessage("Password field is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches("[0-9]")
    .withMessage("Password must contain at least one digit")
    .matches("[a-z]")
    .withMessage("Password must contain at least a lowercase letter")
    .matches("[A-Z]")
    .withMessage("Password must contain at least a uppercase letter"),
];

exports.userSigninValidator = [
  check("email")
    .isEmail()
    .withMessage("Email field must be an email")
    .matches(/.+\@.+\..+/)
    .withMessage("Email must contain @")
    .isLength({
      min: 4,
      max: 32,
    })
    .withMessage("Email must be between 4 and 32 characters"),
  check("password")
    .notEmpty()
    .withMessage("Password field is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches("[0-9]")
    .withMessage("Password must contain at least one digit")
    .matches("[a-z]")
    .withMessage("Password must contain at least a lowercase letter")
    .matches("[A-Z]")
    .withMessage("Password must contain at least a uppercase letter"),
];

exports.forgotPasswordValidator = [
  check("email")
    .isEmail()
    .withMessage("Email field must be an email")
    .matches(/.+\@.+\..+/)
    .withMessage("Email must contain @")
    .isLength({
      min: 4,
      max: 32,
    })
    .withMessage("Email must be between 4 and 32 characters"),
];

exports.resetPasswordValidator = [
  check("newPassword")
    .notEmpty()
    .withMessage("Password field is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches("[0-9]")
    .withMessage("Password must contain at least one digit")
    .matches("[a-z]")
    .withMessage("Password must contain at least a lowercase letter")
    .matches("[A-Z]")
    .withMessage("Password must contain at least a uppercase letter"),
];
