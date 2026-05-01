const crypto = require('crypto');

function makeToken(length = 24) {
  return crypto.randomBytes(length).toString('hex');
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { makeToken, makeOtp };
