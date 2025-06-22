// Golf Course API implementation following official documentation
window.GolfAPI = (function() {
    'use strict';
    
    const API_KEY = 'VLNANFMEVIQBJ6T75A52WMQUKI';
    const BASE_URL = 'https://api.golfcourseapi.com';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
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
    
    // Make API request with proper authentication
    const makeAPIRequest = async (url) => {
        console.log(`🔍 API Request: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Key ${API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API key is missing or invalid');
            } else if (response.status === 404) {
                throw new Error('Course not found');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log(`✅ Response data:`, data);
        return data;
    };
    
    // Step 1: Search for courses (returns course IDs)
    const searchCourseIds = async (searchQuery) => {
        const searchUrl = `${BASE_URL}/courses?search_query=${encodeURIComponent(searchQuery)}`;
        
        try {
            const searchResults = await makeAPIRequest(searchUrl);
            
            // The API should return an array of course objects with IDs
            if (Array.isArray(searchResults)) {
                console.log(`🎯 Search found ${searchResults.length} courses`);
                return searchResults;
            } else if (searchResults.courses && Array.isArray(searchResults.courses)) {
                console.log(`🎯 Search found ${searchResults.courses.length} courses`);
                return searchResults.courses;
            } else if (searchResults.data && Array.isArray(searchResults.data)) {
                console.log(`🎯 Search found ${searchResults.data.length} courses`);
                return searchResults.data;
            } else {
                console.log('🔍 Unexpected search response format:', searchResults);
                return [];
            }
        } catch (error) {
            console.error('❌ Search failed:', error.message);
            throw error;
        }
    };
    
    // Step 2: Get detailed course information by ID
    const getCourseDetails = async (courseId) => {
        const courseUrl = `${BASE_URL}/courses/${courseId}`;
        
        try {
            const courseDetails = await makeAPIRequest(courseUrl);
            console.log(`📖 Got details for course ${courseId}`);
            return courseDetails;
        } catch (error) {
            console.error(`❌ Failed to get details for course ${courseId}:`, error.message);
            throw error;
        }
    };
    
    // Transform and normalize course data
    const normalizeCourseData = (course) => {
        return {
            id: course.id || course.course_id || course.courseId || 'unknown',
            name: course.name || course.course_name || course.courseName || course.title || 'Unknown Course',
            city: course.city || course.location?.city || course.address?.city || 'Unknown City',
            state: course.state || course.location?.state || course.address?.state || course.region || 'Unknown State',
            country: course.country || course.location?.country || course.address?.country || 'USA',
            par: parseInt(course.par || course.total_par || course.totalPar || 72),
            yardage: course.yardage || course.total_yardage || course.totalYardage || null,
            rating: parseFloat(course.rating || course.course_rating || course.courseRating) || null,
            slope: parseInt(course.slope || course.slope_rating || course.slopeRating) || null,
            holes: course.holes || course.scorecard || course.hole_data || null,
            // Keep raw data for debugging
            _raw: course
        };
    };
    
    // Main search function: search + get details
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
            // Step 1: Search for course IDs
            console.log(`🔍 Step 1: Searching for "${searchQuery}"`);
            const searchResults = await searchCourseIds(searchQuery);
            
            if (!searchResults || searchResults.length === 0) {
                console.log('🎯 No courses found in search, using fallback data');
                const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
                saveToCache(cacheKey, fallbackCourses);
                return fallbackCourses;
            }
            
            // Step 2: Get details for each course (limit to first 10 for performance)
            console.log(`📖 Step 2: Getting details for ${Math.min(searchResults.length, 10)} courses`);
            const courseDetailsPromises = searchResults
                .slice(0, 10) // Limit to first 10 results
                .map(async (course) => {
                    try {
                        // If the search already returned full details, use them
                        if (course.name && course.city) {
                            console.log(`✅ Course ${course.id} already has details from search`);
                            return normalizeCourseData(course);
                        }
                        
                        // Otherwise, fetch full details
                        const courseId = course.id || course.course_id || course.courseId;
                        if (!courseId) {
                            console.warn('⚠️ Course missing ID:', course);
                            return null;
                        }
                        
                        const details = await getCourseDetails(courseId);
                        return normalizeCourseData(details);
                    } catch (error) {
                        console.error(`❌ Failed to get course details:`, error);
                        // Return partial data if available
                        if (course.name) {
                            return normalizeCourseData(course);
                        }
                        return null;
                    }
                });
            
            // Wait for all course details
            const courseDetails = await Promise.all(courseDetailsPromises);
            
            // Filter out null results and courses without names
            const validCourses = courseDetails.filter(course => 
                course && course.name && course.name !== 'Unknown Course'
            );
            
            console.log(`🏆 Retrieved ${validCourses.length} valid courses`);
            
            if (validCourses.length > 0) {
                saveToCache(cacheKey, validCourses);
                return validCourses;
            } else {
                console.log('🎯 No valid course details retrieved, using fallback data');
                const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
                saveToCache(cacheKey, fallbackCourses);
                return fallbackCourses;
            }
            
        } catch (error) {
            console.error('❌ API search completely failed:', error.message);
            
            // Check if it's an authentication error
            if (error.message.includes('401') || error.message.includes('key')) {
                console.error('🔑 API key issue detected');
            }
            
            // Always fall back to curated data on any error
            console.log('🎯 Using fallback data due to API error');
            const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
            saveToCache(cacheKey, fallbackCourses);
            return fallbackCourses;
        }
    };
    
    // Test API connectivity and authentication
    const testConnection = async () => {
        try {
            console.log('🧪 Testing API connection...');
            
            // Test with a simple search
            const testQuery = 'Pebble Beach';
            const searchResults = await searchCourseIds(testQuery);
            
            if (searchResults && searchResults.length > 0) {
                // Try to get details for first course
                const firstCourse = searchResults[0];
                const courseId = firstCourse.id || firstCourse.course_id || firstCourse.courseId;
                
                if (courseId) {
                    const details = await getCourseDetails(courseId);
                    return {
                        connected: true,
                        message: `API working! Found ${searchResults.length} courses, retrieved details for "${details.name || 'Unknown'}"`,
                        searchResults: searchResults.length,
                        sampleCourse: details.name || 'Unknown'
                    };
                } else {
                    return {
                        connected: true,
                        message: `API search working but courses missing IDs. Found ${searchResults.length} courses.`,
                        searchResults: searchResults.length,
                        issue: 'Missing course IDs'
                    };
                }
            } else {
                return {
                    connected: false,
                    message: 'API search returned no results',
                    searchResults: 0
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
    
    // Debug function to test search without details
    const debugSearch = async (searchQuery) => {
        try {
            const searchResults = await searchCourseIds(searchQuery);
            console.log('🔍 Raw search results:', searchResults);
            return {
                success: true,
                count: searchResults.length,
                results: searchResults,
                sampleIds: searchResults.slice(0, 3).map(c => c.id || c.course_id || c.courseId)
            };
        } catch (error) {
            console.error('❌ Debug search failed:', error);
            return {
                success: false,
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