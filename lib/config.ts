/**
 * Application Configuration
 * 
 * USE_MOCK_DATA: Set to true to use mock data instead of API calls
 * This is useful for testing and development when backend is not available
 */
export const config = {
  // Set to true to use mock data, false to use real API
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false,
  
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  
  // Test Mode - enables additional logging and test features
  TEST_MODE: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true',
};

// Helper function to check if mock data should be used
export const shouldUseMockData = () => config.USE_MOCK_DATA;

// Helper function to check if test mode is enabled
export const isTestMode = () => config.TEST_MODE;








