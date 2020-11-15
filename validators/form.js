const { check } = require("express-validator");

exports.contactFormValidator = [
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
  check("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 20 })
    .withMessage("Message must be at least 20 characters long"),
];
