import axios from "axios";

const BackendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
console.log("Backend URL:", BackendURL);
const API = axios.create({

  baseURL: `${BackendURL}/api`, // backend base
});

// attach JWT token if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
