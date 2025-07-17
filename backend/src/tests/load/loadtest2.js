import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '10s', target: 5000 }, // Ramp up to 5000 users over 10s
    { duration: '30s', target: 5000 }, // Stay at 5000 users for 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
    'checks{check:Signup successful}': ['rate>0.95'], // 95% of signups should succeed
  },
};

export default function () {
  const BASE_URL = `http://localhost/api`;
  const shortUUID = uuidv4().split('-')[0]; // Use only the first segment of UUID

  // 1️⃣ Signup Request
  const signupPayload = JSON.stringify({
    name: `U${__VU}${shortUUID}`,
    email: `u${__VU}${shortUUID}@ex.com`,
    password: 'Password123',
  });

  const signupHeaders = { 'Content-Type': 'application/json' };
  const signupRes = http.post(`${BASE_URL}/signup`, signupPayload, { headers: signupHeaders });

  check(signupRes, { 'Signup successful': (r) => r.status === 200 });

  // Extract sessionId from Set-Cookie header
  let sessionCookie = '';
  if (signupRes.headers['Set-Cookie']) {
    const cookies = signupRes.headers['Set-Cookie'].split(';');
    sessionCookie = cookies[0];
  }

  if (!sessionCookie) {
    console.error(`No session cookie received for VU ${__VU}`);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie,
  };

  // 2️⃣ Account Generation Request (GET)
  const accountRes = http.get(`${BASE_URL}/accountGeneration`, { headers: authHeaders });
  check(accountRes, { 'Account generation successful': (r) => r.status === 200 });

  // Extract accountNumber from response
  let accountNumber;
  try {
    accountNumber = JSON.parse(accountRes.body).accountNumber;
  } catch (e) {
    console.error(`Failed to extract accountNumber for VU ${__VU}`);
    return;
  }

  if (!accountNumber) {
    console.error(`No account number received for VU ${__VU}`);
    return;
  }

  // 3️⃣ Deposit Request (POST)
  const depositPayload = JSON.stringify({
    accountNumber,
    amount: 1000, // Test deposit amount
  });

  const depositRes = http.post(`${BASE_URL}/deposit`, depositPayload, { headers: authHeaders });
  check(depositRes, { 'Deposit successful': (r) => r.status === 202 });
}
