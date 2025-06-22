// Main Golf Scorecard Application Controller
(function() {
    'use strict';
    
    let retryCount = 0;
    const maxRetries = 3;
    
    // Initialize the application
    const initializeApp = async () => {
        try {
            GolfUtils.updateStatus('Loading React...', 'info');
            
            // Check if React is already loaded
            if (typeof React === 'undefined') {
                await GolfUtils.loadScript('https://unpkg.com/react@18/umd/react.production.min.js', 'React');
            }
            
            if (typeof ReactDOM === 'undefined') {
                GolfUtils.updateStatus('Loading ReactDOM...', 'info');
                await GolfUtils.loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', 'ReactDOM');
            }
            
            GolfUtils.updateStatus('Loading Tailwind CSS...', 'info');
            try {
                await GolfUtils.loadScript('https://cdn.tailwindcss.com', 'Tailwind CSS');
            } catch (e) {
                console.warn('Tailwind CSS failed to load, using fallback styles');
            }
            
            GolfUtils.updateStatus('Starting application...', 'success');
            setTimeout(startGolfApp, 500);
            
        } catch (error) {
            GolfUtils.handleError(error, 'initializeApp');
            retryCount++;
            
            if (retryCount < maxRetries) {
                GolfUtils.updateStatus(`Load failed. Retrying (${retryCount}/${maxRetries})...`, 'warning');
                setTimeout(initializeApp, 2000);
            } else {
                GolfUtils.updateStatus('Unable to load full application. Using simplified version.', 'error');
                setTimeout(GolfUtils.showFallback, 1000);
            }
        }
    };
    
    // Main Golf Application
    const startGolfApp = () => {
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            GolfUtils.updateStatus('React libraries not available', 'error');
            GolfUtils.showFallback();
            return;
        }
        
        // Check if required modules are loaded
        const requiredModules = ['GolfUtils', 'GolfAPI', 'CourseData', 'GolfScoring'];
        for (const module of requiredModules) {
            if (typeof window[module] === 'undefined') {
                console.error(`Required module ${module} not loaded`);
                GolfUtils.updateStatus(`Missing module: ${module}`, 'error');
                GolfUtils.showFallback();
                return;
            }
        }
        
        const { useState, useEffect, createElement: e } = React;
        
        // Main Golf Scorecard Component
        const GolfScorecardApp = () => {
            // State management
            const [step, setStep] = useState('setup');
            const [numPlayers, setNumPlayers] = useState(2);
            const [players, setPlayers] = useState([
                { name: '', handicap: 0 },
                { name: '', handicap: 0 }
            ]);
            const [courses, setCourses] = useState([]);
            const [selectedCourse, setSelectedCourse] = useState(null);
            const [searchQuery, setSearchQuery] = useState('');
            const [loading, setLoading] = useState(false);
            const [scores, setScores] = useState({});
            const [tensSelections, setTensSelections] = useState({});
            const [playTens, setPlayTens] = useState(false);
            
            // Initialize players when count changes
            useEffect(() => {
                const newPlayers = Array.from({ length: numPlayers }, (_, i) => 
                    players[i] || { name: `Player ${i + 1}`, handicap: 0 }
                );
                setPlayers(newPlayers);
            }, [numPlayers]);
            
            // Load saved data on mount
            useEffect(() => {
                const savedData = GolfUtils.loadFromStorage('current-round');
                if (savedData) {
                    // Restore state from saved data
                    setStep(savedData.step || 'setup');
                    setPlayers(savedData.players || players);
                    setPlayTens(savedData.playTens || false);
                    // Could restore other state as needed
                }
            }, []);
            
            // Save state when it changes
            useEffect(() => {
                const dataToSave = {
                    step,
                    players,
                    playTens,
                    selectedCourse,
                    scores,
                    tensSelections
                };
                GolfUtils.saveToStorage('current-round', dataToSave);
            }, [step, players, playTens, selectedCourse, scores, tensSelections]);
            
            // Course search with API integration
            const searchCourses = async () => {
                if (!searchQuery.trim()) return;
                
                setLoading(true);
                
                try {
                    const apiCourses = await GolfAPI.searchCourses(searchQuery);
                    
                    // Process courses and ensure they have proper hole data
                    const processedCourses = apiCourses.map(course => ({
                        ...course,
                        holes: CourseData.validateAndFixHoles(course.holes)
                    }));
                    
                    setCourses(processedCourses);
                    
                } catch (error) {
                    console.log('API search failed, using fallback data');
                    const fallbackCourses = CourseData.generateFallbackCourses(searchQuery);
                    setCourses(fallbackCourses);
                }
                
                setLoading(false);
            };
            
            // Select course and initialize scoring
            const selectCourse = (course) => {
                setSelectedCourse(course);
                
                // Initialize scoring arrays
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
            
            // Update player score
            const updateScore = (playerIndex, hole, score) => {
                setScores(prev => ({
                    ...prev,
                    [playerIndex]: {
                        ...prev[playerIndex],
                        [hole]: score
                    }
                }));
            };
            
            // Toggle tens selection
            const toggleTensSelection = (playerIndex, hole) => {
                const currentSelections = tensSelections[playerIndex] || {};
                
                if (!GolfScoring.canSelectForTens(currentSelections, hole)) {
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
            
            // Start new round
            const startNewRound = () => {
                setStep('setup');
                setScores({});
                setTensSelections({});
                setSelectedCourse(null);
                setCourses([]);
                setSearchQuery('');
                GolfUtils.saveToStorage('current-round', null); // Clear saved data
            };
            
            // Render based on current step
            if (step === 'setup') {
                return window.PlayerSetup ? e(window.PlayerSetup, {
                    numPlayers,
                    setNumPlayers,
                    players,
                    setPlayers,
                    playTens,
                    setPlayTens,
                    onContinue: () => setStep('course-search')
                }) : e('div', { className: 'card text-center' }, 
                    e('h1', null, 'PlayerSetup component not loaded')
                );
            }
            
            if (step === 'course-search') {
                return window.CourseSearch ? e(window.CourseSearch, {
                    searchQuery,
                    setSearchQuery,
                    loading,
                    courses,
                    onSearch: searchCourses,
                    onSelectCourse: selectCourse,
                    onBack: () => setStep('setup')
                }) : e('div', { className: 'card text-center' }, 
                    e('h1', null, 'CourseSearch component not loaded')
                );
            }
            
            if (step === 'scorecard' && selectedCourse) {
                return window.Scorecard ? e(window.Scorecard, {
                    course: selectedCourse,
                    players,
                    scores,
                    tensSelections,
                    playTens,
                    onUpdateScore: updateScore,
                    onToggleTens: toggleTensSelection,
                    onBack: () => setStep('course-search'),
                    onNewRound: startNewRound
                }) : e('div', { className: 'card text-center' }, 
                    e('h1', null, 'Scorecard component not loaded')
                );
            }
            
            return e('div', { className: 'card text-center' }, 
                e('h1', null, 'Golf Scorecard Pro'),
                e('p', null, 'Invalid step or missing course data')
            );
        };
        
        // Render the application
        GolfUtils.showApp();
        ReactDOM.render(e(GolfScorecardApp), GolfUtils.$('app'));
        console.log('✅ Golf Scorecard Pro loaded successfully!');
    };
    
    // Start the initialization process
    initializeApp();
})();