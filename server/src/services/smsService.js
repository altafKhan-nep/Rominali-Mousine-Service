import twilio from 'twilio';

// Twilio is optional. Without TWILIO_* env vars, SMS is logged to the console
// and the API returns `devCode` so the OTP flow stays testable in development.
let client = null;

const configured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

if (configured) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const sendSms = async ({ to, body }) => {
  if (!client) {
    console.log(`\n[DEV SMS] to=${to} body="${body}"\n`);
    return;
  }
  await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE,
    body,
  });
};

export const isSmsConfigured = () => configured;