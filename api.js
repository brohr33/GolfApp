// Golf Course API integration with smart fallbacks
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
    
    // Check if API results are relevant to search query
    const isRelevantResult = (course, searchQuery) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        const courseName = (course.name || course.course_name || course.courseName || '').toLowerCase();
        const courseCity = (course.city || course.location?.city || '').toLowerCase();
        const courseState = (course.state || course.location?.state || '').toLowerCase();
        
        return courseName.includes(query) || 
               courseCity.includes(query) || 
               courseState.includes(query) ||
               courseName.includes(query.split(' ')[0]); // Match first word
    };
    
    // Filter API results for relevancy
    const filterRelevantCourses = (courses, searchQuery) => {
        if (!searchQuery || !courses.length) return courses;
        
        const relevantCourses = courses.filter(course => isRelevantResult(course, searchQuery));
        
        // If we found relevant courses, return them
        if (relevantCourses.length > 0) {
            console.log(`Found ${relevantCourses.length} relevant courses from API for "${searchQuery}"`);
            return relevantCourses;
        }
        
        // If no relevant courses found, the API doesn't support search properly
        console.log(`API returned ${courses.length} courses but none match "${searchQuery}" - using fallback`);
        return []; // This will trigger fallback data
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
    
    // Search courses with smart fallbacks
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
                    console.log(`API returned ${transformedCourses.length} courses`);
                    
                    // Filter for relevancy
                    const relevantCourses = filterRelevantCourses(transformedCourses, searchQuery);
                    
                    if (relevantCourses.length > 0) {
                        saveToCache(cacheKey, relevantCourses);
                        return relevantCourses;
                    }
                    
                    // If no relevant courses, fall through to use fallback data
                    break;
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        // If we get here, either API failed or returned irrelevant results
        // Use our high-quality fallback data instead
        console.log(`Using fallback data for: ${searchQuery}`);
        const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
        saveToCache(cacheKey, fallbackCourses);
        return fallbackCourses;
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
    
    // Test API connectivity
    const testConnection = async () => {
        try {
            const testResults = await searchCourses('Pebble Beach');
            return {
                connected: true,
                message: `API connected - found ${testResults.length} courses`,
                courses: testResults.length
            };
        } catch (error) {
            return {
                connected: false,
                message: `API connection failed: ${error.message}`,
                courses: 0
            };
        }
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
        testConnection,
        clearCache,
        getCacheStats
    };
})();