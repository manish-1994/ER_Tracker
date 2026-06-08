import axios from "axios";

// Configure axios instance to point to the running backend (port 8001) and prepend the API prefix
const api = axios.create({
  baseURL: "http://127.0.0.1:8001/api",
});


// Users endpoints (SuperAdmin only)
export const getUsers = () => api.get('/users');
export const createUser = (data: { username: string; password: string; role_ids?: number[] }) =>
  api.post('/users', data);
export const updateUser = (id: number, data: any) => api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Roles endpoints
export const getRoles = () => api.get('/roles');
export const createRole = (data: any) => api.post('/roles', data);
export const updateRole = (id: number, data: any) => api.put(`/roles/${id}`, data);
export const deleteRole = (id: number) => api.delete(`/roles/${id}`);
// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  console.log("TOKEN:", token);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
    console.log("AUTH HEADER:", (config.headers as any)["Authorization"]);
  }
  return config;
});

export default api;
