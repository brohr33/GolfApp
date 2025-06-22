// Course Search Component with Smart API Handling
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
        
        const getDataSourceInfo = (course) => {
            try {
                const courseId = course?.id || course?.course_id || course?.courseId || '';
                const courseIdStr = String(courseId).toLowerCase();
                
                if (courseIdStr.includes('fallback') || courseIdStr.includes('sample')) {
                    return { type: 'fallback', label: 'Curated data' };
                } else if (courseId.startsWith('api-') || courseId.includes('api')) {
                    return { type: 'api', label: 'Live API data' };
                } else {
                    return { type: 'api', label: 'Live data' };
                }
            } catch (error) {
                return { type: 'unknown', label: 'Course data' };
            }
        };
        
        const normalizeCourse = (course, index) => {
            try {
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
        
        // Determine what type of results we have
        const getResultsInfo = () => {
            if (!courses || courses.length === 0) return null;
            
            const fallbackCount = courses.filter(course => {
                const sourceInfo = getDataSourceInfo(course);
                return sourceInfo.type === 'fallback';
            }).length;
            
            const apiCount = courses.length - fallbackCount;
            
            if (fallbackCount > 0 && apiCount === 0) {
                return { type: 'fallback', message: 'Showing curated course data' };
            } else if (apiCount > 0 && fallbackCount === 0) {
                return { type: 'api', message: 'Showing live API results' };
            } else {
                return { type: 'mixed', message: 'Showing mixed results' };
            }
        };
        
        const resultsInfo = getResultsInfo();
        
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
                
                // Dynamic API status based on results
                resultsInfo && e('div', { 
                    className: `status ${resultsInfo.type === 'fallback' ? 'status-info' : 'status-success'}` 
                },
                    resultsInfo.type === 'fallback' ? 
                        e('span', null,
                            e('strong', null, '🎯 Smart Results: '), 
                            'API returned non-relevant results, showing curated course data instead'
                        ) :
                        e('span', null,
                            e('strong', null, '🔗 API Connected: '), 
                            resultsInfo.message
                        )
                ),
                
                // Search suggestions
                !searchQuery && e('div', { className: 'mt-4' },
                    e('p', { className: 'text-sm text-gray-600 mb-2' }, 'Try these famous courses:'),
                    e('div', { className: 'flex flex-wrap gap-2' },
                        ['Pebble Beach', 'Augusta National', 'St Andrews', 'Bethpage Black', 'Torrey Pines'].map(suggestion =>
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
                e('div', { className: 'flex-between mb-4' },
                    e('h2', { className: 'text-2xl font-bold' }, 
                        `Found ${courses.length} Course${courses.length !== 1 ? 's' : ''}`
                    ),
                    searchQuery && e('div', { className: 'text-sm text-gray-600' },
                        `Results for "${searchQuery}"`
                    )
                ),
                
                courses.map((course, index) => {
                    const safeCourse = normalizeCourse(course, index);
                    const sourceInfo = getDataSourceInfo(safeCourse);
                    
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
                                e('div', { 
                                    className: 'text-xs mt-2',
                                    style: { 
                                        color: sourceInfo.type === 'fallback' ? '#7c3aed' : '#059669' 
                                    }
                                },
                                    `18 holes • ${sourceInfo.label}`
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
                    `We couldn't find any courses matching "${searchQuery}". Try a different search term or check spelling.`
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