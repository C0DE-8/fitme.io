const FLW_BASE_URL = (process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3').replace(/\/+$/g, '');
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

function ensureConfigured() {
  if (!FLW_SECRET_KEY) {
    const err = new Error('Flutterwave is not configured');
    err.statusCode = 503;
    throw err;
  }
}

async function flutterwaveRequest(path, options = {}) {
  ensureConfigured();

  const response = await fetch(`${FLW_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === 'error') {
    const err = new Error(data.message || 'Flutterwave request failed');
    err.statusCode = response.status || 502;
    err.details = data;
    throw err;
  }

  return data;
}

async function getBanks(country = 'NG') {
  const data = await flutterwaveRequest(`/banks/${encodeURIComponent(country)}`, {
    method: 'GET'
  });

  return data.data || [];
}

async function resolveAccount(accountBank, accountNumber) {
  const data = await flutterwaveRequest('/accounts/resolve', {
    method: 'POST',
    body: JSON.stringify({
      account_bank: accountBank,
      account_number: accountNumber
    })
  });

  return data.data || null;
}

module.exports = {
  getBanks,
  resolveAccount
};
