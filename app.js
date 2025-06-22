const { useState, useEffect } = React;
const { Search, Users, Target, Trophy, Plus, Minus } = lucide;

const GolfScorecardApp = () => {
  const [step, setStep] = useState('setup');
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState([{ name: '', handicap: 0 }]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [tensSelections, setTensSelections] = useState({});
  const [playTens, setPlayTens] = useState(false);
  const [courseCache, setCourseCache] = useState({});

  useEffect(() => {
    const newPlayers = Array.from({ length: numPlayers }, (_, i) => 
      players[i] || { name: `Player ${i + 1}`, handicap: 0 }
    );
    setPlayers(newPlayers);
  }, [numPlayers]);

  const searchCourses = async () => {
    if (!searchQuery.trim()) return;
    
    const cacheKey = searchQuery.toLowerCase().trim();
    if (courseCache[cacheKey]) {
      console.log('Using cached results for:', searchQuery);
      setCourses(courseCache[cacheKey]);
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoints = [
        `https://api.golfcourseapi.com/courses?search=${encodeURIComponent(searchQuery)}`,
        `https://api.golfcourseapi.com/v1/courses?q=${encodeURIComponent(searchQuery)}`,
        `https://api.golfcourseapi.com/search?name=${encodeURIComponent(searchQuery)}`,
        `https://golfcourseapi.com/api/courses?search=${encodeURIComponent(searchQuery)}`
      ];
      
      let apiResponse = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': 'Key VLNANFMEVIQBJ6T75A52WMQUKI',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            apiResponse = await response.json();
            console.log('Successful API response from:', endpoint);
            console.log('Response data:', apiResponse);
            break;
          } else {
            console.log(`Endpoint ${endpoint} returned status ${response.status}`);
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      if (apiResponse) {
        let coursesData = [];
        
        if (Array.isArray(apiResponse)) {
          coursesData = apiResponse;
        } else if (apiResponse.courses && Array.isArray(apiResponse.courses)) {
          coursesData = apiResponse.courses;
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          coursesData = apiResponse.data;
        } else if (apiResponse.results && Array.isArray(apiResponse.results)) {
          coursesData = apiResponse.results;
        } else {
          console.log('Unexpected API response structure:', apiResponse);
          throw new Error('Unexpected response format');
        }
        
        const transformedCourses = coursesData.map((course, index) => ({
          id: course.id || course.course_id || `api-${index}`,
          name: course.name || course.course_name || course.title || `Course ${index + 1}`,
          city: course.city || course.location?.city || 'Unknown City',
          state: course.state || course.location?.state || course.region || 'Unknown State',
          country: course.country || course.location?.country || 'Unknown Country',
          par: course.par || course.total_par || 72,
          yardage: course.yardage || course.total_yardage || null,
          rating: course.rating || course.course_rating || null,
          slope: course.slope || course.slope_rating || null,
          holes: course.holes || course.scorecard || generateDefaultHoles(course.par || 72)
        }));
        
        console.log(`Found ${transformedCourses.length} courses from API`);
        setCourses(transformedCourses);
        setCourseCache(prev => ({ ...prev, [cacheKey]: transformedCourses }));
        
      } else {
        throw new Error('No valid API response from any endpoint');
      }
      
    } catch (error) {
      console.error('All API endpoints failed, using fallback data:', error);
      const fallbackCourses = generateFallbackCourses(searchQuery);
      setCourses(fallbackCourses);
      setCourseCache(prev => ({ ...prev, [`${cacheKey}_fallback`]: fallbackCourses }));
    }
    
    setLoading(false);
  };

  const generateFallbackCourses = (query) => {
    const searchLower = query.toLowerCase();
    
    if (searchLower.includes('pebble')) {
      return [{
        id: 'pebble-beach-fallback',
        name: 'Pebble Beach Golf Links',
        city: 'Pebble Beach',
        state: 'CA',
        country: 'USA',
        par: 72,
        yardage: 7040,
        rating: 74.5,
        slope: 142,
        holes: generatePebbleBeachHoles()
      }];
    } else if (searchLower.includes('augusta')) {
      return [{
        id: 'augusta-national-fallback',
        name: 'Augusta National Golf Club',
        city: 'Augusta',
        state: 'GA',
        country: 'USA',
        par: 72,
        yardage: 7475,
        rating: 76.2,
        slope: 137,
        holes: generateAugustaNationalHoles()
      }];
    } else {
      return [
        {
          id: `${query.replace(/\s+/g, '-').toLowerCase()}-gc`,
          name: `${query} Golf Club`,
          city: 'Sample City',
          state: 'CA',
          country: 'USA',
          par: 72,
          yardage: 6800,
          rating: 72.1,
          slope: 125,
          holes: generateDefaultHoles(72)
        },
        {
          id: `${query.replace(/\s+/g, '-').toLowerCase()}-cc`,
          name: `${query} Country Club`,
          city: 'Sample Town',
          state: 'TX',
          country: 'USA',
          par: 71,
          yardage: 6650,
          rating: 71.8,
          slope: 128,
          holes: generateDefaultHoles(71)
        }
      ];
    }
  };

  const generateDefaultHoles = (totalPar) => {
    return Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: i % 6 === 0 ? 5 : i % 4 === 0 ? 3 : 4,
      yardage: 150 + Math.floor(Math.random() * 400),
      handicap: i + 1
    }));
  };

  const generatePebbleBeachHoles = () => {
    return [
      { hole: 1, par: 4, yardage: 381, handicap: 11 },
      { hole: 2, par: 5, yardage: 502, handicap: 13 },
      { hole: 3, par: 4, yardage: 390, handicap: 9 },
      { hole: 4, par: 4, yardage: 331, handicap: 15 },
      { hole: 5, par: 3, yardage: 188, handicap: 17 },
      { hole: 6, par: 5, yardage: 513, handicap: 5 },
      { hole: 7, par: 3, yardage: 106, handicap: 7 },
      { hole: 8, par: 4, yardage: 418, handicap: 1 },
      { hole: 9, par: 4, yardage: 464, handicap: 3 },
      { hole: 10, par: 4, yardage: 446, handicap: 6 },
      { hole: 11, par: 4, yardage: 390, handicap: 14 },
      { hole: 12, par: 3, yardage: 202, handicap: 16 },
      { hole: 13, par: 4, yardage: 399, handicap: 8 },
      { hole: 14, par: 5, yardage: 572, handicap: 2 },
      { hole: 15, par: 4, yardage: 397, handicap: 12 },
      { hole: 16, par: 4, yardage: 402, handicap: 10 },
      { hole: 17, par: 3, yardage: 178, handicap: 18 },
      { hole: 18, par: 5, yardage: 543, handicap: 4 }
    ];
  };

  const generateAugustaNationalHoles = () => {
    return [
      { hole: 1, par: 4, yardage: 445, handicap: 10 },
      { hole: 2, par: 5, yardage: 575, handicap: 16 },
      { hole: 3, par: 4, yardage: 350, handicap: 14 },
      { hole: 4, par: 3, yardage: 240, handicap: 6 },
      { hole: 5, par: 4, yardage: 495, handicap: 2 },
      { hole: 6, par: 3, yardage: 180, handicap: 18 },
      { hole: 7, par: 4, yardage: 450, handicap: 12 },
      { hole: 8, par: 5, yardage: 570, handicap: 8 },
      { hole: 9, par: 4, yardage: 460, handicap: 4 },
      { hole: 10, par: 4, yardage: 495, handicap: 1 },
      { hole: 11, par: 4, yardage: 520, handicap: 3 },
      { hole: 12, par: 3, yardage: 155, handicap: 17 },
      { hole: 13, par: 5, yardage: 510, handicap: 9 },
      { hole: 14, par: 4, yardage: 440, handicap: 11 },
      { hole: 15, par: 5, yardage: 550, handicap: 5 },
      { hole: 16, par: 3, yardage: 170, handicap: 15 },
      { hole: 17, par: 4, yardage: 440, handicap: 13 },
      { hole: 18, par: 4, yardage: 465, handicap: 7 }
    ];
  };

  const selectCourse = (course) => {
    setSelectedCourse(course);
    const initialScores = {};
    const initialTensSelections = {};
    players.forEach((player, playerIndex) => {
      initialScores[playerIndex] = {};
      initialTensSelections[playerIndex] = {};
      course.holes.forEach(hole => {
        initialScores[playerIndex][hole.hole] = '';
        initialTensSelections[playerIndex][hole.hole] = false;
      });
    });
    setScores(initialScores);
    setTensSelections(initialTensSelections);
    setStep('scorecard');
  };

  const updateScore = (playerIndex, hole, score) => {
    setScores(prev => ({
      ...prev,
      [playerIndex]: {
        ...prev[playerIndex],
        [hole]: score
      }
    }));
  };

  const calculateTotal = (playerIndex) => {
    if (!selectedCourse) return 0;
    return selectedCourse.holes.reduce((total, hole) => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]) || 0;
      return total + score;
    }, 0);
  };

  const calculateFrontNine = (playerIndex) => {
    if (!selectedCourse) return 0;
    return selectedCourse.holes.slice(0, 9).reduce((total, hole) => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]) || 0;
      return total + score;
    }, 0);
  };

  const calculateBackNine = (playerIndex) => {
    if (!selectedCourse) return 0;
    return selectedCourse.holes.slice(9, 18).reduce((total, hole) => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]) || 0;
      return total + score;
    }, 0);
  };

  const calculateNetScore = (playerIndex) => {
    if (!selectedCourse) return 0;
    
    let netScore = 0;
    selectedCourse.holes.forEach(hole => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]);
      if (score && score > 0) {
        const strokes = getStrokesForHole(playerIndex, hole.handicap);
        netScore += score - strokes;
      }
    });
    
    return netScore;
  };

  const calculateNetFrontNine = (playerIndex) => {
    if (!selectedCourse) return 0;
    
    let netScore = 0;
    selectedCourse.holes.slice(0, 9).forEach(hole => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]);
      if (score && score > 0) {
        const strokes = getStrokesForHole(playerIndex, hole.handicap);
        netScore += score - strokes;
      }
    });
    
    return netScore;
  };

  const calculateNetBackNine = (playerIndex) => {
    if (!selectedCourse) return 0;
    
    let netScore = 0;
    selectedCourse.holes.slice(9, 18).forEach(hole => {
      const score = parseInt(scores[playerIndex]?.[hole.hole]);
      if (score && score > 0) {
        const strokes = getStrokesForHole(playerIndex, hole.handicap);
        netScore += score - strokes;
      }
    });
    
    return netScore;
  };

  const getStrokesForHole = (playerIndex, holeHandicap) => {
    const playerHandicap = players[playerIndex]?.handicap || 0;
    
    if (playerHandicap <= 0) return 0;
    
    const strokesPerHole = Math.floor(playerHandicap / 18);
    const extraStrokes = playerHandicap % 18;
    let strokes = strokesPerHole;
    
    if (holeHandicap <= extraStrokes) {
      strokes += 1;
    }
    
    return strokes;
  };

  const toggleTensSelection = (playerIndex, hole) => {
    const currentSelections = tensSelections[playerIndex] || {};
    const selectedCount = Object.values(currentSelections).filter(Boolean).length;
    
    if (!currentSelections[hole] && selectedCount >= 10) {
      return;
    }
    
    setTensSelections(prev => ({
      ...prev,
      [playerIndex]: {
        ...prev[playerIndex],
        [hole]: !prev[playerIndex][hole]
      }
    }));
  };

  const calculateTensScore = (playerIndex) => {
    if (!selectedCourse) return { netScore: 0, selectedHoles: 0, parTotal: 0 };
    
    let netScore = 0;
    let selectedHoles = 0;
    let parTotal = 0;
    
    selectedCourse.holes.forEach(hole => {
      if (tensSelections[playerIndex]?.[hole.hole]) {
        selectedHoles++;
        parTotal += hole.par;
        const score = parseInt(scores[playerIndex]?.[hole.hole]);
        if (score && score > 0) {
          const strokes = getStrokesForHole(playerIndex, hole.handicap);
          netScore += score - strokes;
        }
      }
    });
    
    return { netScore, selectedHoles, parTotal };
  };

  if (step === 'setup') {
    return React.createElement('div', { className: 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement(Trophy, { className: 'mx-auto mb-4 text-green-600', size: 48 }),
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-800 mb-2' }, 'Golf Scorecard'),
        React.createElement('p', { className: 'text-gray-600' }, 'Set up your round')
      ),
      React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
            React.createElement(Users, { className: 'inline mr-2', size: 16 }),
            'Number of Players (1-4)'
          ),
          React.createElement('select', {
            value: numPlayers,
            onChange: (e) => setNumPlayers(parseInt(e.target.value)),
            className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
          },
            [1, 2, 3, 4].map(num => 
              React.createElement('option', { key: num, value: num }, `${num} Player${num > 1 ? 's' : ''}`)
            )
          )
        ),
        React.createElement('div', { className: 'space-y-4' },
          players.map((player, index) =>
            React.createElement('div', { key: index, className: 'bg-gray-50 p-4 rounded-lg' },
              React.createElement('h3', { className: 'font-semibold text-gray-700 mb-3' }, `Player ${index + 1}`),
              React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-600 mb-1' }, 'Name'),
                  React.createElement('input', {
                    type: 'text',
                    value: player.name,
                    onChange: (e) => {
                      const newPlayers = [...players];
                      newPlayers[index].name = e.target.value;
                      setPlayers(newPlayers);
                    },
                    placeholder: `Player ${index + 1}`,
                    className: 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  })
                ),
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-600 mb-1' },
                    React.createElement(Target, { className: 'inline mr-1', size: 14 }),
                    'Handicap'
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: player.handicap,
                    onChange: (e) => {
                      const newPlayers = [...players];
                      newPlayers[index].handicap = parseInt(e.target.value) || 0;
                      setPlayers(newPlayers);
                    },
                    min: '0',
                    max: '54',
                    className: 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  })
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'bg-purple-50 p-4 rounded-lg border-2 border-purple-200' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('h3', { className: 'font-semibold text-purple-800 mb-1' }, 'Game of Tens'),
              React.createElement('p', { className: 'text-sm text-purple-600' }, 'Enable the side game where each player selects their best 10 holes')
            ),
            React.createElement('button', {
              onClick: () => setPlayTens(!playTens),
              className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${playTens ? 'bg-purple-600' : 'bg-gray-300'}`
            },
              React.createElement('span', {
                className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${playTens ? 'translate-x-6' : 'translate-x-1'}`
              })
            )
          )
        ),
        React.createElement('button', {
          onClick: () => setStep('course-search'),
          className: 'w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold'
        }, 'Continue to Course Selection')
      )
    );
  }

  if (step === 'course-search') {
    return React.createElement('div', { className: 'max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement(Search, { className: 'mx-auto mb-4 text-green-600', size: 48 }),
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-800 mb-2' }, 'Select Golf Course'),
        React.createElement('p', { className: 'text-gray-600' }, 'Search for your course')
      ),
      React.createElement('div', { className: 'mb-6' },
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('input', {
            type: 'text',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: 'Search for golf courses (e.g., \'Pebble Beach\', \'Augusta\')...',
            className: 'flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent',
            onKeyPress: (e) => e.key === 'Enter' && searchCourses()
          }),
          React.createElement('button', {
            onClick: searchCourses,
            disabled: loading,
            className: 'bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
          }, loading ? 'Searching...' : 'Search')
        ),
        React.createElement('div', { className: 'mt-2 text-xs text-blue-600' },
          React.createElement('strong', null, 'API Integration:'), ' Using Golf Course API. Check browser console for details.'
        )
      ),
      courses.length > 0 && React.createElement('div', { className: 'space-y-4' },
        React.createElement('h2', { className: 'text-xl font-semibold text-gray-800' }, 'Search Results'),
        courses.map(course =>
          React.createElement('div', { key: course.id, className: 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors' },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800' }, course.name),
                React.createElement('div', { className: 'text-gray-600 mt-1' },
                  React.createElement('p', null, `${course.city}, ${course.state}`),
                  course.country && course.country !== 'Unknown Country' && React.createElement('p', { className: 'text-sm' }, course.country)
                ),
                React.createElement('div', { className: 'flex flex-wrap gap-4 mt-2 text-sm text-gray-500' },
                  React.createElement('span', { className: 'font-medium' }, `Par: ${course.par}`),
                  course.yardage && React.createElement('span', null, `Yardage: ${course.yardage}`),
                  course.rating && React.createElement('span', null, `Rating: ${course.rating}`),
                  course.slope && React.createElement('span', null, `Slope: ${course.slope}`)
                ),
                React.createElement('div', { className: 'text-xs text-gray-400 mt-1' },
                  `18 holes • ${course.id.includes('fallback') ? 'Fallback data' : 'API data'}`
                )
              ),
              React.createElement('button', {
                onClick: () => selectCourse(course),
                className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors ml-4'
              }, 'Select Course')
            )
          )
        )
      ),
      React.createElement('button', {
        onClick: () => setStep('setup'),
        className: 'mt-6 text-green-600 hover:text-green-700 transition-colors'
      }, '← Back to Player Setup')
    );
  }

  if (step === 'scorecard' && selectedCourse) {
    return React.createElement('div', { className: 'max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-800 mb-2' }, selectedCourse.name),
        React.createElement('div', { className: 'text-gray-600' },
          React.createElement('p', null, `${selectedCourse.city}, ${selectedCourse.state}`),
          React.createElement('div', { className: 'flex justify-center gap-6 mt-2 text-sm' },
            React.createElement('span', null, `Par ${selectedCourse.par}`),
            selectedCourse.yardage && React.createElement('span', null, `${selectedCourse.yardage} yards`),
            selectedCourse.rating && React.createElement('span', null, `Rating: ${selectedCourse.rating}`),
            selectedCourse.slope && React.createElement('span', null, `Slope: ${selectedCourse.slope}`)
          )
        )
      ),
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full border-collapse bg-white' },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-green-100 border-b-2 border-green-200' },
              React.createElement('th', { className: 'p-3 text-left font-semibold' }, 'Hole'),
              React.createElement('th', { className: 'p-3 text-center font-semibold' }, 'Par'),
              React.createElement('th', { className: 'p-3 text-center font-semibold' }, 'Yards'),
              React.createElement('th', { className: 'p-3 text-center font-semibold' }, 'HCP'),
              players.map((player, index) =>
                React.createElement('th', { key: index, className: 'p-3 text-center font-semibold min-w-32' },
                  player.name || `Player ${index + 1}`,
                  React.createElement('div', { className: 'text-xs font-normal text-gray-600' }, `HCP: ${player.handicap}`)
                )
              )
            )
          ),
          React.createElement('tbody', null,
            selectedCourse.holes.map((hole, index) =>
              React.createElement(React.Fragment, { key: hole.hole },
                React.createElement('tr', { className: 'border-b border-gray-200 hover:bg-gray-50' },
                  React.createElement('td', { className: 'p-3 font-semibold' }, hole.hole),
                  React.createElement('td', { className: 'p-3 text-center' }, hole.par),
                  React.createElement('td', { className: 'p-3 text-center' }, hole.yardage),
                  React.createElement('td', { className: 'p-3 text-center' }, hole.handicap),
                  players.map((player, playerIndex) => {
                    const strokes = getStrokesForHole(playerIndex, hole.handicap);
                    const isSelectedForTens = tensSelections[playerIndex]?.[hole.hole];
                    const tensCount = Object.values(tensSelections[playerIndex] || {}).filter(Boolean).length;
                    const canSelectForTens = isSelectedForTens || tensCount < 10;
                    
                    return React.createElement('td', { key: playerIndex, className: 'p-3 text-center' },
                      React.createElement('div', { className: 'flex flex-col items-center space-y-1' },
                        React.createElement('input', {
                          type: 'number',
                          value: scores[playerIndex]?.[hole.hole] || '',
                          onChange: (e) => updateScore(playerIndex, hole.hole, e.target.value),
                          min: '1',
                          max: '15',
                          className: 'w-16 p-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent'
                        }),
                        strokes > 0 && React.createElement('div', { className: 'text-xs text-blue-600 font-medium' },
                          `${strokes} stroke${strokes > 1 ? 's' : ''}`
                        ),
                        playTens && React.createElement('button', {
                          onClick: () => toggleTensSelection(playerIndex, hole.hole),
                          disabled: !canSelectForTens,
                          className: `text-xs px-2 py-1 rounded transition-colors ${
                            isSelectedForTens 
                              ? 'bg-purple-600 text-white' 
                              : canSelectForTens
                                ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`
                        }, isSelectedForTens ? '✓ Tens' : 'Tens')
                      )
                    );
                  })
                ),
                index === 8 && React.createElement('tr', { className: 'bg-yellow-50 border-t border-b border-yellow-200 font-semibold' },
                  React.createElement('td', { className: 'p-3' }, 'FRONT 9'),
                  React.createElement('td', { className: 'p-3 text-center' }, selectedCourse.holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)),
                  React.createElement('td', { className: 'p-3 text-center' }, '-'),
                  React.createElement('td', { className: 'p-3 text-center' }, '-'),
                  players.map((player, playerIndex) => {
                    const frontNineScore = calculateFrontNine(playerIndex);
                    const frontNineNet = calculateNetFrontNine(playerIndex);
                    return React.createElement('td', { key: playerIndex, className: 'p-3 text-center' },
                      React.createElement('div', null, frontNineScore || 0),
                      React.createElement('div', { className: 'text-xs text-gray-600' }, `Net: ${frontNineNet || 0}`)
                    );
                  })
                )
              )
            ),
            React.createElement('tr', { className: 'bg-yellow-50 border-t border-b border-yellow-200 font-semibold' },
              React.createElement('td', { className: 'p-3' }, 'BACK 9'),
              React.createElement('td', { className: 'p-3 text-center' }, selectedCourse.holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0)),
              React.createElement('td', { className: 'p-3 text-center' }, '-'),
              React.createElement('td', { className: 'p-3 text-center' }, '-'),
              players.map((player, playerIndex) => {
                const backNineScore = calculateBackNine(playerIndex);
                const backNineNet = calculateNetBackNine(playerIndex);
                return React.createElement('td', { key: playerIndex, className: 'p-3 text-center' },
                  React.createElement('div', null, backNineScore || 0),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, `Net: ${backNineNet || 0}`)
                );
              })
            ),
            React.createElement('tr', { className: 'bg-green-50 border-t-2 border-green-200 font-semibold' },
              React.createElement('td', { className: 'p-3' }, 'TOTAL'),
              React.createElement('td', { className: 'p-3 text-center' }, selectedCourse.par),
              React.createElement('td', { className: 'p-3 text-center' }, '-'),
              React.createElement('td', { className: 'p-3 text-center' }, '-'),
              players.map((player, playerIndex) => {
                const totalScore = calculateTotal(playerIndex);
                const netScore = calculateNetScore(playerIndex);
                return React.createElement('td', { key: playerIndex, className: 'p-3 text-center' },
                  React.createElement('div', null, totalScore || 0),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, `Net: ${netScore || 0}`)
                );
              })
            )
          )
        )
      ),
      playTens && React.createElement('div', { className: 'mt-8 bg-purple-50 rounded-lg p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold text-purple-800 mb-4 text-center' }, 'Game of Tens'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
          players.map((player, playerIndex) => {
            const tensData = calculateTensScore(playerIndex);
            const overUnder = tensData.netScore - tensData.parTotal;
            
            return React.createElement('div', { key: playerIndex, className: 'bg-white rounded-lg p-4 border-2 border-purple-200' },
              React.createElement('h3', { className: 'font-bold text-lg text-purple-800 mb-2' },
                player.name || `Player ${playerIndex + 1}`
              ),
              React.createElement('div', { className: 'space-y-2 text-sm' },
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'Holes Selected:'),
                  React.createElement('span', { className: 'font-semibold' }, `${tensData.selectedHoles}/10`)
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'Net Score:'),
                  React.createElement('span', { className: 'font-semibold' }, tensData.netScore || 0)
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'Par Total:'),
                  React.createElement('span', { className: 'font-semibold' }, tensData.parTotal || 0)
                ),
                React.createElement('div', { className: 'flex justify-between border-t pt-2' },
                  React.createElement('span', { className: 'text-gray-600' }, 'vs Par:'),
                  React.createElement('span', { 
                    className: `font-bold ${overUnder > 0 ? 'text-red-600' : overUnder < 0 ? 'text-green-600' : 'text-gray-800'}`
                  }, overUnder === 0 ? 'E' : overUnder > 0 ? `+${overUnder}` : overUnder)
                )
              )
            );
          })
        ),
        React.createElement('div', { className: 'mt-4 text-sm text-purple-700 text-center' },
          'Select 10 holes for each player to count towards their Tens score. Click the "Tens" button below each score.'
        )
      ),
      React.createElement('div', { className: 'mt-8 flex justify-between' },
        React.createElement('button', {
          onClick: () => setStep('course-search'),
          className: 'text-green-600 hover:text-green-700 transition-colors'
        }, '← Change Course'),
        React.createElement('button', {
          onClick: () => {
            setStep('setup');
            setScores({});
            setTensSelections({});
            setSelectedCourse(null);
            setCourses([]);
          },
          className: 'bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors'
        }, 'New Round')
      )
    );
  }

  return null;
};

ReactDOM.render(React.createElement(GolfScorecardApp), document.getElementById('root'));