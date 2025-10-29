import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: "https://bookit-g5el.onrender.com"
});

// Add Clerk token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token from window.Clerk if available
    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Added Clerk token to request');
          console.log(token)
        } else {
          console.log('⚠️ No Clerk token available');
        }
      } catch (error) {
        console.error('❌ Error getting Clerk token:', error);
      }
    } else {
      console.log('⚠️ Clerk not available or no session');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;