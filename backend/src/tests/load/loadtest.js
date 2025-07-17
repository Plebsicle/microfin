import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [                                                                                                                                
    { duration: '10s', target: 5000 },  // Ramp up to 5000 users over 10 seconds
    { duration: '30s', target: 5000 },  // Stay at 5000 users for 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
    'checks{check:Signup successful}': ['rate>0.95'], // 95% of signups should succeed
  },
};

export default function () {
  const BASE_URL = 'http://localhost/api';
  
  const signupPayload = JSON.stringify({
    name: `User${__VU}${uuidv4()}`,
    email: `user${__VU}${uuidv4()}@example.com`,
    password: 'Password123'
  });

  const signupHeaders = { 'Content-Type': 'application/json' };
  const signupRes = http.post(`${BASE_URL}/signup`, signupPayload, { headers: signupHeaders });

  check(signupRes, { 'Signup successful': (r) => r.status === 200 });
}