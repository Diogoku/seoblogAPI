const { check } = require("express-validator");

exports.tagValidator = [
  check("name").notEmpty().withMessage("Name is required"),
];
