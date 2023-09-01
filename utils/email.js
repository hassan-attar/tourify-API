const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }
  makeTransporter() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    } else {
      console.log('here');
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    // render html template of email
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });

    //email options
    const emailOptions = {
      from: `Hassan Attar <${process.env.EMAIL_FROM}>`,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    //send email
    await this.makeTransporter().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }
  async sendPasswordReset() {
    await this.send(
      'resetPassword',
      'Reset password token (valid for 10 minutes)'
    );
  }
};
