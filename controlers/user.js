// models
const User = require("../models/user");
const Blog = require("../models/blog");

// lodash
const _ = require("lodash");

// formidable
const formidable = require("formidable");

// file system
const fs = require("fs");

// error handler
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  return res.json(req.profile);
};

exports.publicProfile = (req, res) => {
  const username = req.params.username;

  User.findOne({ username: username }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "User not found" });
    }
    Blog.find({ postedBy: user._id })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .limit(10)
      .select(
        "_id title slug excerpt categories tags postedBy createdAt updatedAt"
      )
      .exec((err, data) => {
        if (err) return res.status(400).json({ error: errorHandler(err) });
        user.photo = undefined;
        user.hashed_password = undefined;
        res.status(200).json({ user, blogs: data });
      });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtension = true;
  form.parse(req, (err, fields, files) => {
    if (err)
      return res.status(400).json({ error: "Photo could not be uploaded" });
    let user = req.profile;
    // user's existing role and email before update
    const existingRole = user.role;
    const existingEmail = user.email;

    if (fields && fields.username && fields.username.length > 12) {
      return res.status(400).json({
        error: "Username should be less than 12 characters long",
      });
    }

    if (fields.username) {
      fields.username = slugify(fields.username).toLowerCase();
    }

    if (fields.password && fields.password.length < 6) {
      return res.status(400).json({
        error: "Password should be min 6 characters long",
      });
    }

    user = _.extend(user, fields);
    // user's existing role and email - dont update - keep it same
    user.role = existingRole;
    user.email = existingEmail;

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({ error: "Image should be less than 1mb" });
      }
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }

    user.save((err, result) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      user.hashed_password = undefined;
      user.salt = undefined;
      user.photo = undefined;
      res.status(200).json({ user });
    });
  });
};

exports.photo = (req, res) => {
  const username = req.params.username;

  User.findOne({ username: username }).exec((err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });

    if (user.photo.data) {
      res.set("Content-Type", user.photo.contentType);
      return res.status(200).send(user.photo.data);
    }
  });
};
