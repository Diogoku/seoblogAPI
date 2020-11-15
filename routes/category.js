const express = require("express");

// controlers
const { adminMiddleware, requireSignin } = require("../controlers/auth");
const { create, list, read, remove } = require("../controlers/category");

// validators
const { runValidation } = require("../validators");
const { categoryValidator } = require("../validators/category");

// router
const router = express.Router();

// routes
router.post(
  "/category",
  categoryValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
);
router.get("/categories", list);
router.get("/category/:slug", read);
router.delete("/category/:slug", requireSignin, adminMiddleware, remove);

module.exports = router;
