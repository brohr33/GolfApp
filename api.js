// Golf Course API integration
window.GolfAPI = (function() {
    'use strict';
    
    const API_KEY = 'VLNANFMEVIQBJ6T75A52WMQUKI';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // API endpoints to try
    const ENDPOINTS = [
        'https://api.golfcourseapi.com/courses',
        'https://api.golfcourseapi.com/v1/courses',
        'https://golfcourseapi.com/api/courses'
    ];
    
    // In-memory cache
    const cache = new Map();
    
    // Check if cache entry is valid
    const isCacheValid = (entry) => {
        return entry && (Date.now() - entry.timestamp) < CACHE_DURATION;
    };
    
    // Get from cache
    const getFromCache = (key) => {
        const entry = cache.get(key);
        return isCacheValid(entry) ? entry.data : null;
    };
    
    // Save to cache
    const saveToCache = (key, data) => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    };
    
    // Make API request with proper headers
    const makeAPIRequest = async (endpoint, searchQuery) => {
        const url = `${endpoint}?search=${encodeURIComponent(searchQuery)}`;
        
        console.log(`Trying API endpoint: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Key ${API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    };
    
    // Transform API response to our format
    const transformCourseData = (apiData) => {
        if (!apiData) return [];
        
        // Handle different response structures
        let courses = [];
        if (Array.isArray(apiData)) {
            courses = apiData;
        } else if (apiData.courses && Array.isArray(apiData.courses)) {
            courses = apiData.courses;
        } else if (apiData.data && Array.isArray(apiData.data)) {
            courses = apiData.data;
        } else if (apiData.results && Array.isArray(apiData.results)) {
            courses = apiData.results;
        }
        
        return courses.map((course, index) => ({
            id: course.id || course.course_id || course.courseId || `api-${index}`,
            name: course.name || course.course_name || course.courseName || course.title || `Course ${index + 1}`,
            city: course.city || course.location?.city || course.address?.city || 'Unknown City',
            state: course.state || course.location?.state || course.address?.state || course.region || 'Unknown State',
            country: course.country || course.location?.country || course.address?.country || 'Unknown Country',
            par: parseInt(course.par || course.total_par || course.totalPar || 72),
            yardage: course.yardage || course.total_yardage || course.totalYardage || null,
            rating: parseFloat(course.rating || course.course_rating || course.courseRating) || null,
            slope: parseInt(course.slope || course.slope_rating || course.slopeRating) || null,
            holes: course.holes || course.scorecard || course.hole_data || null
        }));
    };
    
    // Search courses with fallback
    const searchCourses = async (searchQuery) => {
        if (!searchQuery || !searchQuery.trim()) {
            throw new Error('Search query is required');
        }
        
        const cacheKey = searchQuery.toLowerCase().trim();
        
        // Check cache first
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            console.log('Using cached results for:', searchQuery);
            return cachedResult;
        }
        
        // Try API endpoints
        for (const endpoint of ENDPOINTS) {
            try {
                const apiData = await makeAPIRequest(endpoint, searchQuery);
                const transformedCourses = transformCourseData(apiData);
                
                if (transformedCourses.length > 0) {
                    console.log(`Found ${transformedCourses.length} courses from API`);
                    saveToCache(cacheKey, transformedCourses);
                    return transformedCourses;
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        // If all API calls fail, throw error (fallback handled in calling code)
        throw new Error('All API endpoints failed');
    };
    
    // Get course details by ID
    const getCourseDetails = async (courseId) => {
        const cacheKey = `course-${courseId}`;
        
        // Check cache first
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        // Try to fetch course details
        for (const endpoint of ENDPOINTS) {
            try {
                const url = `${endpoint}/${courseId}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Key ${API_KEY}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const courseData = await response.json();
                    const transformedCourse = transformCourseData([courseData])[0];
                    saveToCache(cacheKey, transformedCourse);
                    return transformedCourse;
                }
            } catch (error) {
                console.log(`Failed to fetch course details from ${endpoint}:`, error);
                continue;
            }
        }
        
        throw new Error('Could not fetch course details');
    };
    
    // Clear cache (useful for testing)
    const clearCache = () => {
        cache.clear();
        console.log('API cache cleared');
    };
    
    // Get cache stats
    const getCacheStats = () => {
        return {
            size: cache.size,
            entries: Array.from(cache.keys())
        };
    };
    
    // Public API
    return {
        searchCourses,
        getCourseDetails,
        clearCache,
        getCacheStats
    };
})();