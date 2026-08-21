import helper from "../services/helper.service.js";
import sendMail from "../services/mailer.service.js";

// Where these notification emails land. Defaults to the same inbox already
// used for OTP mail so no extra setup is required out of the box.
const NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;

const rowsToHtmlTable = (data) => {
  const rows = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">${key}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${value}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%;max-width:640px;">${rows}</table>`;
};

// Handles the course sign-up / registration form submitted from the site.
export const sendSignUpNotification = async (req, res) => {
  try {
    const payload = req.body || {};

    const sent = await sendMail({
      to: NOTIFICATION_EMAIL,
      subject: `Nowe zgłoszenie: ${payload.studentName1 || "brak imienia"} (${payload.branch || "brak oddziału"
        })`,
      html: `<h2>Nowe zgłoszenie na kurs</h2>${rowsToHtmlTable(payload)}`,
      replyTo: payload.parentEmail || undefined,
    });

    if (!sent) {
      return helper(res, {
        type: "error",
        message: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.",
      });
    }

    return helper(res, {
      type: "success",
      message: "Zgłoszenie zostało wysłane.",
    });
  } catch (error) {
    console.error("sendSignUpNotification error:", error);
    return helper(res, {
      type: "error",
      message: "Nie udało się wysłać zgłoszenia.",
    });
  }
};

// Handles the generic "contact us" form (e.g. from the blog pages).
export const sendContactUsMessage = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body || {};

    if (!name || !email) {
      return helper(res, {
        type: "bad",
        message: "Imię i adres e-mail są wymagane.",
      });
    }

    const sent = await sendMail({
      to: NOTIFICATION_EMAIL,
      subject: `Nowa wiadomość kontaktowa od ${name}${topic ? ` — ${topic}` : ""}`,
      html: `<h2>Nowa wiadomość z formularza kontaktowego</h2>${rowsToHtmlTable({
        name,
        email,
        topic,
        message,
      })}`,
      replyTo: email,
    });

    if (!sent) {
      return helper(res, {
        type: "error",
        message: "Nie udało się wysłać wiadomości. Spróbuj ponownie później.",
      });
    }

    return helper(res, {
      type: "success",
      message: "Wiadomość została wysłana.",
    });
  } catch (error) {
    console.error("sendContactUsMessage error:", error);
    return helper(res, {
      type: "error",
      message: "Nie udało się wysłać wiadomości.",
    });
  }
};
