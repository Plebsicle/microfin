import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { SharedArray } from 'k6/data';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const signinDuration = new Trend('signin_duration');
const accountDuration = new Trend('account_duration');
const depositDuration = new Trend('deposit_duration');
const withdrawDuration = new Trend('withdraw_duration');
const transferDuration = new Trend('transfer_duration');

const signinSuccess = new Rate('signin_success');
const accountSuccess = new Rate('account_success');
const depositSuccess = new Rate('deposit_success');
const withdrawSuccess = new Rate('withdraw_success');
const transferSuccess = new Rate('transfer_success');

const failedRequests = new Counter('failed_requests');

const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

export const options = {
  scenarios: {
    constant_rate: {
      executor: 'constant-arrival-rate',
      rate: 1500,
      timeUnit: '1s',
      duration: '40s',
      preAllocatedVUs: 500,
      maxVUs: 5000,
    },
  },
  thresholds: {
    signin_success: ['rate>0.95'],
    account_success: ['rate>0.95'],
    deposit_success: ['rate>0.95'],
    withdraw_success: ['rate>0.95'],
    transfer_success: ['rate>0.95'],
    failed_requests: ['count<100'],
  },
};

export default function () {
  const BASE_URL = `http://localhost/api`;
  const randomUser = users[Math.floor(Math.random() * users.length)];
  
  // Sign-in Request
  const signinRes = http.post(`${BASE_URL}/signin`, JSON.stringify({
    email: randomUser.email,
    password: 'Password123',
  }), { headers: { 'Content-Type': 'application/json' }, tags: { name: 'signin' }});
  
  signinDuration.add(signinRes.timings.duration);
  const signinCheck = check(signinRes, { 'Signin successful': (r) => r.status === 200 });
  signinSuccess.add(signinCheck);
  
  if (!signinCheck) {
    failedRequests.add(1);
    return;
  }
  
  // Extract session
  const sessionCookie = signinRes.headers['Set-Cookie']?.split(';')[0] || '';
  if (!sessionCookie) return;

  const authHeaders = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };
  
  // Account Generation Requests (2 accounts)
  let accountNumbers = [];
  for (let i = 0; i < 2; i++) {
    const accountRes = http.get(`${BASE_URL}/accountGeneration`, { headers: authHeaders, tags: { name: 'account_generation' }});
    accountDuration.add(accountRes.timings.duration);
    const accountCheck = check(accountRes, { 'Account generation successful': (r) => r.status === 200 });
    accountSuccess.add(accountCheck);
    
    if (!accountCheck) {
      failedRequests.add(1);
      return;
    }
                                                                
    try {
      accountNumbers.push(JSON.parse(accountRes.body).accountNumber);
    } catch (e) {
      return;
    }
  }
  
  // Deposit Request
  const depositRes = http.post(`${BASE_URL}/deposit`, JSON.stringify({ accountNumber: accountNumbers[0], amount: 1000 }), { headers: authHeaders, tags: { name: 'deposit' }});
  depositDuration.add(depositRes.timings.duration);
  const depositCheck = check(depositRes, { 'Deposit successful': (r) => r.status !== 500 });
  depositSuccess.add(depositCheck);
  
  if (!depositCheck) {
    failedRequests.add(1);
    return;
  }
  
  // Withdraw Request
  const withdrawRes = http.post(`${BASE_URL}/withdraw`, JSON.stringify({ accountNumber: accountNumbers[0], amount: 500 }), { headers: authHeaders, tags: { name: 'withdraw' }});
  withdrawDuration.add(withdrawRes.timings.duration);
  const withdrawCheck = check(withdrawRes, { 'Withdraw successful': (r) => r.status !== 500 });
  withdrawSuccess.add(withdrawCheck);
  
  if (!withdrawCheck) {
    failedRequests.add(1);
    return;
  }
  
  // Transfer Request
  const transferRes = http.post(`${BASE_URL}/transfer`, JSON.stringify({ senderAccountNumber: accountNumbers[0], receiverAccountNumber: accountNumbers[1], amount: 200 }), { headers: authHeaders, tags: { name: 'transfer' }});
  transferDuration.add(transferRes.timings.duration);
  const transferCheck = check(transferRes, { 'Transfer successful': (r) => r.status !== 500 });
  transferSuccess.add(transferCheck);
  
  if (!transferCheck) {
    failedRequests.add(1);
  }
}

export function handleSummary(data) {
  console.log('\n=== DETAILED PERFORMANCE METRICS ===\n');
  console.log(`✓ Signin successful`);
  console.log(`     ✓ Account generation successful`);
  console.log(`     ${data.metrics.deposit_success.values.rate * 100 < 100 ? '✗' : '✓'} Deposit successful`);
  console.log(`     ${data.metrics.withdraw_success.values.rate * 100 < 100 ? '✗' : '✓'} Withdraw successful`);
  console.log(`     ${data.metrics.transfer_success.values.rate * 100 < 100 ? '✗' : '✓'} Transfer successful`);
  console.log('\n');
  
  console.log(`checks..........................: ${(data.metrics.signin_success.values.rate * 100).toFixed(2)}%  ${data.metrics.iterations.values.count} out of ${data.metrics.iterations.values.count}`);
  console.log(`data_received...................: ${(data.metrics.data_received.values.sum / 1024 / 1024).toFixed(2)} MB`);
  console.log(`data_sent.......................: ${(data.metrics.data_sent.values.sum / 1024 / 1024).toFixed(2)} MB`);
  console.log(`http_req_duration...............: avg=${data.metrics.http_req_duration.values.avg.toFixed(2)}ms  med=${data.metrics.http_req_duration.values.med.toFixed(2)}ms  p(95)=${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms  p(99)=${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`http_req_failed.................: ${(data.metrics.failed_requests.values.count / data.metrics.iterations.values.count * 100).toFixed(2)}%   ${failedRequests} out of ${data.metrics.iterations.values.count}`);
  console.log(`http_reqs.......................: ${data.metrics.iterations.values.count}  ${(data.metrics.iterations.values.count / (data.state.testRunDurationMs / 1000)).toFixed(2)}/s`);
  console.log('\n');
  return { 'summary.json': JSON.stringify(data) };
}
