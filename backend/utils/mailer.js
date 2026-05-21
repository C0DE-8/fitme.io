const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES || 10;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Send OTP email
 * @param {string} to - Recipient email address
 * @param {string} otp - The OTP code
 * @returns {Promise<void>}
 */
async function otpMail(to, otp) {
  const mailOptions = {
    from: `"Fitme.io AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Your OTP Code - Fitme.io AI',
    html: `
      <div style="
        font-family: Arial, sans-serif; 
        max-width: 600px; 
        margin: auto; 
        padding: 40px 20px;
        background: linear-gradient(135deg, #4c1d95 0%, #2563eb 100%);
      ">
        <div style="
          background: rgba(7, 27, 19, 0.55); 
          border-radius: 20px; 
          padding: 30px; 
          backdrop-filter: blur(14px); 
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 80px rgba(139,92,246,0.20), 0 20px 50px -20px rgba(0,0,0,0.6);
          color: #f5f3ff;
        ">
          <h2 style="
            color: #a78bfa; 
            font-size: 24px; 
            margin-bottom: 12px; 
            text-align: center;
          ">🔐 One-Time Password</h2>

          <p style="font-size: 15px; text-align: center; color: #ddd6fe;">
            Use the OTP below to complete your verification:
          </p>

          <div style="
            background: rgba(92, 28, 149, 0.4); 
            color: #fff; 
            font-size: 30px; 
            font-weight: bold; 
            padding: 16px 28px; 
            border-radius: 14px; 
            text-align: center; 
            letter-spacing: 4px;
            box-shadow: 0 0 40px rgba(139,92,246,0.35), inset 0 0 20px rgba(255,255,255,0.05);
            margin: 22px auto;
            width: fit-content;
            border: 1px solid rgba(255, 255, 255, 0.15);
          ">
            ${otp}
          </div>

          <p style="font-size: 14px; text-align: center; color: #93c5fd;">
            This OTP will expire in <strong>${process.env.OTP_EXPIRY_MINUTES}</strong> minutes.
          </p>

          <p style="font-size: 12px; text-align: center; color: #60a5fa; margin-top: 20px;">
            If you didn’t request this code, please ignore this email.
          </p>

          <hr style="border: none; height: 1px; background: rgba(96,165,250,0.4); margin: 25px 0;">

          <p style="font-size: 12px; text-align: center; color: #a78bfa;">
            © ${new Date().getFullYear()} Fitme.io AI – Secure Verification Service
          </p>
        </div>
      </div>
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

/**
 * Send Welcome email after registration
 * @param {string} to - Recipient email address
 * @param {string} username - Recipient username
 * @returns {Promise<void>}
 */
async function welcomeMail(to, username) {
  const BRAND_NAME = process.env.APP_NAME || 'Fitme.io AI';
  const FROM_EMAIL = process.env.EMAIL_USER;
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || FROM_EMAIL;

  const preheader = `Welcome to ${BRAND_NAME}, ${username}! Let’s get you set up.`;

  const mailOptions = {
    from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `👋 Welcome to ${BRAND_NAME}, ${username}!`,
    html: `
      <!-- Preheader (hidden in most clients but improves inbox preview) -->
      <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">
        ${preheader}
      </span>

      <div style="
        font-family: Arial, sans-serif;
        max-width: 640px;
        margin: 0 auto;
        padding: 40px 20px;
        background: linear-gradient(135deg, #4c1d95 0%, #2563eb 100%);
      ">
        <div style="
          background: rgba(7,27,19,0.55);
          border-radius: 20px;
          padding: 32px;
          color: #f5f3ff;
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 0 80px rgba(139,92,246,0.20), 0 20px 50px -20px rgba(0,0,0,0.60);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
        ">
          <h1 style="margin: 0 0 8px; font-size: 24px; line-height: 1.25; color: #a78bfa;">
            👋 Welcome, ${username}!
          </h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #ddd6fe;">
            Thanks for joining <strong style="color:#f5f3ff;">${BRAND_NAME}</strong>.
            You’re in — let’s set you up for a smooth start.
          </p>

          <!-- Feature bullets -->
          <div style="margin: 18px 0 22px; padding: 16px; border-radius: 14px; background: rgba(92,28,149,0.20); border: 1px solid rgba(255,255,255,0.12);">
            <ul style="margin: 0; padding: 0 0 0 18px; color: #e9d5ff; font-size: 14px; line-height: 1.6;">
              <li>Clean, fast experience with a modern UI.</li>
              <li>Secure authentication and notifications.</li>
              <li>Helpful tips and support whenever you need it.</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align:center; margin: 26px 0 6px;">
            <a href="#" target="_blank" style="
              display: inline-block;
              text-decoration: none;
              padding: 12px 22px;
              font-size: 15px;
              font-weight: 600;
              color: #ffffff;
              background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
              border-radius: 12px;
              box-shadow: 0 0 40px rgba(139,92,246,0.35), inset 0 0 12px rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.14);
            ">
              Get Started
            </a>
          </div>

          <!-- Secondary info -->
          <p style="margin: 18px 0 0; font-size: 13px; color: #93c5fd; text-align:center;">
            Need help? Reply to this email or contact us at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#60a5fa; text-decoration:underline;">${SUPPORT_EMAIL}</a>.
          </p>

          <hr style="border: none; height: 1px; background: rgba(96,165,250,0.40); margin: 24px 0;">

          <!-- Footer -->
          <p style="margin: 0; font-size: 12px; color: #a78bfa; text-align:center;">
            © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #c4b5fd; text-align:center;">
            You’re receiving this because you created an account with ${BRAND_NAME}.
          </p>
        </div>
      </div>
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

/**
 * Send Subscription Status Mail
 * @param {string} to - Recipient email
 * @param {string} username - Recipient name
 * @param {string} status - Subscription status (active/cancelled)
 * @param {string} startDate - Start date of the subscription
 * @param {string} expiryDate - Expiry date of the subscription
 */
async function subscriptionMail(to, username, status, startDate, expiryDate) {
  const BRAND_NAME = process.env.APP_NAME || 'Fitme.io AI';
  const FROM_EMAIL = process.env.EMAIL_USER;

  const statusColor = status === 'active' ? '#2a9d8f' : '#e63946';
  const statusMessage =
    status === 'active'
      ? `Your subscription has been <strong>confirmed</strong>.`
      : `Your subscription has been <strong>rejected</strong>.`;

  const mailOptions = {
    from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Subscription ${status === 'active' ? 'Confirmed' : 'Rejected'}`,
    html: `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        max-width: 640px; 
        margin: auto; 
        padding: 40px 20px; 
        background: linear-gradient(135deg, #2a9d8f 0%, #3eb489 50%, #38b000 100%);
      ">
        <div style="
          background: rgba(255, 255, 255, 0.9); 
          border-radius: 16px; 
          padding: 28px; 
          box-shadow: 0 0 40px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        ">
          <h2 style="color: ${statusColor}; text-align: center; margin-top: 0;">
            📦 Subscription Update
          </h2>
          <p style="font-size: 16px;">Hello <strong>${username}</strong>,</p>
          <p style="font-size: 15px;">${statusMessage}</p>

          <div style="
            background: rgba(255, 255, 255, 0.85); 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 15px; 
            border: 1px solid rgba(0,0,0,0.05);
          ">
            <p><strong>Status:</strong> <span style="color: ${statusColor}; text-transform: capitalize;">${status}</span></p>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          </div>

          <p style="font-size: 13px; color: #555; margin-top: 20px;">
            If you have questions, feel free to contact support.
          </p>
          <p style="font-size: 12px; color: #888;">
            ${BRAND_NAME} Team • This is an automated email
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Send Subscription Expiry and Cancellation Email
 * @param {string} to - Recipient email address
 * @param {string} username - Recipient name or username
 * @param {string} startDate - Subscription start date (formatted string)
 * @param {string} expiryDate - Subscription expiry date (formatted string)
 * 
 * @returns {Promise} Resolves when email is sent, rejects on error
 */
async function subscriptionExpiryMail(to, username, startDate, expiryDate) {
  const BRAND_NAME = process.env.APP_NAME || 'Fitme.io AI';
  const FROM_EMAIL = process.env.EMAIL_USER;

  const statusColor = '#e63946';
  const statusMessage = `Your subscription has <strong>expired</strong> and has been <strong>cancelled</strong>.`;

  const mailOptions = {
    from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: 'Subscription Expired & Cancelled',
    html: `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        max-width: 640px; 
        margin: auto; 
        padding: 40px 20px; 
        background: linear-gradient(135deg, #e63946 0%, #b91c1c 50%, #7f1d1d 100%);
      ">
        <div style="
          background: rgba(255, 255, 255, 0.9); 
          border-radius: 16px; 
          padding: 28px; 
          box-shadow: 0 0 40px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        ">
          <h2 style="color: ${statusColor}; text-align: center; margin-top: 0;">
            📦 Subscription Update
          </h2>
          <p style="font-size: 16px;">Hello <strong>${username}</strong>,</p>
          <p style="font-size: 15px;">${statusMessage}</p>

          <div style="
            background: rgba(255, 255, 255, 0.85); 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 15px; 
            border: 1px solid rgba(0,0,0,0.05);
          ">
            <p><strong>Status:</strong> <span style="color: ${statusColor}; text-transform: capitalize;">cancelled</span></p>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          </div>

          <p style="font-size: 13px; color: #555; margin-top: 20px;">
            If you have questions, feel free to contact support.
          </p>
          <p style="font-size: 12px; color: #888;">
            ${BRAND_NAME} Team • This is an automated email
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}



module.exports = { otpMail, welcomeMail, subscriptionMail, subscriptionExpiryMail };
