// Golf Course API implementation - Production Version
window.GolfAPI = (function() {
    'use strict';
    
    const API_KEY = 'VLNANFMEVIQBJ6T75A52WMQUKI';
    const BASE_URL = 'https://api.golfcourseapi.com';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // In-memory cache
    const cache = new Map();
    
    const isCacheValid = (entry) => {
        return entry && (Date.now() - entry.timestamp) < CACHE_DURATION;
    };
    
    const getFromCache = (key) => {
        const entry = cache.get(key);
        return isCacheValid(entry) ? entry.data : null;
    };
    
    const saveToCache = (key, data) => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    };
    
    // Make API request with proper authentication
    const makeAPIRequest = async (url) => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Key ${API_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('API authentication failed');
                }
                
                // Try to get error details from response
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                } catch (parseError) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            return await response.json();
            
        } catch (error) {
            // Re-throw with more user-friendly messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to Golf Course API');
            }
            throw error;
        }
    };
    
    // Search for courses using the /v1/search endpoint
    const searchCourses = async (searchQuery) => {
        if (!searchQuery || !searchQuery.trim()) {
            throw new Error('Search query is required');
        }
        
        const cacheKey = searchQuery.toLowerCase().trim();
        
        // Check cache first
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        try {
            // Use the correct endpoint from OpenAPI spec
            const searchUrl = `${BASE_URL}/v1/search?search_query=${encodeURIComponent(searchQuery)}`;
            const searchResponse = await makeAPIRequest(searchUrl);
            
            // Extract courses array from response
            const courses = searchResponse.courses || [];
            
            if (!courses || courses.length === 0) {
                throw new Error('No courses found');
            }
            
            // Transform courses to our format
            const normalizedCourses = courses.map(course => normalizeCourseData(course));
            
            // Filter out invalid courses
            const validCourses = normalizedCourses.filter(course => 
                course && course.name && course.name !== 'Unknown Course'
            );
            
            if (validCourses.length > 0) {
                saveToCache(cacheKey, validCourses);
                return validCourses;
            }
            
            throw new Error('No valid courses found');
            
        } catch (error) {
            // Fall back to curated data on any error
            const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
            saveToCache(cacheKey, fallbackCourses);
            return fallbackCourses;
        }
    };
    
    // Get detailed course information by ID using /v1/courses/{id}
    const getCourseDetails = async (courseId) => {
        const cacheKey = `course-${courseId}`;
        
        // Check cache first
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        try {
            const courseUrl = `${BASE_URL}/v1/courses/${courseId}`;
            const courseDetails = await makeAPIRequest(courseUrl);
            
            const normalizedCourse = normalizeCourseData(courseDetails);
            saveToCache(cacheKey, normalizedCourse);
            
            return normalizedCourse;
            
        } catch (error) {
            throw new Error(`Unable to get course details: ${error.message}`);
        }
    };
    
    // Transform course data from API format to our standardized format
    const normalizeCourseData = (course) => {
        const location = course.location || {};
        
        return {
            id: course.id || 'unknown',
            name: course.course_name || course.club_name || 'Unknown Course',
            club_name: course.club_name || course.course_name || 'Unknown Club',
            city: location.city || 'Unknown City',
            state: location.state || 'Unknown State',
            country: location.country || 'USA',
            address: location.address || '',
            latitude: location.latitude || null,
            longitude: location.longitude || null,
            
            // Extract course data from tees (male tees as default)
            par: extractParFromTees(course.tees),
            yardage: extractYardageFromTees(course.tees),
            rating: extractRatingFromTees(course.tees),
            slope: extractSlopeFromTees(course.tees),
            holes: extractHolesFromTees(course.tees),
            
            // Keep raw data for potential future use
            _raw: course
        };
    };
    
    // Extract par total from tee data
    const extractParFromTees = (tees) => {
        if (!tees) return 72;
        
        const maleTees = tees.male && tees.male[0];
        const femaleTees = tees.female && tees.female[0];
        const teeData = maleTees || femaleTees;
        
        return teeData?.par_total || 72;
    };
    
    // Extract total yardage from tee data
    const extractYardageFromTees = (tees) => {
        if (!tees) return null;
        
        const maleTees = tees.male && tees.male[0];
        const femaleTees = tees.female && tees.female[0];
        const teeData = maleTees || femaleTees;
        
        return teeData?.total_yards || null;
    };
    
    // Extract course rating from tee data
    const extractRatingFromTees = (tees) => {
        if (!tees) return null;
        
        const maleTees = tees.male && tees.male[0];
        const femaleTees = tees.female && tees.female[0];
        const teeData = maleTees || femaleTees;
        
        return teeData?.course_rating || null;
    };
    
    // Extract slope rating from tee data
    const extractSlopeFromTees = (tees) => {
        if (!tees) return null;
        
        const maleTees = tees.male && tees.male[0];
        const femaleTees = tees.female && tees.female[0];
        const teeData = maleTees || femaleTees;
        
        return teeData?.slope_rating || null;
    };
    
    // Extract hole-by-hole data from tee data
    const extractHolesFromTees = (tees) => {
        if (!tees) return null;
        
        const maleTees = tees.male && tees.male[0];
        const femaleTees = tees.female && tees.female[0];
        const teeData = maleTees || femaleTees;
        
        if (!teeData || !teeData.holes) return null;
        
        // Transform holes array to our format with hole numbers
        return teeData.holes.map((hole, index) => ({
            hole: index + 1,
            par: hole.par || 4,
            yardage: hole.yardage || 350,
            handicap: hole.handicap || (index + 1)
        }));
    };
    
    // Clear cache (useful for testing or manual refresh)
    const clearCache = () => {
        cache.clear();
    };
    
    // Get cache statistics
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