import axios from 'axios';

const AUTH_URL = 'http://localhost:8000/api/auth/token/';

export async function login(username: string, password: string) {
  const { data } = await axios.post(AUTH_URL, { username, password });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
}

export function logout() {
  localStorage.clear();
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}