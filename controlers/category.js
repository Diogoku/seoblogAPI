// models
const Category = require("../models/category");
const Blog = require("../models/blog");

// slugify
const slugify = require("slugify");

// error handler
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.create = (req, res) => {
  const { name } = req.body;

  let slug = slugify(name).toLowerCase();

  let category = new Category({ name, slug });

  category.save((error, data) => {
    if (error) return res.status(400).json({ error: errorHandler(error) });

    res.status(201).json(data);
  });
};

exports.list = (req, res) => {
  Category.find().exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(error) });
    res.status(200).json(data);
  });
};

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Category.findOne({ slug }).exec((err, category) => {
    if (err) return res.status(400).json({ error: errorHandler(error) });
    if (!category) return res.status(400).json({ error: "Category not found" });
    Blog.find({ categories: category })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .select(
        "id title slug excerpt categories postedBy tags createdAt updatedAt"
      )
      .exec((err, data) => {
        if (err) return res.status(400).json({ error: errorHandler(error) });
        res.status(200).json({ category: category, blogs: data });
      });
  });
};

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    else if (!data) {
      return res.status(400).json({ error: "Category not found" });
    }
    res.status(200).json({ msg: "Category deleted successfully" });
  });
};
