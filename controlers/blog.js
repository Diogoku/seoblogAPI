const formidable = require("formidable");
const slugify = require("slugify");
const stripHtml = require("string-strip-html");
const _ = require("lodash");
const fs = require("fs");

// models
const Blog = require("../models/blog");
const Category = require("../models/category");
const Tag = require("../models/tag");
const User = require("../models/user");

// error handler
const { errorHandler } = require("../helpers/dbErrorHandler");

// smart trim
const { smartTrim } = require("../helpers/blog");

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Image could not upload" });

    const { title, body, categories, tags } = fields;

    // validation title
    if (!title || !title.length) {
      return res.status(400).json({ error: "Title is required" });
    }

    // validation body
    if (!body || body.length < 200) {
      return res.status(400).json({ error: "Content is too short" });
    }

    // validation category
    if (!categories || !categories.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one category is required" });
    }

    // validation tags
    if (!tags || !tags.length === 0) {
      return res.status(400).json({ error: "At least one tag is required" });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excerpt = smartTrim(body, 320, " ", " ...");
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title} | ${process.env.APP_Name}`;
    blog.mdesc = stripHtml(body.substring(0, 160)).result;
    blog.postedBy = req.user._id;

    // categories and tags
    let arrayOfCategories = categories && categories.split(",");
    let arrayOfTags = tags && tags.split(",");

    if (files.photo) {
      console.log(files.photo.size);
      if (files.photo.size > 10000000) {
        return res
          .status(400)
          .json({ error: "Image should be less than 1mb in size" });
      }
      blog.photo.data = fs.readFileSync(files.photo.path);
      blog.photo.contentType = files.photo.type;
    }

    blog.save((err, result) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      Blog.findByIdAndUpdate(
        result._id,
        { $push: { categories: arrayOfCategories } },
        { new: true }
      ).exec((err, result) => {
        if (err) return res.status(400).json({ error: errorHandler(err) });
        else {
          Blog.findByIdAndUpdate(
            result._id,
            { $push: { tags: arrayOfTags } },
            { new: true }
          ).exec((err, result) => {
            if (err) return res.status(400).json({ error: errorHandler(err) });
            return res.status(200).json(result);
          });
        }
      });
    });
  });
};

exports.list = (req, res) => {
  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      res.status(200).json(data);
    });
};

exports.listAllBlogsCategoriesTags = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  let blogs;
  let categories;
  let tags;

  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username profile")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      blogs = data; // all the blogs
      // get all categories
      Category.find({}).exec((err, c) => {
        if (err) return res.status(400).json({ error: errorHandler(err) });
        categories = c; // all categories
        // get all tags
        Tag.find({}).exec((err, t) => {
          if (err) return res.status(400).json({ error: errorHandler(err) });
          tags = t; // all tags
          // return all blogs, categories and tags
          res.status(200).json({ blogs, categories, tags, size: blogs.length });
        });
      });
    });
};

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug: slug })
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username")
    .select(
      "_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      if (!data) return res.status(400).json({ error: "Blog not found" });
      res.status(200).json(data);
    });
};

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    res.status(200).json({ message: "Blog deleted successfully" });
  });
};

exports.update = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug }).exec((err, oldBlog) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    if (!oldBlog) return res.status(400).json({ error: "Blog not found" });

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) return res.status(400).json({ error: "Image could not upload" });

      let slugBeforeMerge = oldBlog.slug;
      oldBlog = _.merge(oldBlog, fields);
      oldBlog.slug = slugBeforeMerge;

      const { body, mdesc, categories, tags } = fields;

      if (body) {
        oldBlog.excerpt = smartTrim(body, 320, " ", " ...");
        oldBlog.mdesc = stripHtml(body.substring(0, 160)).result;
      }

      if (categories) oldBlog.categories = categories.split(",");
      if (tags) oldBlog.tags = tags.split(",");

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res
            .status(400)
            .json({ error: "Image should be less than 1mb in size" });
        }
        oldBlog.photo.data = fs.readFileSync(files.photo.path);
        oldBlog.photo.contentType = files.photo.type;
      }

      oldBlog.save((err, result) => {
        if (err) {
          return res.status(400).json({ error: err });
        }
        res.status(200).json(result);
      });
    });
  });
};

exports.photo = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug })
    .select("photo")
    .exec((err, blog) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      if (!blog) return res.status(400).json({ error: "Blog not found" });

      res.set("Content-Type", blog.photo.contentType);
      return res.status(200).send(blog.photo.data);
    });
};

exports.listRelated = (req, res) => {
  const limit = req.body.limit ? parseInt(req.body.limit) : 3;
  const { _id, categories } = req.body.blog;

  Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
    .limit(limit)
    .populate("postedBy", "_id name username profile")
    .select("title slug excerpt postedBy createdAt updatedAt")
    .exec((err, blogs) => {
      if (err) return res.status(400).json({ error: "Blogs not found" });
      res.status(200).json(blogs);
    });
};

exports.listSearch = (req, res) => {
  const { search } = req.query;
  console.log(search);
  if (search) {
    Blog.find(
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      },
      (err, blogs) => {
        if (err) return res.status(400).json({ error: "Blogs not found" });
        console.log(blogs);
        res.status(200).json(blogs);
      }
    ).select("-photo -body");
  }
};

exports.listByUser = (req, res) => {
  User.findOne({ username: req.params.username }).exec((err, user) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });
    if (!user) return res.status(400).json({ error: "User not found" });

    Blog.find({ postedBy: user._id })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name username")
      .select("_id title slug categories tags postedBy createdAt updatedAt")
      .exec((err, data) => {
        if (err) return res.status(400).json({ error: errorHandler(err) });
        res.status(200).json(data);
      });
  });
};
