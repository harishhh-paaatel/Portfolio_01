# Contact form: EmailJS (free plan, works on GitHub Pages)

The form runs entirely in the browser with the official EmailJS SDK (`assets/vendor/emailjs.min.js`).
There is no backend. The live site stays at https://harishhh-paaatel.github.io/Portfolio_01/.

## Configuration (`assets/js/emailjs-config.js`)
| Key | Meaning |
|---|---|
| `serviceId` | EmailJS Email Service (e.g. your Gmail connection) |
| `templateId` | EmailJS Email Template |
| `publicKey` | EmailJS Public Key. Public by design; it is safe in frontend code |

Never put the EmailJS **Private Key** in this repository.

## Template variables
In the EmailJS template use exactly: `{{from_name}}`, `{{reply_to}}`, `{{subject}}`, `{{message}}`.
Set the template's **To Email** to your own inbox and **Reply-To** to `{{reply_to}}`, so replying answers the visitor directly.

## Protect the account (EmailJS dashboard, you must do this)
1. Account → Security → add allowed origins: `https://harishhh-paaatel.github.io` and `http://localhost:3000`.
2. Turn on "Disable API calls from non-browser applications".
3. Optional: enable reCAPTCHA in the same security settings if spam appears. It needs a Google reCAPTCHA key, so it is not enabled by default.

## Built-in protections (client side)
Honeypot field, length limits, one request at a time, a 30-second cooldown, identical-message suppression for 10 minutes.
These reduce accidents and basic bots; the dashboard origin restriction is what protects your quota.
Free-plan quota is limited per month; when it is exhausted the form shows an error and keeps the visitor's text.

## Testing
Success is shown only after EmailJS returns status 200. To verify delivery: submit the form on localhost, then on the live site,
and confirm each email arrives in your inbox (check Spam on first use).
