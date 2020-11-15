const express = require("express");

// controlers
const { authMiddleware, requireSignin } = require("../controlers/auth");
const { read, publicProfile, update, photo } = require("../controlers/user");

// router
const router = express.Router();

// routes
router.get("/user/profile", requireSignin, authMiddleware, read);
router.get("/user/:username", publicProfile);
router.put("/user/update/", requireSignin, authMiddleware, update);
router.get("/user/photo/:username", photo);

module.exports = router;
