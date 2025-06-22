// Utility functions for Golf Scorecard Pro
window.GolfUtils = (function() {
    'use strict';
    
    // DOM helpers
    const $ = (id) => document.getElementById(id);
    
    const updateStatus = (message, type = 'info') => {
        const status = $('loadStatus');
        if (status) {
            status.textContent = message;
            status.className = `status status-${type}`;
        }
    };
    
    const showApp = () => {
        $('loading').className = 'hidden';
        $('app').className = '';
        $('error').className = 'hidden';
    };
    
    const showError = () => {
        $('loading').className = 'hidden';
        $('app').className = 'hidden';
        $('error').className = '';
    };
    
    // Library loading with error handling
    const loadScript = (src, name) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                updateStatus(`${name} loaded successfully`, 'success');
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load ${name} from ${src}`);
                reject(new Error(`${name} load failed`));
            };
            document.head.appendChild(script);
        });
    };
    
    // Validation helpers
    const validatePlayerName = (name) => {
        return name && name.trim().length > 0;
    };
    
    const validateHandicap = (handicap) => {
        const h = parseInt(handicap);
        return !isNaN(h) && h >= 0 && h <= 54;
    };
    
    const validateScore = (score) => {
        const s = parseInt(score);
        return !isNaN(s) && s >= 1 && s <= 15;
    };
    
    // Formatting helpers
    const formatTopar = (score, par) => {
        const toPar = score - par;
        if (toPar === 0) return 'E';
        return toPar > 0 ? `+${toPar}` : `${toPar}`;
    };
    
    const formatPlayerName = (name, index) => {
        return name && name.trim() ? name.trim() : `Player ${index + 1}`;
    };
    
    // Local storage helpers (with error handling)
    const saveToStorage = (key, data) => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`golf-scorecard-${key}`, JSON.stringify(data));
            }
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    };
    
    const loadFromStorage = (key) => {
        try {
            if (typeof localStorage !== 'undefined') {
                const data = localStorage.getItem(`golf-scorecard-${key}`);
                return data ? JSON.parse(data) : null;
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
        return null;
    };
    
    // Error handling
    const handleError = (error, context = '') => {
        console.error(`Error in ${context}:`, error);
        updateStatus(`Error: ${error.message}`, 'error');
    };
    
    // Debounce function for search inputs
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // Public API
    return {
        $,
        updateStatus,
        showApp,
        showError,
        loadScript,
        validatePlayerName,
        validateHandicap,
        validateScore,
        formatTopar,
        formatPlayerName,
        saveToStorage,
        loadFromStorage,
        handleError,
        debounce
    };
})();