const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Read and compile HTML template
 * @param {string} templateName - Name of the template file (e.g., 'welcome.html')
 * @param {Object} data - Data to replace placeholders
 * @returns {Promise<string>} - Compiled HTML content
 */
const compileTemplate = async (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates', templateName);
  const html = await fs.readFile(templatePath, 'utf8');
  const template = Handlebars.compile(html);
  return template(data);
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

/**
 * Send welcome email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise}
 */
const sendWelcomeEmail = async (to, name) => {
  const subject = 'Welcome to Buzzly';
  const html = await compileTemplate('welcome.html', { name });
  await sendEmail(to, subject, html);
};

/**
 * Send reset password email
 * @param {string} to - Recipient email address
 * @param {string} token - Reset password token
 * @param {string} name - User's name
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token, name) => {
  const subject = 'Reset Your Password';
  const resetPasswordUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const html = await compileTemplate('forgot-password.html', { name, reset_link: resetPasswordUrl });
  await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to - Recipient email address
 * @param {string} token - Verification token
 * @param {string} name - User's name
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token, name) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const html = await compileTemplate('verify-email.html', { name, verify_link: verificationEmailUrl });
  await sendEmail(to, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};