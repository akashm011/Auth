import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendInvitationEmail(email, invitationToken, tenantName = 'Our Platform', accessDuration = null) {
  const invitationLink = `${process.env.NEXTAUTH_URL}/auth/accept-invitation?token=${invitationToken}`;

  let durationText = '';
  if (accessDuration) {
    const { value, unit } = accessDuration;
    durationText = `<p style="color: #666; font-size: 14px; margin: 10px 0;">
      <strong>Access Duration:</strong> ${value} ${unit}(s) from acceptance date
    </p>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You are invited to ${tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome! You're Invited to ${tenantName}</h2>
        <p>You have been invited to join <strong>${tenantName}</strong>.</p>
        ${durationText}
        <p style="margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If the button above doesn't work, copy and paste this link in your browser:
          <br><code>${invitationLink}</code>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendCredentialsEmail(email, username, password, tenants = []) {
  let tenantsList = '';
  if (tenants.length > 0) {
    tenantsList = `
      <h3 style="color: #333; margin-top: 20px;">Your Access:</h3>
      <p>You have been granted access to the following application(s):</p>
      <ul style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${tenants.map(t => `<li>${t.name} (Access expires: ${new Date(t.expiresAt).toLocaleDateString()})</li>`).join('')}
      </ul>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Login Credentials</h2>
        <p>Your account has been set up. Here are your login details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        
        ${tenantsList}
        
        <p style="color: #666; font-size: 14px;">
          ⚠️ <strong>Important:</strong> Save these credentials in a secure location. 
          You can also save them to your browser for quick access.
        </p>
        <p style="color: #666; font-size: 14px;">
          For security, we recommend you change your password after your first login.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you have any issues logging in, please contact our support team.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
