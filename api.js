// Enhanced Golf Course API with Multiple Search Strategies
window.GolfAPI = (function() {
    'use strict';
    
    const API_KEY = 'VLNANFMEVIQBJ6T75A52WMQUKI';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // Multiple API endpoints and strategies
    const SEARCH_STRATEGIES = [
        // Strategy 1: Try different parameter names
        {
            name: 'search_param',
            endpoints: [
                'https://api.golfcourseapi.com/courses?search=',
                'https://api.golfcourseapi.com/v1/courses?search=',
                'https://golfcourseapi.com/api/courses?search='
            ]
        },
        // Strategy 2: Try 'name' parameter
        {
            name: 'name_param',
            endpoints: [
                'https://api.golfcourseapi.com/courses?name=',
                'https://api.golfcourseapi.com/v1/courses?name=',
                'https://golfcourseapi.com/api/courses?name='
            ]
        },
        // Strategy 3: Try 'q' parameter (common for search)
        {
            name: 'q_param',
            endpoints: [
                'https://api.golfcourseapi.com/courses?q=',
                'https://api.golfcourseapi.com/v1/courses?q=',
                'https://golfcourseapi.com/api/courses?q='
            ]
        },
        // Strategy 4: Try location-based search
        {
            name: 'location_param',
            endpoints: [
                'https://api.golfcourseapi.com/courses?location=',
                'https://api.golfcourseapi.com/v1/courses?location=',
                'https://golfcourseapi.com/api/courses?city='
            ]
        },
        // Strategy 5: Try pagination to get more courses
        {
            name: 'pagination',
            endpoints: [
                'https://api.golfcourseapi.com/courses?limit=100&search=',
                'https://api.golfcourseapi.com/v1/courses?per_page=100&search=',
                'https://golfcourseapi.com/api/courses?size=100&search='
            ]
        }
    ];
    
    // Alternative APIs to try
    const BACKUP_APIS = [
        {
            name: 'OpenGolf',
            baseUrl: 'https://golf-courses-api.herokuapp.com/courses',
            searchParam: 'search'
        },
        {
            name: 'GolfData',
            baseUrl: 'https://api.golfdata.com/courses',
            searchParam: 'name'
        }
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
    
    // Enhanced relevancy check
    const isRelevantResult = (course, searchQuery) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        const searchTerms = query.split(' ').filter(term => term.length > 2);
        
        const courseName = (course.name || course.course_name || course.courseName || '').toLowerCase();
        const courseCity = (course.city || course.location?.city || '').toLowerCase();
        const courseState = (course.state || course.location?.state || '').toLowerCase();
        const courseCountry = (course.country || course.location?.country || '').toLowerCase();
        
        // Check if any search term matches
        return searchTerms.some(term => 
            courseName.includes(term) || 
            courseCity.includes(term) || 
            courseState.includes(term) ||
            courseCountry.includes(term)
        ) || courseName.includes(query) || courseCity.includes(query);
    };
    
    // Make API request with enhanced error handling
    const makeAPIRequest = async (url, searchQuery) => {
        console.log(`🔍 Trying: ${url}${encodeURIComponent(searchQuery)}`);
        
        const response = await fetch(url + encodeURIComponent(searchQuery), {
            method: 'GET',
            headers: {
                'Authorization': `Key ${API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Golf-Scorecard-Pro/1.0'
            }
        });
        
        console.log(`📊 Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    };
    
    // Try backup APIs
    const tryBackupAPIs = async (searchQuery) => {
        for (const api of BACKUP_APIS) {
            try {
                console.log(`🔄 Trying backup API: ${api.name}`);
                const url = `${api.baseUrl}?${api.searchParam}=${encodeURIComponent(searchQuery)}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${api.name} API responded with data`);
                    return transformCourseData(data);
                }
            } catch (error) {
                console.log(`❌ ${api.name} API failed:`, error.message);
                continue;
            }
        }
        return [];
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
            id: course.id || course.course_id || course.courseId || `api-${Date.now()}-${index}`,
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
    
    // Enhanced search with multiple strategies
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
        
        let allCourses = [];
        let searchStrategiesUsed = [];
        
        // Try all search strategies
        for (const strategy of SEARCH_STRATEGIES) {
            console.log(`🎯 Trying strategy: ${strategy.name}`);
            
            for (const endpoint of strategy.endpoints) {
                try {
                    const apiData = await makeAPIRequest(endpoint, searchQuery);
                    const transformedCourses = transformCourseData(apiData);
                    
                    if (transformedCourses.length > 0) {
                        console.log(`✅ ${strategy.name} found ${transformedCourses.length} courses`);
                        
                        // Filter for relevancy
                        const relevantCourses = transformedCourses.filter(course => 
                            isRelevantResult(course, searchQuery)
                        );
                        
                        if (relevantCourses.length > 0) {
                            allCourses = allCourses.concat(relevantCourses);
                            searchStrategiesUsed.push(strategy.name);
                            console.log(`🎉 Found ${relevantCourses.length} relevant courses using ${strategy.name}`);
                            
                            // If we found good results, we can stop here
                            if (relevantCourses.length >= 5) {
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ ${strategy.name} failed:`, error.message);
                    continue;
                }
            }
            
            // If we found enough results, stop trying strategies
            if (allCourses.length >= 5) {
                break;
            }
        }
        
        // Try backup APIs if main API didn't work well
        if (allCourses.length < 3) {
            console.log('🔄 Main API results insufficient, trying backup APIs...');
            const backupResults = await tryBackupAPIs(searchQuery);
            const relevantBackupResults = backupResults.filter(course => 
                isRelevantResult(course, searchQuery)
            );
            allCourses = allCourses.concat(relevantBackupResults);
        }
        
        // Remove duplicates based on name and location
        const uniqueCourses = allCourses.filter((course, index, self) => 
            index === self.findIndex(c => 
                c.name.toLowerCase() === course.name.toLowerCase() && 
                c.city.toLowerCase() === course.city.toLowerCase()
            )
        );
        
        console.log(`🏆 Final results: ${uniqueCourses.length} unique courses from strategies: ${searchStrategiesUsed.join(', ')}`);
        
        // If we have good API results, use them
        if (uniqueCourses.length > 0) {
            saveToCache(cacheKey, uniqueCourses);
            return uniqueCourses;
        }
        
        // Fall back to curated data
        console.log(`🎯 Using curated fallback data for: ${searchQuery}`);
        const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
        saveToCache(cacheKey, fallbackCourses);
        return fallbackCourses;
    };
    
    // Test different search strategies
    const testSearchStrategies = async (searchQuery = 'Pebble Beach') => {
        console.log(`🧪 Testing search strategies for: ${searchQuery}`);
        const results = {};
        
        for (const strategy of SEARCH_STRATEGIES) {
            console.log(`Testing ${strategy.name}...`);
            results[strategy.name] = [];
            
            for (const endpoint of strategy.endpoints) {
                try {
                    const apiData = await makeAPIRequest(endpoint, searchQuery);
                    const courses = transformCourseData(apiData);
                    const relevant = courses.filter(c => isRelevantResult(c, searchQuery));
                    
                    results[strategy.name].push({
                        endpoint,
                        total: courses.length,
                        relevant: relevant.length,
                        courses: relevant.slice(0, 3) // First 3 for testing
                    });
                } catch (error) {
                    results[strategy.name].push({
                        endpoint,
                        error: error.message
                    });
                }
            }
        }
        
        console.table(results);
        return results;
    };
    
    // Public API
    return {
        searchCourses,
        testSearchStrategies,
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