// Course Search Component - Clean Production Version
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
                info.push('⛳ Course details');
            }
            return info;
        };
        
        const getDataSourceInfo = (course) => {
            try {
                const courseId = course?.id || '';
                const courseIdStr = String(courseId).toLowerCase();
                
                if (courseIdStr.includes('fallback') || courseIdStr.includes('sample')) {
                    return { type: 'fallback', label: 'Curated course data', color: '#7c3aed' };
                } else if (typeof courseId === 'number' || (typeof courseId === 'string' && /^\d+$/.test(courseId))) {
                    return { type: 'api', label: 'Golf Course API', color: '#059669' };
                } else {
                    return { type: 'processed', label: 'Course data', color: '#6b7280' };
                }
            } catch (error) {
                return { type: 'unknown', label: 'Course data', color: '#6b7280' };
            }
        };
        
        const normalizeCourse = (course, index) => {
            try {
                return {
                    id: course?.id || `course-${index}`,
                    name: course?.name || course?.course_name || course?.club_name || `Course ${index + 1}`,
                    club_name: course?.club_name || course?.name,
                    city: course?.city || 'Unknown City',
                    state: course?.state || 'Unknown State',
                    country: course?.country || 'USA',
                    par: parseInt(course?.par || 72),
                    yardage: course?.yardage || null,
                    rating: parseFloat(course?.rating) || null,
                    slope: parseInt(course?.slope) || null,
                    holes: course?.holes || null,
                    _raw: course?._raw
                };
            } catch (error) {
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
        
        const getResultsAnalysis = () => {
            if (!courses || courses.length === 0) return null;
            
            const fallbackCount = courses.filter(course => {
                const sourceInfo = getDataSourceInfo(course);
                return sourceInfo.type === 'fallback';
            }).length;
            
            const apiCount = courses.length - fallbackCount;
            
            if (fallbackCount > 0 && apiCount === 0) {
                return { 
                    type: 'fallback', 
                    message: 'Showing curated golf course data',
                    statusClass: 'status-info'
                };
            } else if (apiCount > 0 && fallbackCount === 0) {
                return { 
                    type: 'api', 
                    message: `Found ${apiCount} course${apiCount !== 1 ? 's' : ''} from Golf Course API`,
                    statusClass: 'status-success'
                };
            } else if (apiCount > 0 && fallbackCount > 0) {
                return { 
                    type: 'mixed', 
                    message: `Found ${apiCount} live course${apiCount !== 1 ? 's' : ''} plus ${fallbackCount} curated course${fallbackCount !== 1 ? 's' : ''}`,
                    statusClass: 'status-info'
                };
            }
            return null;
        };
        
        const resultsAnalysis = getResultsAnalysis();
        
        return e('div', null,
            // Header
            e('div', { className: 'card text-center mb-6' },
                e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '🔍'),
                e('h1', { className: 'text-3xl font-bold mb-2' }, 'Find Your Course'),
                e('p', { className: 'text-gray-600' }, 'Search thousands of golf courses worldwide')
            ),
            
            // Search interface
            e('div', { className: 'card' },
                e('div', { className: 'flex gap-3 mb-4' },
                    e('input', {
                        type: 'text',
                        value: searchQuery || '',
                        onChange: (evt) => setSearchQuery(evt.target.value),
                        placeholder: 'Search courses by name or location (e.g., "Pebble Beach", "Pinehurst", "Augusta")',
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
                
                // Results status
                resultsAnalysis && e('div', { className: resultsAnalysis.statusClass },
                    e('strong', null, '📊 '), 
                    resultsAnalysis.message
                ),
                
                // Quick suggestions
                !searchQuery && e('div', { className: 'mt-4' },
                    e('p', { className: 'text-sm text-gray-600 mb-3' }, 'Try searching for these famous courses:'),
                    e('div', { className: 'grid grid-3 gap-2' },
                        [
                            { name: 'Pebble Beach', query: 'pebble beach' },
                            { name: 'Augusta National', query: 'augusta' },
                            { name: 'Pinehurst No. 2', query: 'pinehurst' },
                            { name: 'St Andrews', query: 'st andrews' },
                            { name: 'Torrey Pines', query: 'torrey pines' },
                            { name: 'Bethpage Black', query: 'bethpage' }
                        ].map(suggestion =>
                            e('button', {
                                key: suggestion.query,
                                onClick: () => setSearchQuery(suggestion.query),
                                className: 'btn btn-secondary',
                                style: { padding: '8px 12px', fontSize: '14px', textAlign: 'left' }
                            }, suggestion.name)
                        )
                    )
                )
            ),
            
            // Search results
            (courses && courses.length > 0) && e('div', null,
                e('div', { className: 'flex-between mb-6' },
                    e('h2', { className: 'text-2xl font-bold' }, 
                        `Found ${courses.length} Course${courses.length !== 1 ? 's' : ''}`
                    ),
                    searchQuery && e('div', { className: 'text-sm text-gray-600' },
                        `Search: "${searchQuery}"`
                    )
                ),
                
                e('div', { className: 'grid gap-4' },
                    courses.map((course, index) => {
                        const safeCourse = normalizeCourse(course, index);
                        const sourceInfo = getDataSourceInfo(safeCourse);
                        
                        return e('div', { 
                            key: safeCourse.id, 
                            className: 'course-card',
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
                                    
                                    // Show club name if different from course name
                                    safeCourse.club_name && 
                                    safeCourse.club_name !== safeCourse.name && 
                                    safeCourse.club_name.toLowerCase() !== safeCourse.name.toLowerCase() &&
                                        e('div', { 
                                            className: 'text-sm font-medium text-gray-700 mb-2' 
                                        }, safeCourse.club_name),
                                    
                                    // Location
                                    e('div', { className: 'text-gray-600 mb-3' },
                                        e('div', { className: 'flex items-center gap-1' },
                                            e('span', null, '📍'),
                                            e('span', null, `${safeCourse.city}, ${safeCourse.state}`),
                                            (safeCourse.country && safeCourse.country !== 'USA') && 
                                                e('span', { className: 'text-sm' }, `• ${safeCourse.country}`)
                                        )
                                    ),
                                    
                                    // Course details
                                    e('div', { className: 'flex flex-wrap gap-4 text-sm mb-2' },
                                        formatCourseInfo(safeCourse).map((info, infoIndex) =>
                                            e('span', { 
                                                key: infoIndex, 
                                                className: 'bg-gray-100 px-2 py-1 rounded text-gray-700'
                                            }, info)
                                        )
                                    ),
                                    
                                    // Data source
                                    e('div', { 
                                        className: 'text-xs',
                                        style: { color: sourceInfo.color }
                                    },
                                        `18 holes • ${sourceInfo.label}`
                                    )
                                ),
                                
                                // Select button
                                e('div', { 
                                    className: 'btn',
                                    style: { marginLeft: '16px', flexShrink: 0 }
                                }, '⛳ Select →')
                            )
                        );
                    })
                )
            ),
            
            // No results
            (courses && courses.length === 0 && searchQuery && !loading) && e('div', { className: 'card text-center' },
                e('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🔍'),
                e('h3', { className: 'text-xl font-semibold mb-2' }, 'No courses found'),
                e('p', { className: 'text-gray-600 mb-4' }, 
                    `We couldn't find any courses matching "${searchQuery}".`
                ),
                e('p', { className: 'text-sm text-gray-500 mb-4' }, 
                    'Try searching for the course name, club name, or location.'
                ),
                e('button', {
                    onClick: () => setSearchQuery(''),
                    className: 'btn btn-secondary'
                }, 'Clear Search')
            ),
            
            // Navigation
            e('div', { className: 'flex-between mt-8' },
                e('button', {
                    onClick: onBack,
                    className: 'btn btn-secondary'
                }, '← Back to Player Setup'),
                
                // Subtle help text
                e('div', { className: 'text-xs text-gray-500' },
                    'Powered by Golf Course API'
                )
            )
        );
    };
})();