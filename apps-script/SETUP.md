# Google Apps Script Setup

## 1) Create Google Sheet
1. Create a new Google Sheet.
2. Copy the Sheet ID from the URL (between `/d/` and `/edit`).

## 2) Create Apps Script Web App
1. Open [https://script.new](https://script.new).
2. Replace default code with content from `apps-script/Code.gs`.
3. In **Project Settings** -> **Script Properties**, add:
   - `WAITLIST_SHEET_ID` = your sheet ID
   - `TURNSTILE_SECRET` = Cloudflare Turnstile secret key
   - `ALERT_EMAIL` = `Yroslavkr1995@gmail.com`
4. Click **Deploy** -> **New deployment** -> **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployed `/exec` URL.

## 3) Create Cloudflare Turnstile
1. Go to Cloudflare Turnstile dashboard.
2. Create a widget for your domain:
   - Production: `krasnokutskii.github.io`
   - Local test: `localhost`
3. Copy keys:
   - Site key -> place in `index.html` `data-sitekey`
   - Secret key -> place in script property `TURNSTILE_SECRET`

## 4) Wire frontend config
1. In `index.html`, replace `__TURNSTILE_SITE_KEY__` with your Turnstile site key.
2. In `script.js`, replace `__APPS_SCRIPT_WEB_APP_URL__` with your Apps Script `/exec` URL.

## 5) Deploy website
```bash
cd /Users/iaroslavk/Documents/ComingSoonWeb
git add index.html script.js styles.css apps-script/Code.gs apps-script/SETUP.md
git commit -m "Switch to Apps Script waitlist with anti-bot checks"
git push
```

## 6) Verify behavior
- Human valid submit: accepted + row in sheet + Gmail alert.
- Fast submit (<2.5s): blocked row, no Gmail alert.
- Filled honeypot: blocked row, no Gmail alert.
- Missing CAPTCHA: blocked row, no Gmail alert.
