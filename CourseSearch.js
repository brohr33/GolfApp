// Course Search Component
window.CourseSearch = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function CourseSearch({ 
        searchQuery, 
        setSearchQuery, 
        loading, 
        courses, 
        hasSearched,
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
            info.push(`⛳ Par ${course.par}`);
            if (course.yardage) info.push(`📏 ${course.yardage} yards`);
            if (course.rating) info.push(`📊 Rating: ${course.rating}`);
            if (course.slope) info.push(`📈 Slope: ${course.slope}`);
            return info;
        };
        
        return e('div', null,
            // Header
            e('div', { className: 'card text-center mb-6' },
                e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '🔍'),
                e('h1', { className: 'text-3xl font-bold mb-2' }, 'Find Your Course'),
                e('p', { className: 'text-gray-600' }, 'Search our database of golf courses worldwide')
            ),
            
            // Search section
            e('div', { className: 'card' },
                e('div', { className: 'flex gap-3 mb-4' },
                    e('input', {
                        type: 'text',
                        value: searchQuery,
                        onChange: (evt) => setSearchQuery(evt.target.value),
                        placeholder: 'Search courses (try "Pebble Beach", "Augusta", or your local course)...',
                        className: 'input',
                        style: { flex: '1' },
                        onKeyPress: handleKeyPress,
                        disabled: loading
                    }),
                    e('button', {
                        onClick: onSearch,
                        disabled: loading || !searchQuery.trim(),
                        className: 'btn'
                    }, loading ? 
                        e('div', { className: 'flex' },
                            e('div', { className: 'spinner' }),
                            'Searching...'
                        ) : 
                        '🔍 Search'
                    )
                )
            ),
            
            // Search results
            courses.length > 0 && e('div', null,
                e('h2', { className: 'text-2xl font-bold mb-4' }, 
                    `Found ${courses.length} Course${courses.length !== 1 ? 's' : ''}`
                ),
                courses.map(course =>
                    e('div', { 
                        key: course.id, 
                        className: 'course-card mb-4',
                        onClick: () => onSelectCourse(course)
                    },
                        e('div', { className: 'flex-between' },
                            e('div', { style: { flex: '1' } },
                                e('h3', { className: 'text-xl font-bold mb-2' }, course.name),
                                e('div', { className: 'text-gray-600 mb-2' },
                                    e('div', null, `📍 ${course.city}, ${course.state}`)
                                ),
                                e('div', { className: 'flex flex-wrap gap-4 text-sm' },
                                    formatCourseInfo(course).map((info, index) =>
                                        e('span', { key: index, className: index === 0 ? 'font-medium' : '' }, info)
                                    )
                                ),
                                e('div', { className: 'text-xs text-gray-500 mt-2' },
                                    '18 holes • Sample data'
                                )
                            ),
                            e('div', { className: 'btn' }, '⛳ Select →')
                        )
                    )
                )
            ),
            
            // No results message - only shows after a search has been performed
            courses.length === 0 && hasSearched && !loading && e('div', { className: 'card text-center' },
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
            
            // Back button
            e('div', { className: 'mt-6' },
                e('button', {
                    onClick: onBack,
                    className: 'btn btn-secondary'
                }, '← Back to Setup')
            )
        );
    };
})();