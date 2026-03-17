/**
 * Razorpay X API (Contacts + Fund Accounts) for vendor payouts.
 * Uses same RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET; base URL is api.razorpay.com/v1
 */
const axios = require('axios');

const BASE_URL = 'https://api.razorpay.com/v1';

function getAuth() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) return null;
  return {
    username: key,
    password: secret
  };
}

function getClient() {
  const auth = getAuth();
  if (!auth) return null;
  return axios.create({
    baseURL: BASE_URL,
    auth,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a Contact (required before adding fund account).
 * @param {{ name: string, email: string, reference_id?: string }} payload
 * @returns {{ id: string } | null} contact id or null if X not configured
 */
async function createContact(payload) {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.post('/contacts', {
    name: payload.name,
    email: payload.email || undefined,
    contact: payload.contact || undefined,
    type: 'vendor',
    reference_id: payload.reference_id || undefined
  });
  return data;
}

/**
 * Create a Fund Account of type VPA (UPI).
 * @param {{ contact_id: string, vpa_address: string }} payload
 * @returns {{ id: string, vpa?: { address: string } } | null}
 */
async function createFundAccountVpa(payload) {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.post('/fund_accounts', {
    account_type: 'vpa',
    contact_id: payload.contact_id,
    vpa: { address: payload.vpa_address }
  });
  return data;
}

/**
 * Mask UPI for display e.g. "abc***@paytm"
 */
function maskUpi(vpa) {
  if (!vpa || typeof vpa !== 'string') return null;
  const at = vpa.indexOf('@');
  if (at <= 0) return '••••••••';
  const local = vpa.slice(0, at);
  const handle = vpa.slice(at);
  if (local.length <= 3) return '***' + handle;
  return local.slice(0, 2) + '***' + handle;
}

module.exports = {
  getAuth,
  createContact,
  createFundAccountVpa,
  maskUpi,
  isConfigured: () => !!getAuth()
};
