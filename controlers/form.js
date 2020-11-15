const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.contactForm = (req, res) => {
  const { name, email, message } = req.body;

  const emailData = {
    to: process.env.EMAIL_TO,
    from: email,
    subject: `Contact form - ${process.env.APP_NAME}`,
    text: `Email recieved from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
    html: `
        <h4>Email recieved from contact form:</h4>
        <p>Sender name: ${name}</p>
        <p>Sender email: ${email}</p>
        <p>Sender message: ${message}</p>
        <hr />
        <p>This email may contain sensitive information</p>
        <p>https://seoblog.com</p>
    `,
  };

  sgMail.send(emailData).then((sent) => {
    return res.status(200).json({ success: true });
  });
};

exports.contactBlogAuthorForm = (req, res) => {
  const { authorEmail, name, email, message } = req.body;

  const emailData = {
    to: authorEmail ? authorEmail : process.env.EMAIL_TO,
    from: email,
    subject: `Someone messaged you from - ${process.env.APP_NAME}`,
    text: `Email recieved from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
    html: `
          <h4>Message recieved from:</h4>
          <p>Name: ${name}</p>
          <p>Email from: ${email}</p>
          <p>Message: ${message}</p>
          <hr />
          <p>This email may contain sensitive information</p>
          <p>https://seoblog.com</p>
      `,
  };

  sgMail.send(emailData).then((sent) => {
    return res.status(200).json({ success: true });
  });
};
