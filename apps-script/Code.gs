const CONFIG = {
  SHEET_NAME: 'waitlist',
  MIN_FORM_FILL_MS: 2500,
  SOURCE: 'github_pages',
  ALLOWED_PLATFORMS: ['iPhone', 'Android'],
};

function doPost(e) {
  const now = Date.now();
  const payload = parsePayload_(e);

  if (!payload) {
    return jsonResponse_({ ok: false, message: 'invalid' });
  }

  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const platform = String(payload.platform || '').trim();
  const website = String(payload.website || '').trim();
  const captchaToken = String(payload.captchaToken || '').trim();
  const startedAt = Number(payload.startedAt || 0);
  const userAgent = String(payload.userAgent || '').trim();

  let status = 'accepted';
  let blockReason = '';

  if (!isValidEmail_(normalizedEmail)) {
    status = 'blocked';
    blockReason = 'invalid_email';
  } else if (!CONFIG.ALLOWED_PLATFORMS.includes(platform)) {
    status = 'blocked';
    blockReason = 'invalid_platform';
  } else if (website !== '') {
    status = 'blocked';
    blockReason = 'honeypot';
  } else if (!Number.isFinite(startedAt) || startedAt <= 0 || now - startedAt < CONFIG.MIN_FORM_FILL_MS) {
    status = 'blocked';
    blockReason = 'too_fast';
  } else if (startedAt > now + 60 * 1000) {
    status = 'blocked';
    blockReason = 'invalid_started_at';
  } else if (!captchaToken) {
    status = 'blocked';
    blockReason = 'missing_captcha';
  } else if (!verifyTurnstile_(captchaToken)) {
    status = 'blocked';
    blockReason = 'captcha_failed';
  }

  appendSubmissionRow_({
    createdAt: new Date(),
    email: normalizedEmail,
    platform,
    source: CONFIG.SOURCE,
    userAgent,
    status,
    blockReason,
  });

  if (status === 'accepted') {
    sendAlertEmail_(normalizedEmail, platform, userAgent);
    return jsonResponse_({ ok: true, message: 'accepted' });
  }

  return jsonResponse_({ ok: false, message: 'blocked' });
}

function parsePayload_(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return null;
    }
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return null;
  }
}

function isValidEmail_(email) {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(email);
}

function verifyTurnstile_(token) {
  const secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if (!secret) {
    return false;
  }

  try {
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: {
        secret,
        response: token,
      },
      muteHttpExceptions: true,
    });

    const body = JSON.parse(response.getContentText() || '{}');
    return body.success === true;
  } catch (error) {
    return false;
  }
}

function appendSubmissionRow_(row) {
  const sheet = getWaitlistSheet_();
  sheet.appendRow([
    row.createdAt,
    row.email,
    row.platform,
    row.source,
    row.userAgent,
    row.status,
    row.blockReason,
  ]);
}

function getWaitlistSheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('WAITLIST_SHEET_ID');
  if (!sheetId) {
    throw new Error('Missing WAITLIST_SHEET_ID script property.');
  }

  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow([
      'created_at',
      'email',
      'platform',
      'source',
      'user_agent',
      'status',
      'block_reason',
    ]);
  }

  return sheet;
}

function sendAlertEmail_(email, platform, userAgent) {
  const recipient =
    PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL') ||
    Session.getEffectiveUser().getEmail();

  const subject = 'New waitlist signup (accepted)';
  const body =
    'A new waitlist signup was accepted.\n\n' +
    'Email: ' + email + '\n' +
    'Platform: ' + platform + '\n' +
    'Source: ' + CONFIG.SOURCE + '\n' +
    'User-Agent: ' + userAgent;

  MailApp.sendEmail(recipient, subject, body);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
