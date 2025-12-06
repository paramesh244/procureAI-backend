const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS
  }
});


async function sendRfpEmail(vendor, rfp, htmlContent){

  const mailOptions = {
    from: process.env.EMAIL_SMTP_USER,
    to: vendor.email,
    // subject: `RFP: ${rfp.title} `,
    subject: `RFP: ${rfp.title} [rfpId:${rfp._id}]`,
    html: htmlContent
  };
  return transporter.sendMail(mailOptions);
}

function buildRfpHtml(rfp){

  let items = rfp.items.map(i => `<li>${i.quantity} x ${i.name} (${i.specifications})</li>`).join('');

  return `<h3>${rfp.title}</h3>
  <p>${rfp.description || ''}</p>
  <ul>${items}</ul>
  <p><strong>Budget:</strong> ${rfp.budget || 'N/A'}</p>
  <p><strong>Delivery:</strong> ${rfp.delivery_timeline}</p>
  <p><strong>Payment will be done within ${rfp.payment_terms || 'N/A'} days after receiving the invoice.</strong></p>
  <p><strong>Warranty:</strong> ${rfp.warranty || 'N/A'}</p>
  <p>Please reply to this email with your proposal. Thank you!</p>`;
}

module.exports = { sendRfpEmail, buildRfpHtml };
