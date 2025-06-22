// Main Golf Scorecard Application Controller
(function() {
    'use strict';
    
    let retryCount = 0;
    const maxRetries = 2;
    
    // Check if all required modules are loaded
    const checkModules = () => {
        const requiredModules = ['GolfUtils', 'GolfAPI', 'CourseData', 'GolfScoring'];
        const missing = [];
        
        for (const module of requiredModules) {
            if (typeof window[module] === 'undefined') {
                missing.push(module);
            }
        }
        
        return missing;
    };
    
    // Check if all React components are loaded
    const checkComponents = () => {
        const requiredComponents = ['PlayerSetup', 'CourseSearch', 'Scorecard', 'GameOfTens'];
        const missing = [];
        
        for (const component of requiredComponents) {
            if (typeof window[component] === 'undefined') {
                missing.push(component);
            }
        }
        
        return missing;
    };
    
    // Initialize the application
    const initializeApp = async () => {
        try {
            GolfUtils.updateStatus('Checking dependencies...', 'info');
            
            // Check if React is loaded
            if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
                throw new Error('React libraries not loaded');
            }
            
            // Check if our modules are loaded
            const missingModules = checkModules();
            if (missingModules.length > 0) {
                throw new Error(`Missing modules: ${missingModules.join(', ')}`);
            }
            
            // Check if components are loaded
            const missingComponents = checkComponents();
            if (missingComponents.length > 0) {
                throw new Error(`Missing components: ${missingComponents.join(', ')}`);
            }
            
            GolfUtils.updateStatus('Starting application...', 'success');
            setTimeout(startGolfApp, 500);
            
        } catch (error) {
            GolfUtils.handleError(error, 'initializeApp');
            retryCount++;
            
            if (retryCount < maxRetries) {
                GolfUtils.updateStatus(`Initialization failed. Retrying (${retryCount}/${maxRetries})...`, 'warning');
                setTimeout(initializeApp, 2000);
            } else {
                GolfUtils.updateStatus('Failed to initialize application', 'error');
                setTimeout(GolfUtils.showError, 1000);
            }
        }
    };
    
    // Main Golf Application
    const startGolfApp = () => {
        try {
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
                        players[i] || { name: '', handicap: 0 }
                    );
                    setPlayers(newPlayers);
                }, [numPlayers]);
                
                // Load saved data on mount
                useEffect(() => {
                    const savedData = GolfUtils.loadFromStorage('current-round');
                    if (savedData) {
                        setStep(savedData.step || 'setup');
                        setPlayers(savedData.players || players);
                        setPlayTens(savedData.playTens || false);
                        if (savedData.selectedCourse) setSelectedCourse(savedData.selectedCourse);
                        if (savedData.scores) setScores(savedData.scores);
                        if (savedData.tensSelections) setTensSelections(savedData.tensSelections);
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
                    GolfUtils.saveToStorage('current-round', null);
                };
                
                // Render based on current step
                if (step === 'setup') {
                    return e(window.PlayerSetup, {
                        numPlayers,
                        setNumPlayers,
                        players,
                        setPlayers,
                        playTens,
                        setPlayTens,
                        onContinue: () => setStep('course-search')
                    });
                }
                
                if (step === 'course-search') {
                    return e(window.CourseSearch, {
                        searchQuery,
                        setSearchQuery,
                        loading,
                        courses,
                        onSearch: searchCourses,
                        onSelectCourse: selectCourse,
                        onBack: () => setStep('setup')
                    });
                }
                
                if (step === 'scorecard' && selectedCourse) {
                    return e(window.Scorecard, {
                        course: selectedCourse,
                        players,
                        scores,
                        tensSelections,
                        playTens,
                        onUpdateScore: updateScore,
                        onToggleTens: toggleTensSelection,
                        onBack: () => setStep('course-search'),
                        onNewRound: startNewRound
                    });
                }
                
                return e('div', { className: 'card text-center' }, 
                    e('h1', { className: 'text-xl font-bold mb-4' }, 'Golf Scorecard Pro'),
                    e('p', { className: 'text-gray-600' }, 'Ready to start your round!'),
                    e('button', {
                        onClick: () => setStep('setup'),
                        className: 'btn mt-4'
                    }, 'Start New Round')
                );
            };
            
            // Render the application
            GolfUtils.showApp();
            ReactDOM.render(e(GolfScorecardApp), GolfUtils.$('app'));
            console.log('✅ Golf Scorecard Pro loaded successfully!');
            
        } catch (error) {
            GolfUtils.handleError(error, 'startGolfApp');
            GolfUtils.showError();
        }
    };
    
    // Wait for DOM to be ready, then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
})();