// Robust Golf Course API implementation with endpoint discovery
window.GolfAPI = (function() {
    'use strict';
    
    const API_KEY = 'VLNANFMEVIQBJ6T75A52WMQUKI';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // Multiple endpoint variations to try
    const ENDPOINT_VARIATIONS = [
        // Based on documentation
        'https://api.golfcourseapi.com/courses',
        'https://api.golfcourseapi.com/v1/courses', 
        'https://golfcourseapi.com/api/courses',
        'https://golfcourseapi.com/courses',
        
        // Alternative formats
        'https://api.golfcourseapi.com/course/search',
        'https://api.golfcourseapi.com/v1/course/search',
        'https://api.golfcourseapi.com/search/courses',
        'https://api.golfcourseapi.com/v1/search/courses',
        
        // Without subdomain
        'https://golfcourseapi.com/v1/courses',
        'https://golfcourseapi.com/api/v1/courses'
    ];
    
    // Different parameter formats to try
    const SEARCH_PARAM_FORMATS = [
        'search_query',
        'search',
        'query',
        'q',
        'name',
        'course_name'
    ];
    
    // In-memory cache
    const cache = new Map();
    
    // Working endpoint cache
    let workingEndpoint = null;
    let workingParamFormat = null;
    
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
    
    // Make API request with comprehensive error handling
    const makeAPIRequest = async (url, testMode = false) => {
        if (!testMode) {
            console.log(`🔍 API Request: ${url}`);
        }
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Key ${API_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'GolfScorecardPro/1.0'
                }
            });
            
            if (!testMode) {
                console.log(`📊 Response: ${response.status} ${response.statusText}`);
            }
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            if (!testMode) {
                console.log(`✅ Response data preview:`, data?.length ? `Array of ${data.length} items` : data);
            }
            return data;
            
        } catch (error) {
            if (!testMode) {
                console.error(`❌ Request failed:`, error.message);
            }
            throw error;
        }
    };
    
    // Test a single endpoint/parameter combination
    const testEndpointVariation = async (baseUrl, paramName, searchQuery) => {
        const url = `${baseUrl}?${paramName}=${encodeURIComponent(searchQuery)}`;
        
        try {
            const data = await makeAPIRequest(url, true);
            
            // Check if response looks like course data
            if (Array.isArray(data) && data.length > 0) {
                return { success: true, url, data, count: data.length };
            } else if (data && typeof data === 'object' && (data.courses || data.data || data.results)) {
                const courses = data.courses || data.data || data.results;
                if (Array.isArray(courses) && courses.length > 0) {
                    return { success: true, url, data: courses, count: courses.length };
                }
            }
            
            return { success: false, url, reason: 'No course data in response' };
            
        } catch (error) {
            return { success: false, url, error: error.message };
        }
    };
    
    // Discover working endpoint
    const discoverWorkingEndpoint = async (searchQuery = 'Pebble Beach') => {
        console.log('🔍 Discovering working API endpoint...');
        
        for (const endpoint of ENDPOINT_VARIATIONS) {
            for (const paramFormat of SEARCH_PARAM_FORMATS) {
                console.log(`🧪 Testing: ${endpoint}?${paramFormat}=${searchQuery}`);
                
                const result = await testEndpointVariation(endpoint, paramFormat, searchQuery);
                
                if (result.success) {
                    console.log(`✅ Found working endpoint: ${result.url}`);
                    console.log(`📊 Returned ${result.count} courses`);
                    
                    workingEndpoint = endpoint;
                    workingParamFormat = paramFormat;
                    
                    return {
                        endpoint,
                        paramFormat,
                        url: result.url,
                        sampleData: result.data.slice(0, 3) // First 3 courses
                    };
                }
            }
        }
        
        console.log('❌ No working endpoint found');
        return null;
    };
    
    // Search using discovered or cached working endpoint
    const searchWithWorkingEndpoint = async (searchQuery) => {
        if (!workingEndpoint || !workingParamFormat) {
            console.log('🔍 No working endpoint cached, discovering...');
            const discovery = await discoverWorkingEndpoint(searchQuery);
            if (!discovery) {
                throw new Error('No working API endpoint found');
            }
        }
        
        const url = `${workingEndpoint}?${workingParamFormat}=${encodeURIComponent(searchQuery)}`;
        const data = await makeAPIRequest(url);
        
        // Normalize response format
        if (Array.isArray(data)) {
            return data;
        } else if (data && typeof data === 'object') {
            return data.courses || data.data || data.results || [];
        }
        
        return [];
    };
    
    // Get course details (try multiple ID formats)
    const getCourseDetails = async (courseId) => {
        if (!workingEndpoint) {
            throw new Error('No working endpoint available for course details');
        }
        
        // Try different URL patterns for getting course details
        const detailUrls = [
            `${workingEndpoint}/${courseId}`,
            `${workingEndpoint.replace('/courses', '/course')}/${courseId}`,
            `${workingEndpoint}?id=${courseId}`,
            `${workingEndpoint}?course_id=${courseId}`
        ];
        
        for (const url of detailUrls) {
            try {
                console.log(`🔍 Trying course details URL: ${url}`);
                const details = await makeAPIRequest(url);
                console.log(`✅ Got course details from: ${url}`);
                return details;
            } catch (error) {
                console.log(`❌ Failed: ${url} - ${error.message}`);
                continue;
            }
        }
        
        throw new Error(`Could not get details for course ${courseId}`);
    };
    
    // Normalize course data
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
            _raw: course
        };
    };
    
    // Main search function
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
            
            // Try to search using API
            const searchResults = await searchWithWorkingEndpoint(searchQuery);
            
            if (!searchResults || searchResults.length === 0) {
                console.log('🎯 No courses found in API search');
                throw new Error('No courses found');
            }
            
            console.log(`📖 Processing ${searchResults.length} search results`);
            
            // Process results - try to get details if needed
            const processedCourses = await Promise.all(
                searchResults.slice(0, 10).map(async (course) => {
                    try {
                        // If course already has sufficient details, use it
                        if (course.name && course.city && course.name !== 'Unknown Course') {
                            return normalizeCourseData(course);
                        }
                        
                        // Otherwise try to get more details
                        const courseId = course.id || course.course_id || course.courseId;
                        if (courseId) {
                            try {
                                const details = await getCourseDetails(courseId);
                                return normalizeCourseData(details);
                            } catch (detailError) {
                                console.log(`⚠️ Could not get details for ${courseId}, using basic info`);
                                return normalizeCourseData(course);
                            }
                        }
                        
                        return normalizeCourseData(course);
                    } catch (error) {
                        console.error(`❌ Error processing course:`, error);
                        return null;
                    }
                })
            );
            
            // Filter out null results
            const validCourses = processedCourses.filter(course => 
                course && course.name && course.name !== 'Unknown Course'
            );
            
            console.log(`🏆 Successfully processed ${validCourses.length} courses`);
            
            if (validCourses.length > 0) {
                saveToCache(cacheKey, validCourses);
                return validCourses;
            }
            
            throw new Error('No valid courses after processing');
            
        } catch (error) {
            console.error('❌ API search failed:', error.message);
            
            // Fall back to curated data
            console.log('🎯 Using curated fallback data');
            const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
            saveToCache(cacheKey, fallbackCourses);
            return fallbackCourses;
        }
    };
    
    // Test API connectivity with endpoint discovery
    const testConnection = async () => {
        try {
            console.log('🧪 Testing API connection with endpoint discovery...');
            
            const discovery = await discoverWorkingEndpoint('Pebble Beach');
            
            if (discovery) {
                return {
                    connected: true,
                    message: `API working! Found endpoint: ${discovery.endpoint}`,
                    endpoint: discovery.endpoint,
                    paramFormat: discovery.paramFormat,
                    sampleCourses: discovery.sampleData.length,
                    sampleData: discovery.sampleData
                };
            } else {
                return {
                    connected: false,
                    message: 'No working API endpoints found',
                    testedEndpoints: ENDPOINT_VARIATIONS.length,
                    testedParams: SEARCH_PARAM_FORMATS.length
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
    
    // Reset endpoint discovery
    const resetEndpointDiscovery = () => {
        workingEndpoint = null;
        workingParamFormat = null;
        console.log('🔄 Reset endpoint discovery cache');
    };
    
    // Public API
    return {
        searchCourses,
        getCourseDetails,
        testConnection,
        discoverWorkingEndpoint,
        resetEndpointDiscovery,
        clearCache: () => {
            cache.clear();
            console.log('🧹 API cache cleared');
        },
        getCacheStats: () => ({
            size: cache.size,
            entries: Array.from(cache.keys()),
            workingEndpoint,
            workingParamFormat
        })
    };
})();