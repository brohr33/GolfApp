// Firebase Configuration for Golf Scorecard Pro
window.FirebaseConfig = (function() {
    'use strict';
    
    // Firebase configuration - Your actual Firebase project
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
    
    const initialize = () => {
        try {
            if (typeof firebase === 'undefined') {
                console.log('Firebase SDK not loaded, running in demo mode');
                isInitialized = false;
                return false;
            }
            
            firebaseApp = firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            isInitialized = true;
            
            console.log('✅ Firebase initialized successfully with project: golf-scorecard-33');
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
        return !isInitialized;
    };
    
    return {
        initialize: initialize,
        getDatabase: getDatabase,
        isOnline: isOnline,
        isDemoMode: isDemoMode,
        get isInitialized() { return isInitialized; }
    };
})();