const shortId = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

// google login
const { OAuth2Client } = require("google-auth-library");

// models
const User = require("../models/user");
const Blog = require("../models/blog");

// error handler
const { errorHandler } = require("../helpers/dbErrorHandler");

// send grid
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// lodash
const _ = require("lodash");

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  return res.json(req.profile);
};

exports.preSignup = (req, res) => {
  const { name, email, password } = req.body;

  User.findOne({ email: email.toLowerCase() }).exec((err, user) => {
    if (user) return res.status(400).json({ error: "Email is taken" });

    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    const emailData = {
      to: "diogomnribeiro@gmail.com",
      from: "diogomnribeiro@hotmail.com",
      subject: `Account activation link - ${process.env.APP_NAME}`,
      html: `
          <p>Please use the following link to active your account:</p>
          <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
          <hr />
          <p>This email may contain sensitive information</p>
          <p>https://seoblog.com</p>
      `,
    };

    sgMail.send(emailData).then((sent) => {
      res.status(200).json({
        message: `Email has been sent to ${email}. Follow the instructions to activate your acount. Link expires in 10min`,
      });
    });
  });
};

exports.signup = (req, res) => {
  const { token } = req.body;
  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({ error: "Expired link. Signup again" });
      }

      const { name, email, password } = jwt.decode(token);

      const username = shortId.generate();
      const profile = `${process.env.CLIENT_URL}/profile/${username}`;

      const user = new User({ name, email, password, profile, username });
      user.save((err, user) => {
        if (err) {
          return res.status(401).json({ error: errorHandler(err) });
        }
        res.status(201).json({ message: "Signup success. Please signin" });
      });
    });
  } else {
    return res.status(400).json({ error: "No token was provided. Try again" });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;
  // check if user exits
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ error: `User with that email does not exists. Please signup` });
    }

    // authenticate
    if (!user.authenticate(password)) {
      return res
        .status(400)
        .json({ error: `Email and password do not match. Please signup` });
    }

    // generate a token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, { expiresIn: "1d" });
    const { _id, username, name, email, role } = user;

    return res
      .status(200)
      .json({ token, user: { _id, username, name, email, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ msg: "Signout success" });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["sha1", "RS256", "HS256"],
});

exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findById(authUserId).exec((err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });
    req.profile = user;
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id;
  User.findById(adminUserId).exec((err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });
    if (user.role !== 1) {
      return res.status(400).json({ error: "Admin resource. Access denied" });
    }
    req.profile = user;
    next();
  });
};

exports.canUpdateDeleteBlog = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug }).exec((err, data) => {
    if (err) return res.status(400).json({ error: errorHandler(err) });

    let authorizedUser =
      data.postedBy._id.toString() === req.profile._id.toString();
    if (!authorizedUser) {
      return res.status(400).json({ error: "You are not authorized" });
    }
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res
        .status(401)
        .json({ error: "User with that email does not exist" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10m",
    });

    /*
to: email,
      from: process.env.EMAIL_FROM,

    */

    const emailData = {
      to: "diogomnribeiro@gmail.com",
      from: "diogomnribeiro@hotmail.com",
      subject: `Password reset link - ${process.env.APP_NAME}`,
      html: `
          <p>Please use the following link to reset your password:</p>
          <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
          <hr />
          <p>This email may contain sensitive information</p>
          <p>https://seoblog.com</p>
      `,
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      sgMail.send(emailData).then((sent) => {
        res.status(200).json({
          message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min`,
        });
      });
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err)
        return res.status(401).json({ error: "Expired link, try again" });
      User.findOne({ resetPasswordLink }).exec((err, user) => {
        if (err || !user) {
          return res
            .status(401)
            .json({ error: "Something went wrong. Try later" });
        }
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: "",
        };

        user = _.extend(user, updatedFields);

        user.save((err, result) => {
          if (err || !user) {
            return res.status(401).json({ error: errorHandler(err) });
          }
          return res.status(200).json({
            message: `Great! Now you can login with your new password`,
          });
        });
      });
    });
  }
};

const cliente = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const idToken = req.body.tokenId;
  cliente
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      const { email_verified, name, email, jti } = response.payload;

      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "1d",
            });
            res.cookie("token", token, { expiresIn: "1d" });
            const { _id, email, name, role, username } = user;
            return res
              .status(200)
              .json({ token, user: { _id, email, name, role, username } });
          } else {
            const username = shortId.generate();
            const profile = `${process.env.CLIENT_URL}/profile/${username}`;
            const password = jti + process.env.JWT_SECRET;
            user = new User({ name, email, profile, username, password });
            user.save((err, data) => {
              if (err) {
                return res.status(400).json({ error: errorHandler(err) });
              }

              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: "1d",
                }
              );
              res.cookie("token", token, { expiresIn: "1d" });
              const { _id, email, name, role, username } = data;
              return res
                .status(200)
                .json({ token, user: { _id, email, name, role, username } });
            });
          }
        });
      } else {
        return res
          .status(400)
          .json({ error: "Google login failed. Try again." });
      }
    });
};
