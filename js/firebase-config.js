// Firebase Configuration
// Replace with your actual Firebase project config
const firebaseConfig = {
  // The API key for authenticating with Firebase services
  apiKey: 'DEMO_MODE',
  // The domain used for Firebase authentication
  authDomain: 'pharmacare-demo.firebaseapp.com',
  // The unique identifier for the Firebase project
  projectId: 'pharmacare-demo',
  // The Cloud Storage bucket URL for storing files
  storageBucket: 'pharmacare-demo.appspot.com',
  // The sender ID for Firebase Cloud Messaging
  messagingSenderId: '000000000000',
  // The unique application ID within the Firebase project
  appId: '1:000000000000:web:0000000000000000'
};

// Flag to determine if the application is running in demo mode
const IS_DEMO_MODE = firebaseConfig.apiKey === 'DEMO_MODE';
