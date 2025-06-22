// Golf Course API implementation following the official OpenAPI specification
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
    
    // Make API request with proper authentication following OpenAPI spec
    const makeAPIRequest = async (url) => {
        console.log(`🔍 API Request: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    // Following OpenAPI spec: "Authorization: Key <your API key>"
                    'Authorization': `Key ${API_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`📊 Response: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('API key is missing or invalid');
                }
                
                // Try to get error details from response
                try {
                    const errorData = await response.json();
                    throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                } catch (parseError) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            console.log(`✅ Response received:`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ Request failed:`, error.message);
            throw error;
        }
    };
    
    // Search for courses using the correct /v1/search endpoint
    const searchCourses = async (searchQuery) => {
        if (!searchQuery || !searchQuery.trim()) {
            throw new Error('Search query is required');
        }
        
        const cacheKey = searchQuery.toLowerCase().trim();
        
        // Check cache first
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            console.log('📦 Using cached results for:', searchQuery);
            return cachedResult;
        }
        
        try {
            console.log(`🔍 Searching for: "${searchQuery}"`);
            
            // Use the correct endpoint from OpenAPI spec
            const searchUrl = `${BASE_URL}/v1/search?search_query=${encodeURIComponent(searchQuery)}`;
            const searchResponse = await makeAPIRequest(searchUrl);
            
            // According to OpenAPI spec, response has a "courses" array
            const courses = searchResponse.courses || [];
            
            if (!courses || courses.length === 0) {
                console.log('🎯 No courses found in search response');
                throw new Error('No courses found');
            }
            
            console.log(`📖 Found ${courses.length} courses from search`);
            
            // Transform courses to our format
            const normalizedCourses = courses.map(course => normalizeCourseData(course));
            
            // Filter out invalid courses
            const validCourses = normalizedCourses.filter(course => 
                course && course.name && course.name !== 'Unknown Course'
            );
            
            console.log(`🏆 Successfully processed ${validCourses.length} valid courses`);
            
            if (validCourses.length > 0) {
                saveToCache(cacheKey, validCourses);
                return validCourses;
            }
            
            throw new Error('No valid courses found after processing');
            
        } catch (error) {
            console.error('❌ API search failed:', error.message);
            
            // Fall back to curated data
            console.log('🎯 Using curated fallback data');
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
            console.log(`📦 Using cached course details for ID: ${courseId}`);
            return cachedResult;
        }
        
        try {
            console.log(`📖 Getting details for course ID: ${courseId}`);
            
            // Use the correct endpoint from OpenAPI spec
            const courseUrl = `${BASE_URL}/v1/courses/${courseId}`;
            const courseDetails = await makeAPIRequest(courseUrl);
            
            const normalizedCourse = normalizeCourseData(courseDetails);
            saveToCache(cacheKey, normalizedCourse);
            
            console.log(`✅ Retrieved course details: ${normalizedCourse.name}`);
            return normalizedCourse;
            
        } catch (error) {
            console.error(`❌ Failed to get course details for ID ${courseId}:`, error.message);
            throw error;
        }
    };
    
    // Transform course data from API format to our standardized format
    const normalizeCourseData = (course) => {
        // Handle the API structure based on OpenAPI spec
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
            
            // Keep raw data for debugging
            _raw: course
        };
    };
    
    // Extract par total from tee data
    const extractParFromTees = (tees) => {
        if (!tees) return 72;
        
        // Try male tees first, then female tees
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
    
    // Test API connectivity using the healthcheck endpoint
    const testConnection = async () => {
        try {
            console.log('🧪 Testing API connection...');
            
            // First test the healthcheck endpoint
            const healthUrl = `${BASE_URL}/v1/healthcheck`;
            console.log(`🔍 Testing healthcheck: ${healthUrl}`);
            
            const healthResponse = await fetch(healthUrl);
            console.log(`📊 Healthcheck response: ${healthResponse.status}`);
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log(`✅ API is available:`, healthData);
                
                // Now test a search
                try {
                    const searchResults = await searchCourses('Pebble Beach');
                    
                    return {
                        connected: true,
                        message: `API fully functional! Healthcheck passed and found ${searchResults.length} courses`,
                        healthcheck: healthData,
                        searchResults: searchResults.length,
                        sampleCourse: searchResults[0]?.name || 'None'
                    };
                } catch (searchError) {
                    return {
                        connected: false,
                        message: `API available but search failed: ${searchError.message}`,
                        healthcheck: healthData,
                        searchError: searchError.message
                    };
                }
            } else {
                return {
                    connected: false,
                    message: `API healthcheck failed: ${healthResponse.status} ${healthResponse.statusText}`,
                    status: healthResponse.status
                };
            }
        } catch (error) {
            return {
                connected: false,
                message: `API test failed: ${error.message}`,
                error: error.message
            };
        }
    };
    
    // Debug search (just the search step)
    const debugSearch = async (searchQuery) => {
        try {
            const searchUrl = `${BASE_URL}/v1/search?search_query=${encodeURIComponent(searchQuery)}`;
            console.log(`🔍 Debug search URL: ${searchUrl}`);
            
            const searchResponse = await makeAPIRequest(searchUrl);
            
            return {
                success: true,
                url: searchUrl,
                response: searchResponse,
                courseCount: searchResponse.courses?.length || 0,
                sampleCourses: searchResponse.courses?.slice(0, 3) || []
            };
        } catch (error) {
            return {
                success: false,
                url: `${BASE_URL}/v1/search?search_query=${encodeURIComponent(searchQuery)}`,
                error: error.message
            };
        }
    };
    
    // Public API
    return {
        searchCourses,
        getCourseDetails,
        testConnection,
        debugSearch,
        clearCache: () => {
            cache.clear();
            console.log('🧹 API cache cleared');
        },
        getCacheStats: () => ({
            size: cache.size,
            entries: Array.from(cache.keys())
        })
    };
})();