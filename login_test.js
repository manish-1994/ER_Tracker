import fetch from 'node-fetch';

const apiBase = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const username = 'superadmin';
const password = 'SuperAdmin@123';

async function login() {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await response.json();
  console.log('LOGIN RESPONSE BODY:', data);
}

login().catch(console.error);