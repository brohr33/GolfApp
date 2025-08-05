import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Firebase Configuration for Golf Scorecard Pro
window.FirebaseConfig = (function() {
    'use strict';
    
    // Firebase configuration
   const firebaseConfig = {
  apiKey: "AIzaSyCsNxdpV1cjewToltfqXcZFQNWjpYDvy-s",
  authDomain: "golf-scorecard-33.firebaseapp.com",
  databaseURL: "https://golf-scorecard-33-default-rtdb.firebaseio.com",
  projectId: "golf-scorecard-33",
  storageBucket: "golf-scorecard-33.firebasestorage.app",
  messagingSenderId: "291738902562",
  appId: "1:291738902562:web:a5e4ae92c27339cce5aa7b",
  measurementId: "G-K0KWNY4EG4"
};    
    // Initialize Firebase
    let firebaseApp = null;
    let database = null;
    let isInitialized = false;
  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
  
    const initialize = () => {
        try {
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }
            
            firebaseApp = firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            isInitialized = true;
            
            console.log('✅ Firebase initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            // Fallback to local mode
            isInitialized = false;
            return false;
        }
    };
    
    const getDatabase = () => {
        if (!isInitialized) {
            throw new Error('Firebase not initialized');
        }
        return database;
    };
    
    const isOnline = () => {
        return isInitialized && navigator.onLine;
    };
    
    // Check if we're in demo mode (when Firebase is not properly configured)
    const isDemoMode = () => {
        return !isInitialized || firebaseConfig.apiKey.includes('Demo');
    };
    
    return {
        initialize,
        getDatabase,
        isOnline,
        isDemoMode,
        get isInitialized() { return isInitialized; }
    };
})();