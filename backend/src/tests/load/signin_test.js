import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

// Load users from users.json
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

export const options = {
  stages: [
    { duration: '10s', target: 5000 }, // Ramp up to 5000 users over 10s
    { duration: '30s', target: 5000 }, // Stay at 5000 users for 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
    'checks{check:Signin successful}': ['rate>0.95'], // 95% of sign-ins should succeed
  },
};

export default function () {
  const BASE_URL = `http://localhost/api`;

  // Pick a random user from the loaded data
  const user = users[Math.floor(Math.random() * users.length)];
  console.log(user.email , user.password);
  const signinPayload = JSON.stringify({
    email: user.email,
    password: "Password123",
  });

  const signinHeaders = { 'Content-Type': 'application/json' };
  const signinRes = http.post(`${BASE_URL}/signin`,signinPayload, { headers: signinHeaders });

  check(signinRes, { 'Signin successful': (r) => r.status === 200 });
}
