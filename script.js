const form = document.getElementById("waitlist-form");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submit-btn");
const statusText = document.getElementById("form-status");
const successMessage = document.getElementById("success-message");

if (form && emailInput && submitBtn && statusText && successMessage) {
  let isSubmitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    isSubmitting = true;
    statusText.textContent = "";
    submitBtn.disabled = true;

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      form.hidden = true;
      successMessage.hidden = false;
    } catch {
      statusText.textContent = "Something went wrong. Please try again.";
      submitBtn.disabled = false;
      isSubmitting = false;
    }
  });
}
