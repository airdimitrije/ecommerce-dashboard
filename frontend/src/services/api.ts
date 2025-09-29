import axios from "axios";

const api = axios.create({
  baseURL: "https://ecommerce-dashboard-px5q.onrender.com/api/",
});

export default api;