// Enhanced Course Search Component with Debug Tools
window.CourseSearch = (function() {
    'use strict';
    
    const { createElement: e, useState } = React;
    
    return function CourseSearch({ 
        searchQuery, 
        setSearchQuery, 
        loading, 
        courses, 
        onSearch, 
        onSelectCourse, 
        onBack 
    }) {
        
        const [showDebug, setShowDebug] = useState(false);
        const [testResults, setTestResults] = useState(null);
        
        const handleKeyPress = (evt) => {
            if (evt.key === 'Enter') {
                onSearch();
            }
        };
        
        const testSearchStrategies = async () => {
            if (!searchQuery) return;
            
            setTestResults('testing...');
            try {
                const results = await GolfAPI.testSearchStrategies(searchQuery);
                setTestResults(results);
            } catch (error) {
                setTestResults({ error: error.message });
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
                    return { type: 'fallback', label: 'Curated data', color: '#7c3aed' };
                } else if (courseId.includes(Date.now().toString().slice(0, 8))) {
                    return { type: 'api-fresh', label: 'Fresh API data', color: '#059669' };
                } else {
                    return { type: 'api', label: 'API data', color: '#059669' };
                }
            } catch (error) {
                return { type: 'unknown', label: 'Course data', color: '#6b7280' };
            }
        };
        
        const normalizeCourse = (course, index) => {
            try {
                return {
                    id: course?.id || `course-${index}`,
                    name: course?.name || course?.course_name || course?.courseName || `Course ${index + 1}`,
                    city: course?.city || course?.location?.city || 'Unknown City',
                    state: course?.state || course?.location?.state || 'Unknown State',
                    country: course?.country || course?.location?.country || 'USA',
                    par: parseInt(course?.par || course?.total_par || 72),
                    yardage: course?.yardage || course?.total_yardage || null,
                    rating: parseFloat(course?.rating || course?.course_rating) || null,
                    slope: parseInt(course?.slope || course?.slope_rating) || null,
                    holes: course?.holes || course?.scorecard || null
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
        
        // Analyze results to show what strategies worked
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
                    message: 'API search unsuccessful - showing curated courses',
                    statusClass: 'status-info'
                };
            } else if (apiCount > 0 && fallbackCount === 0) {
                return { 
                    type: 'api', 
                    message: `Found ${apiCount} relevant courses via API`,
                    statusClass: 'status-success'
                };
            } else if (apiCount > 0 && fallbackCount > 0) {
                return { 
                    type: 'mixed', 
                    message: `Mixed results: ${apiCount} API + ${fallbackCount} curated`,
                    statusClass: 'status-warning'
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
                e('p', { className: 'text-gray-600' }, 'Enhanced search with multiple API strategies')
            ),
            
            // Search interface
            e('div', { className: 'card' },
                e('div', { className: 'flex gap-3 mb-4' },
                    e('input', {
                        type: 'text',
                        value: searchQuery || '',
                        onChange: (evt) => setSearchQuery(evt.target.value),
                        placeholder: 'Search courses (try "Torrey Pines", "Whistling Straits", etc.)...',
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
                    e('strong', null, '📊 Search Results: '), 
                    resultsAnalysis.message
                ),
                
                // Debug toggle
                e('div', { className: 'flex-between mt-4' },
                    e('div', { className: 'flex flex-wrap gap-2' },
                        ['Torrey Pines', 'Whistling Straits', 'TPC Sawgrass', 'Kiawah Island', 'Bandon Dunes'].map(suggestion =>
                            e('button', {
                                key: suggestion,
                                onClick: () => setSearchQuery(suggestion),
                                className: 'btn btn-secondary',
                                style: { padding: '4px 8px', fontSize: '12px' }
                            }, suggestion)
                        )
                    ),
                    e('button', {
                        onClick: () => setShowDebug(!showDebug),
                        className: 'btn btn-secondary',
                        style: { padding: '6px 12px', fontSize: '12px' }
                    }, showDebug ? 'Hide Debug' : 'Show Debug')
                ),
                
                // Debug panel
                showDebug && e('div', { 
                    className: 'mt-4 p-4', 
                    style: { 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '6px' 
                    } 
                },
                    e('h4', { className: 'font-semibold mb-2' }, '🛠️ Debug Tools'),
                    e('div', { className: 'flex gap-2 mb-3' },
                        e('button', {
                            onClick: testSearchStrategies,
                            disabled: !searchQuery,
                            className: 'btn btn-secondary',
                            style: { padding: '4px 8px', fontSize: '11px' }
                        }, 'Test All Strategies'),
                        e('button', {
                            onClick: () => GolfAPI.clearCache(),
                            className: 'btn btn-secondary',
                            style: { padding: '4px 8px', fontSize: '11px' }
                        }, 'Clear Cache'),
                        e('button', {
                            onClick: () => console.log('Cache:', GolfAPI.getCacheStats()),
                            className: 'btn btn-secondary',
                            style: { padding: '4px 8px', fontSize: '11px' }
                        }, 'Log Cache')
                    ),
                    
                    testResults && e('div', { 
                        style: { 
                            background: '#fff', 
                            padding: '8px', 
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            maxHeight: '200px',
                            overflow: 'auto'
                        } 
                    }, 
                        typeof testResults === 'string' ? 
                            testResults : 
                            JSON.stringify(testResults, null, 2)
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
                                    style: { color: sourceInfo.color }
                                },
                                    `18 holes • ${sourceInfo.label} • ID: ${safeCourse.id.slice(0, 12)}...`
                                )
                            ),
                            e('div', { className: 'btn' }, '⛳ Select →')
                        )
                    );
                })
            ),
            
            // No results
            (courses && courses.length === 0 && searchQuery && !loading) && e('div', { className: 'card text-center' },
                e('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🔍'),
                e('h3', { className: 'text-xl font-semibold mb-2' }, 'No courses found'),
                e('p', { className: 'text-gray-600 mb-4' }, 
                    `No results for "${searchQuery}". Try the debug tools to see what's happening.`
                )
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