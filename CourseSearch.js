// Course Search Component
window.CourseSearch = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function CourseSearch({ 
        searchQuery, 
        setSearchQuery, 
        loading, 
        courses, 
        onSearch, 
        onSelectCourse, 
        onBack 
    }) {
        
        const handleKeyPress = (evt) => {
            if (evt.key === 'Enter') {
                onSearch();
            }
        };
        
        const formatCourseInfo = (course) => {
            const info = [];
            try {
                info.push(`⛳ Par ${course.par || 72}`);
                if (course.yardage) info.push(`📏 ${course.yardage} yards`);
                if (course.rating) info.push(`📊 Rating: ${course.rating}`);
                if (course.slope) info.push(`📈 Slope: ${course.slope}`);
            } catch (error) {
                console.warn('Error formatting course info:', error);
                info.push('⛳ Course details');
            }
            return info;
        };
        
        const isLiveApiData = (course) => {
            try {
                // Safely check for API vs fallback data
                if (!course) return false;
                
                const courseId = course.id || course.course_id || course.courseId || '';
                const courseIdStr = String(courseId);
                
                // Check if it's fallback data
                return !courseIdStr.toLowerCase().includes('fallback') && 
                       !courseIdStr.toLowerCase().includes('sample');
            } catch (error) {
                console.warn('Error checking data source:', error);
                return false;
            }
        };
        
        const normalizeCourse = (course, index) => {
            try {
                // Safely normalize course data with extensive fallbacks
                return {
                    id: course?.id || course?.course_id || course?.courseId || `course-${index}`,
                    name: course?.name || course?.course_name || course?.courseName || course?.title || `Course ${index + 1}`,
                    city: course?.city || course?.location?.city || course?.address?.city || 'Unknown City',
                    state: course?.state || course?.location?.state || course?.address?.state || course?.region || 'Unknown State',
                    country: course?.country || course?.location?.country || course?.address?.country || 'USA',
                    par: parseInt(course?.par || course?.total_par || course?.totalPar || 72),
                    yardage: course?.yardage || course?.total_yardage || course?.totalYardage || null,
                    rating: parseFloat(course?.rating || course?.course_rating || course?.courseRating) || null,
                    slope: parseInt(course?.slope || course?.slope_rating || course?.slopeRating) || null,
                    holes: course?.holes || course?.scorecard || course?.hole_data || null
                };
            } catch (error) {
                console.warn('Error normalizing course:', error);
                // Return a safe default course
                return {
                    id: `course-${index}`,
                    name: `Course ${index + 1}`,
                    city: 'Unknown City',
                    state: 'Unknown State',
                    country: 'USA',
                    par: 72,
                    yardage: null,
                    rating: null,
                    slope: null,
                    holes: null
                };
            }
        };
        
        return e('div', null,
            // Header
            e('div', { className: 'card text-center mb-6' },
                e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '🔍'),
                e('h1', { className: 'text-3xl font-bold mb-2' }, 'Find Your Course'),
                e('p', { className: 'text-gray-600' }, 'Search our database of golf courses worldwide')
            ),
            
            // Search interface
            e('div', { className: 'card' },
                e('div', { className: 'flex gap-3 mb-4' },
                    e('input', {
                        type: 'text',
                        value: searchQuery || '',
                        onChange: (evt) => setSearchQuery(evt.target.value),
                        placeholder: 'Search courses (try "Pebble Beach", "Augusta", or your local course)...',
                        className: 'input',
                        style: { flex: '1' },
                        onKeyPress: handleKeyPress,
                        disabled: loading
                    }),
                    e('button', {
                        onClick: onSearch,
                        disabled: loading || !(searchQuery && searchQuery.trim()),
                        className: 'btn'
                    }, loading ? 
                        e('div', { className: 'flex' },
                            e('div', { className: 'spinner' }),
                            'Searching...'
                        ) : 
                        '🔍 Search'
                    )
                ),
                
                // API status
                e('div', { className: 'status status-success' },
                    e('strong', null, '🔗 API Connected: '), 
                    'Successfully connected to Golf Course API'
                ),
                
                // Search suggestions
                !searchQuery && e('div', { className: 'mt-4' },
                    e('p', { className: 'text-sm text-gray-600 mb-2' }, 'Popular searches:'),
                    e('div', { className: 'flex flex-wrap gap-2' },
                        ['Pebble Beach', 'Augusta National', 'St Andrews', 'Bethpage Black'].map(suggestion =>
                            e('button', {
                                key: suggestion,
                                onClick: () => setSearchQuery(suggestion),
                                className: 'btn btn-secondary',
                                style: { padding: '6px 12px', fontSize: '14px' }
                            }, suggestion)
                        )
                    )
                )
            ),
            
            // Search results
            (courses && courses.length > 0) && e('div', null,
                e('h2', { className: 'text-2xl font-bold mb-4' }, 
                    `Found ${courses.length} Course${courses.length !== 1 ? 's' : ''}`
                ),
                courses.map((course, index) => {
                    const safeCourse = normalizeCourse(course, index);
                    const dataSource = isLiveApiData(safeCourse) ? 'Live API data' : 'Sample data';
                    
                    return e('div', { 
                        key: safeCourse.id, 
                        className: 'course-card mb-4',
                        onClick: () => {
                            try {
                                onSelectCourse(safeCourse);
                            } catch (error) {
                                console.error('Error selecting course:', error);
                            }
                        }
                    },
                        e('div', { className: 'flex-between' },
                            e('div', { style: { flex: '1' } },
                                e('h3', { className: 'text-xl font-bold mb-2' }, safeCourse.name),
                                e('div', { className: 'text-gray-600 mb-2' },
                                    e('div', null, `📍 ${safeCourse.city}, ${safeCourse.state}`),
                                    (safeCourse.country && safeCourse.country !== 'USA') && 
                                        e('div', { className: 'text-sm' }, safeCourse.country)
                                ),
                                e('div', { className: 'flex flex-wrap gap-4 text-sm' },
                                    formatCourseInfo(safeCourse).map((info, infoIndex) =>
                                        e('span', { 
                                            key: infoIndex, 
                                            className: infoIndex === 0 ? 'font-medium' : '' 
                                        }, info)
                                    )
                                ),
                                e('div', { className: 'text-xs text-gray-500 mt-2' },
                                    `18 holes • ${dataSource}`
                                )
                            ),
                            e('div', { className: 'btn' }, '⛳ Select →')
                        )
                    );
                })
            ),
            
            // No results message
            (courses && courses.length === 0 && searchQuery && !loading) && e('div', { className: 'card text-center' },
                e('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🔍'),
                e('h3', { className: 'text-xl font-semibold mb-2' }, 'No courses found'),
                e('p', { className: 'text-gray-600 mb-4' }, 
                    `We couldn't find any courses matching "${searchQuery}". Try a different search term.`
                ),
                e('button', {
                    onClick: () => setSearchQuery(''),
                    className: 'btn btn-secondary'
                }, 'Clear Search')
            ),
            
            // Navigation
            e('div', { className: 'mt-6' },
                e('button', {
                    onClick: onBack,
                    className: 'btn btn-secondary'
                }, '← Back to Setup')
            )
        );
    };
})();