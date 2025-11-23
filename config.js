// API Configuration
// This file handles switching between development and production environments

const isDevelopment = __DEV__ || false; // __DEV__ is true when running in development mode

// Configuration object
const Config = {
  // Development (local server)
  development: {
    BASE_URL: 'http://192.168.0.112:8000', // Your local IP
    API_URL: 'http://192.168.0.112:8000/accounts',
  },
  
  // Production (Render deployment)
  production: {
    BASE_URL: 'https://labapp-bnpd.onrender.com',
    API_URL: 'https://labapp-bnpd.onrender.com/accounts',
  }
};

// Export the current environment configuration
const currentConfig = isDevelopment ? Config.development : Config.production;

export default {
  ...currentConfig,
  
  // Authentication endpoints
  LOGIN_URL: `${currentConfig.API_URL}/token/`,
  REGISTER_URL: `${currentConfig.API_URL}/register/`,
  VERIFY_CODE_URL: `${currentConfig.API_URL}/verify-code/`,
  REFRESH_TOKEN_URL: `${currentConfig.API_URL}/token/refresh/`,
  USER_PROFILE_URL: `${currentConfig.API_URL}/me/`,
  
  // Patient endpoints
  PATIENTS_URL: `${currentConfig.API_URL}/patients/`,
  PATIENT_DETAIL_URL: (id) => `${currentConfig.API_URL}/patients/${id}/`,
  PATIENT_TREATMENT_URL: (patientId) => `${currentConfig.API_URL}/patients/${patientId}/treatment/`,
  PATIENT_STEPS_URL: (patientId) => `${currentConfig.API_URL}/patients/${patientId}/steps/`,
  PATIENT_PHOTOS_URL: (stepId) => `${currentConfig.API_URL}/treatment-steps/${stepId}/photos/`,
  
  // Doctor endpoints
  DOCTOR_PATIENTS_URL: `${currentConfig.API_URL}/doctor/patients/`,
  DOCTOR_PATIENT_STEPS_URL: (patientId) => `${currentConfig.API_URL}/doctor/patients/${patientId}/steps/`,
  DOCTOR_REPORTS_URL: `${currentConfig.API_URL}/doctor/reports/`,
  
  // Treatment endpoints
  TREATMENT_STEPS_URL: `${currentConfig.API_URL}/treatment-steps/`,
  TREATMENT_STEP_DETAIL_URL: (id) => `${currentConfig.API_URL}/treatment-steps/${id}/`,
  TREATMENT_STEP_PHOTOS_URL: (stepId) => `${currentConfig.API_URL}/treatment-steps/${stepId}/photos/`,
  
  // Photo upload endpoints
  UPLOAD_PHOTO_URL: (stepId) => `${currentConfig.API_URL}/treatment-steps/${stepId}/upload-photo/`,
  
  // Reports endpoints
  PATIENT_REPORTS_URL: (patientId) => `${currentConfig.API_URL}/patients/${patientId}/reports/`,
  GENERATE_REPORT_URL: (patientId) => `${currentConfig.API_URL}/patients/${patientId}/generate-report/`,
  
  // Media URL for serving uploaded files
  MEDIA_URL: `${currentConfig.BASE_URL}/media/`,
  
  // Helper function to get full URL
  getUrl: (endpoint) => `${currentConfig.BASE_URL}${endpoint}`,
  
  // Helper function to get media URL
  getMediaUrl: (path) => `${currentConfig.BASE_URL}/media/${path}`,
  
  // Debug info
  isDevelopment,
  currentEnvironment: isDevelopment ? 'development' : 'production',
};
