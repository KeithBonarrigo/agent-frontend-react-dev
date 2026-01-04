const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
  apiToken: import.meta.env.VITE_API_TOKEN || "",
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

export default config;