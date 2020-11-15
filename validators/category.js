const { check } = require("express-validator");

exports.categoryValidator = [
  check("name").notEmpty().withMessage("Name is required"),
];
