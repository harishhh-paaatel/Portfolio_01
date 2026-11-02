/* EmailJS configuration (frontend). These three values are PUBLIC identifiers by design:
   the Public Key is meant to live in browser code. They are not secrets. Never put your EmailJS
   Private Key (or any other credential) here.
   Protect the account in the EmailJS dashboard instead: Account -> Security -> allowed origins
   (https://harishhh-paaatel.github.io and http://localhost:3000), and turn on
   "Disable API calls from non-browser applications". See docs/EMAILJS_SETUP.md.

   EmailJS template variables used by the form:
     {{from_name}}  {{reply_to}}  {{subject}}  {{message}}                                      */
window.EMAILJS_CONFIG = {
  serviceId: 'service_0o6dfj9',
  templateId: 'template_nfunpwl',
  publicKey: 'qrvzqF2tmuGQ2QevA'
};
