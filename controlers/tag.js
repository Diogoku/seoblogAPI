// models
const Tag = require("../models/tag");
const Blog = require("../models/blog");

// slugify
const slugify = require("slugify");

// error handler
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.create = (req, res) => {
  const { name } = req.body;

  let slug = slugify(name).toLowerCase();

  let tag = new Tag({ name, slug });

  tag.save((error, data) => {
    if (error) return res.status(400).json({ error: errorHandler(error) });

    res.status(201).json(data);
  });
};

exports.list = (req, res) => {
  Tag.find().exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(error) });
    res.status(200).json(data);
  });
};

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Tag.findOne({ slug }).exec((err, tag) => {
    if (err) return res.status(400).json({ error: errorHandler(error) });
    if (!tag) return res.status(400).json({ error: "Tag not found" });
    Blog.find({ tags: tag })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .select(
        "id title slug excerpt categories postedBy tags createdAt updatedAt"
      )
      .exec((err, data) => {
        if (err) return res.status(400).json({ error: errorHandler(error) });
        res.status(200).json({ tag: tag, blogs: data });
      });
  });
};

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Tag.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    else if (!data) {
      return res.status(400).json({ error: "Tag not found" });
    }
    res.status(200).json({ msg: "Tag deleted successfully" });
  });
};
