async function sendEmail({ to, subject, text }) {
  console.log('[EMAIL MOCK]', { to, subject, text });
  return { success: true, mode: 'mock' };
}

module.exports = { sendEmail };
