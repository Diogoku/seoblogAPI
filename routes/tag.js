const express = require("express");

// controlers
const { adminMiddleware, requireSignin } = require("../controlers/auth");
const { create, list, read, remove } = require("../controlers/tag");

// validators
const { runValidation } = require("../validators");
const { tagValidator } = require("../validators/tag");

// router
const router = express.Router();

// routes
router.post(
  "/tag",
  tagValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
);
router.get("/tags", list);
router.get("/tag/:slug", read);
router.delete("/tag/:slug", requireSignin, adminMiddleware, remove);

module.exports = router;
