const express = require("express");

// controler
const { contactForm, contactBlogAuthorForm } = require("../controlers/form");

// validators
const { runValidation } = require("../validators");
const { contactFormValidator } = require("../validators/form");

// router
const router = express.Router();

// routes
router.post("/contact", contactFormValidator, runValidation, contactForm);
router.post(
  "/contact-blog-author",
  contactFormValidator,
  runValidation,
  contactBlogAuthorForm
);

module.exports = router;
