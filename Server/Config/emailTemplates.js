// ─── MindEase Branded Email Templates ────────────────────────────────────────

const BASE_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', Arial, sans-serif; background: #F5F4FF; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card {
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(124,58,237,0.12);
    }
    .header {
      background: linear-gradient(135deg, #1A0A3C 0%, #2D1060 100%);
      padding: 40px 40px 32px;
      text-align: center;
    }
    .logo-circle {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #C084FC, #9333EA, #6D28D9);
      border-radius: 24px;
      margin: 0 auto 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name {
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin: 0;
    }
    .brand-tag {
      color: #C084FC;
      font-size: 11px;
      letter-spacing: 3px;
      margin-top: 4px;
      font-weight: 600;
    }
    .body { padding: 40px 40px 32px; }
    .greeting {
      font-size: 22px;
      font-weight: 800;
      color: #1A0A3C;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      color: #4B5563;
      line-height: 1.7;
      margin-bottom: 28px;
    }
    .otp-box {
      background: linear-gradient(135deg, #F5F4FF, #EDE9FE);
      border: 2px solid #DDD6FE;
      border-radius: 18px;
      padding: 28px;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #7C3AED;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 800;
      color: #1A0A3C;
      letter-spacing: 12px;
    }
    .otp-expiry {
      font-size: 12px;
      color: #9CA3AF;
      margin-top: 10px;
    }
    .cta-btn {
      display: block;
      background: linear-gradient(135deg, #6D28D9, #9333EA);
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 32px;
      border-radius: 14px;
      text-align: center;
      margin-bottom: 28px;
    }
    .divider {
      height: 1px;
      background: #EDE9FE;
      margin: 24px 0;
    }
    .footer {
      background: #F9F8FF;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #EDE9FE;
    }
    .footer-text {
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.7;
    }
    .footer-brand {
      font-size: 13px;
      font-weight: 700;
      color: #7C3AED;
      margin-bottom: 4px;
    }
    .note {
      background: #FFF7ED;
      border-left: 4px solid #F97316;
      border-radius: 0 12px 12px 0;
      padding: 12px 16px;
      font-size: 13px;
      color: #92400E;
      margin-bottom: 20px;
    }
  </style>
`;

// SVG brain logo for email (inline, no external deps)
const LOGO_SVG = `
<svg width="56" height="56" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="og" cx="50%" cy="42%" r="52%">
      <stop offset="0%" style="stop-color:#C084FC"/>
      <stop offset="45%" style="stop-color:#9333EA"/>
      <stop offset="100%" style="stop-color:#6D28D9"/>
    </radialGradient>
  </defs>
  <circle cx="100" cy="100" r="88" fill="url(#og)"/>
  <path d="M100 46 C86 46 73 52 67 62 C61 72 60.5 84 63 93 C57 98 53 107 54 116 C55 125 63 132 72 134 C70 141 72 149 79 153 C86 157 95 156 100 150 L100 46 Z" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <path d="M100 46 C114 46 127 52 133 62 C139 72 139.5 84 137 93 C143 98 147 107 146 116 C145 125 137 132 128 134 C130 141 128 149 121 153 C114 157 105 156 100 150 L100 46 Z" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <path d="M76 152 L84 152 L88 143 L93 162 L97 147 L100 153 L124 153" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>`;

const HEADER_HTML = `
<div class="header">
  <div class="logo-circle">${LOGO_SVG}</div>
  <p class="brand-name">MindEase</p>
  <p class="brand-tag">YOUR WELLNESS COMPANION</p>
</div>`;

const FOOTER_HTML = `
<div class="footer">
  <p class="footer-brand">MindEase</p>
  <p class="footer-text">
    You are receiving this email because you have an account with MindEase.<br/>
    If you did not request this, you can safely ignore this email.<br/><br/>
    &copy; 2025 MindEase. All rights reserved.
  </p>
</div>`;

// ─── Welcome email ────────────────────────────────────────────────────────────
export function welcomeEmail(name, email) {
  return {
    subject: 'Welcome to MindEase — Your wellness journey starts now',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/>${BASE_STYLES}</head>
<body><div class="wrapper"><div class="card">
  ${HEADER_HTML}
  <div class="body">
    <p class="greeting">Welcome, ${name || 'Friend'}!</p>
    <p class="message">
      We are so glad you are here. MindEase is your private space to track how you feel, 
      write freely in your journal, detect your emotions, and find music that fits your mood.
      <br/><br/>
      Your account has been created with <strong>${email}</strong>. 
      You are ready to begin your wellness journey.
    </p>
    <div class="divider"></div>
    <p class="message" style="font-size:13px; color:#6B7280;">
      Here is what you can do with MindEase:<br/><br/>
      <strong style="color:#7C3AED;">Journal</strong> — Write freely. Your thoughts are safe here.<br/>
      <strong style="color:#7C3AED;">Scan Emotion</strong> — Let AI read your facial expression.<br/>
      <strong style="color:#7C3AED;">Music</strong> — Get music matched to exactly how you feel.<br/>
      <strong style="color:#7C3AED;">Ease</strong> — Chat with your AI wellness companion anytime.
    </p>
  </div>
  ${FOOTER_HTML}
</div></div></body></html>`,
    text: `Welcome to MindEase, ${name || 'Friend'}! Your account has been created with ${email}. Start your wellness journey today.`
  };
}

// ─── Verify email OTP ─────────────────────────────────────────────────────────
export function verifyEmailTemplate(otp) {
  return {
    subject: 'MindEase — Verify your email address',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/>${BASE_STYLES}</head>
<body><div class="wrapper"><div class="card">
  ${HEADER_HTML}
  <div class="body">
    <p class="greeting">Verify your email</p>
    <p class="message">
      To finish setting up your MindEase account, please use the verification code below.
    </p>
    <div class="otp-box">
      <p class="otp-label">Your verification code</p>
      <p class="otp-code">${otp}</p>
      <p class="otp-expiry">This code expires in 24 hours</p>
    </div>
    <div class="note">
      If you did not create a MindEase account, please ignore this email.
    </div>
  </div>
  ${FOOTER_HTML}
</div></div></body></html>`,
    text: `Your MindEase verification code is: ${otp}. It expires in 24 hours.`
  };
}

// ─── Password reset OTP ───────────────────────────────────────────────────────
export function resetPasswordTemplate(otp) {
  return {
    subject: 'MindEase — Reset your password',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/>${BASE_STYLES}</head>
<body><div class="wrapper"><div class="card">
  ${HEADER_HTML}
  <div class="body">
    <p class="greeting">Reset your password</p>
    <p class="message">
      We received a request to reset your MindEase password. 
      Use the code below to create a new password.
    </p>
    <div class="otp-box">
      <p class="otp-label">Password reset code</p>
      <p class="otp-code">${otp}</p>
      <p class="otp-expiry">This code expires in 15 minutes</p>
    </div>
    <div class="note">
      If you did not request a password reset, your account is safe — you can ignore this email.
    </div>
  </div>
  ${FOOTER_HTML}
</div></div></body></html>`,
    text: `Your MindEase password reset code is: ${otp}. It expires in 15 minutes.`
  };
}
