const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');

const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

const brandColor = '#c9a84c';
const bgColor = '#0a0a0f';
const cardBg = '#1c1c26';
const textColor = '#e8e4dc';
const mutedColor = '#a8a49c';

function emailWrapper(innerHtml) {
  return `
    <div style="background:${bgColor};padding:40px 20px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
      <div style="max-width:560px;margin:0 auto;background:${cardBg};border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden">
        <div style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,.07);text-align:center">
          <span style="font-size:20px;font-weight:700;color:${textColor};letter-spacing:-.3px">Book<span style="color:${brandColor}">Haven</span></span>
        </div>
        <div style="padding:32px">
          ${innerHtml}
        </div>
        <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.07);text-align:center">
          <p style="font-size:12px;color:${mutedColor};margin:0">© 2025 BookHaven — Your Premium Digital Library</p>
        </div>
      </div>
    </div>
  `;
}

async function sendOtpEmail({ to, otp, purpose }) {
  if (!emailUser || !emailPass) {
    throw new AppError('Email service is not configured', 500);
  }

  const actionText = purpose === 'register' ? 'complete your registration' : 'reset your password';

  await transporter.sendMail({
    from: `"BookHaven" <${emailUser}>`,
    to,
    subject: `Your BookHaven OTP is ${otp}`,
    html: emailWrapper(`
      <h2 style="color:${textColor};font-size:22px;margin:0 0 8px">Email Verification</h2>
      <p style="color:${mutedColor};font-size:14px;margin:0 0 24px">Use the OTP below to ${actionText}:</p>
      <div style="background:${bgColor};border:2px solid ${brandColor};border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <span style="font-size:32px;letter-spacing:8px;font-weight:700;color:${brandColor}">${otp}</span>
      </div>
      <p style="color:${mutedColor};font-size:13px;margin:0">This OTP is valid for <strong style="color:${textColor}">10 minutes</strong>. If you did not request this, please ignore this email.</p>
    `)
  });
}

async function sendWelcomeEmail({ to, name }) {
  if (!emailUser || !emailPass) return;

  try {
    await transporter.sendMail({
      from: `"BookHaven" <${emailUser}>`,
      to,
      subject: `Welcome to BookHaven, ${name}! 📚`,
      html: emailWrapper(`
        <h2 style="color:${textColor};font-size:22px;margin:0 0 8px">Welcome, ${name}! 🎉</h2>
        <p style="color:${mutedColor};font-size:14px;line-height:1.7;margin:0 0 24px">
          Your BookHaven account is ready. You now have access to India's finest digital library — from Tagore to Tolstoy.
        </p>
        <div style="background:${bgColor};border-radius:12px;padding:20px;margin:0 0 24px">
          <p style="color:${textColor};font-size:14px;margin:0 0 12px;font-weight:600">What you can do:</p>
          <p style="color:${mutedColor};font-size:13px;margin:0 0 8px">📖 Read free previews of every book</p>
          <p style="color:${mutedColor};font-size:13px;margin:0 0 8px">🛒 Purchase books for full access</p>
          <p style="color:${mutedColor};font-size:13px;margin:0 0 8px">📊 Track your reading progress</p>
          <p style="color:${mutedColor};font-size:13px;margin:0">❤️ Save books to your wishlist</p>
        </div>
        <div style="text-align:center">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/books" style="display:inline-block;background:${brandColor};color:#0a0a0f;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
            Browse Library →
          </a>
        </div>
      `)
    });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
}

async function sendPurchaseReceipt({ to, name, order, books }) {
  if (!emailUser || !emailPass) return;

  try {
    const bookRows = books.map(b =>
      `<tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07);color:${textColor};font-size:13px">${b.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07);color:${mutedColor};font-size:13px">${b.author}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07);color:${brandColor};font-size:13px;text-align:right;font-weight:600">₹${b.price}</td>
      </tr>`
    ).join('');

    const totalAmount = (order.amount / 100).toFixed(0);

    await transporter.sendMail({
      from: `"BookHaven" <${emailUser}>`,
      to,
      subject: `Your order ${order.receipt} — ₹${totalAmount} 🎉`,
      html: emailWrapper(`
        <h2 style="color:${textColor};font-size:22px;margin:0 0 8px">Payment Successful! ✅</h2>
        <p style="color:${mutedColor};font-size:14px;margin:0 0 24px">
          Hi ${name}, your purchase is confirmed. Your books are now in your library.
        </p>
        <div style="background:${bgColor};border-radius:12px;padding:20px;margin:0 0 24px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:${mutedColor};font-size:12px;padding-bottom:4px">Order ID</td>
              <td style="color:${textColor};font-size:12px;padding-bottom:4px;text-align:right">${order.receipt}</td>
            </tr>
            <tr>
              <td style="color:${mutedColor};font-size:12px;padding-bottom:4px">Payment ID</td>
              <td style="color:${textColor};font-size:12px;padding-bottom:4px;text-align:right">${order.razorpayPaymentId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color:${mutedColor};font-size:12px">Date</td>
              <td style="color:${textColor};font-size:12px;text-align:right">${new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid ${brandColor};color:${brandColor};font-size:11px;text-transform:uppercase;letter-spacing:.5px">Book</th>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid ${brandColor};color:${brandColor};font-size:11px;text-transform:uppercase;letter-spacing:.5px">Author</th>
              <th style="text-align:right;padding:8px 0;border-bottom:2px solid ${brandColor};color:${brandColor};font-size:11px;text-transform:uppercase;letter-spacing:.5px">Price</th>
            </tr>
          </thead>
          <tbody>
            ${bookRows}
          </tbody>
        </table>
        <div style="text-align:right;padding-top:8px;border-top:2px solid ${brandColor}">
          <span style="color:${mutedColor};font-size:14px">Total: </span>
          <strong style="color:${textColor};font-size:20px">₹${totalAmount}</strong>
        </div>
        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/user/dashboard" style="display:inline-block;background:${brandColor};color:#0a0a0f;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
            Open My Library →
          </a>
        </div>
      `)
    });
  } catch (err) {
    console.error('Purchase receipt email failed:', err.message);
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPurchaseReceipt
};
