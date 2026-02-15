const form = document.getElementById("waitlist-form");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submit-btn");
const statusText = document.getElementById("form-status");
const successMessage = document.getElementById("success-message");
const honeypotInput = document.getElementById("website");

const APPS_SCRIPT_URL = "__APPS_SCRIPT_WEB_APP_URL__";
const MIN_FORM_FILL_MS = 2500;

if (
  form &&
  emailInput &&
  submitBtn &&
  statusText &&
  successMessage &&
  honeypotInput
) {
  let isSubmitting = false;
  const startedAt = Date.now();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const captchaToken =
      typeof window.turnstile !== "undefined"
        ? window.turnstile.getResponse()
        : "";

    if (!captchaToken) {
      statusText.textContent = "Please complete the CAPTCHA.";
      return;
    }

    if (Date.now() - startedAt < MIN_FORM_FILL_MS) {
      statusText.textContent = "Please wait a moment before submitting.";
      return;
    }

    if (!APPS_SCRIPT_URL.startsWith("https://script.google.com/")) {
      statusText.textContent = "Form is not configured yet.";
      return;
    }

    isSubmitting = true;
    statusText.textContent = "";
    submitBtn.disabled = true;
    const selectedPlatform = form.querySelector('input[name="platform"]:checked');
    const payload = {
      email: emailInput.value.trim().toLowerCase(),
      platform: selectedPlatform ? selectedPlatform.value : "",
      startedAt,
      captchaToken,
      website: honeypotInput.value.trim(),
      userAgent: navigator.userAgent,
    };

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.message || "Submission blocked");
      }

      form.reset();
      form.hidden = true;
      successMessage.hidden = false;
      if (typeof window.turnstile !== "undefined") {
        window.turnstile.reset();
      }
    } catch (error) {
      statusText.textContent = "Something went wrong. Please try again.";
      if (typeof window.turnstile !== "undefined") {
        window.turnstile.reset();
      }
      submitBtn.disabled = false;
      isSubmitting = false;
    }
  });
}
