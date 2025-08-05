// Main Golf Scorecard Application Controller - Multiplayer Version
(function() {
    'use strict';
    
    let retryCount = 0;
    const maxRetries = 2;
    
    // Check if all required modules are loaded
    const checkModules = () => {
        const requiredModules = ['GolfUtils', 'GolfAPI', 'CourseData', 'GolfScoring', 'FirebaseConfig', 'GameSync'];
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
        const requiredComponents = ['PlayerSetup', 'CourseSearch', 'TabNavigation', 'Scorecard', 'GameOfTens', 'Skins', 'Wolf'];
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
            
            // Initialize Firebase
            GolfUtils.updateStatus('Initializing Firebase...', 'info');
            const firebaseInitialized = FirebaseConfig.initialize();
            
            if (FirebaseConfig.isDemoMode()) {
                GolfUtils.updateStatus('Running in demo mode (local only)', 'warning');
            } else if (firebaseInitialized) {
                GolfUtils.updateStatus('Firebase connected successfully', 'success');
            } else {
                GolfUtils.updateStatus('Firebase unavailable - running locally', 'warning');
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
    
    // Main Golf Application with Multiplayer Support
    const startGolfApp = () => {
        try {
            const { useState, useEffect, createElement: e } = React;
            
            // Main Golf Scorecard Component
            const GolfScorecardApp = () => {
                // State management
                const [step, setStep] = useState('setup');
                const [gameId, setGameId] = useState(null);
                const [isHost, setIsHost] = useState(false);
                const [participants, setParticipants] = useState([]);
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
                const [playSkins, setPlaySkins] = useState(false);
                const [skinsMode, setSkinsMode] = useState('push');
                const [playWolf, setPlayWolf] = useState(false);
                const [wolfSelections, setWolfSelections] = useState({});
                const [connectionStatus, setConnectionStatus] = useState('disconnected');
                const [joinGameId, setJoinGameId] = useState('');
                const [showJoinGame, setShowJoinGame] = useState(false);
                
                // Initialize players when count changes
                useEffect(() => {
                    const newPlayers = Array.from({ length: numPlayers }, (_, i) => 
                        players[i] || { name: '', handicap: 0 }
                    );
                    setPlayers(newPlayers);
                }, [numPlayers]);
                
                // Check for existing game on mount
                useEffect(() => {
                    const urlGameId = GameSync.getGameIdFromURL();
                    if (urlGameId) {
                        setJoinGameId(urlGameId);
                        handleJoinGame(urlGameId);
                    } else {
                        // Sync to multiplayer game
                    if (gameId) {
                        debouncedUpdateTens(newTensSelections);
                    }
                };
                
                // Update wolf selection for a hole
                const updateWolfSelection = async (holeNumber, selection) => {
                    const newWolfSelections = {
                        ...wolfSelections,
                        [holeNumber]: selection
                    };
                    setWolfSelections(newWolfSelections);
                    
                    // Sync to multiplayer game immediately (less frequent updates)
                    if (gameId) {
                        try {
                            await GameSync.updateWolfSelections(newWolfSelections);
                        } catch (error) {
                            console.error('Failed to sync wolf selections:', error);
                        }
                    }
                };
                
                // Start new round
                const startNewRound = () => {
                    // Stop current game sync
                    if (gameId) {
                        GameSync.stopSync();
                    }
                    
                    // Reset all state
                    setStep('setup');
                    setGameId(null);
                    setIsHost(false);
                    setParticipants([]);
                    setScores({});
                    setTensSelections({});
                    setWolfSelections({});
                    setSelectedCourse(null);
                    setCourses([]);
                    setSearchQuery('');
                    setPlayTens(false);
                    setPlaySkins(false);
                    setSkinsMode('push');
                    setPlayWolf(false);
                    setConnectionStatus('disconnected');
                    setJoinGameId('');
                    setShowJoinGame(false);
                    
                    // Clear URL
                    window.history.replaceState({}, '', window.location.pathname);
                    GolfUtils.saveToStorage('current-round', null);
                };
                
                // Continue to course search and create multiplayer game
                const continueToSearch = async () => {
                    if (!gameId) {
                        await createNewGame();
                    } else {
                        // Update existing game
                        await updateGameState({
                            step: 'course-search',
                            players,
                            playTens,
                            playSkins,
                            skinsMode,
                            playWolf
                        });
                    }
                    setStep('course-search');
                };
                
                // Connection status component
                const renderConnectionStatus = () => {
                    if (!gameId) return null;
                    
                    let statusIcon = '🔴';
                    let statusText = 'Disconnected';
                    let statusColor = '#dc2626';
                    
                    if (connectionStatus === 'connected') {
                        statusIcon = '🟢';
                        statusText = FirebaseConfig.isDemoMode() ? 'Demo Mode' : 'Connected';
                        statusColor = '#059669';
                    } else if (connectionStatus === 'connecting') {
                        statusIcon = '🟡';
                        statusText = 'Connecting...';
                        statusColor = '#d97706';
                    }
                    
                    return e('div', { 
                        style: { 
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            background: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: statusColor,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }
                    },
                        statusIcon,
                        statusText,
                        gameId && e('div', { 
                            style: { 
                                marginLeft: '8px',
                                fontSize: '10px',
                                color: '#6b7280'
                            }
                        }, `ID: ${gameId}`)
                    );
                };
                
                // Game sharing component
                const renderGameSharing = () => {
                    if (!gameId || step === 'setup') return null;
                    
                    const sharingURL = GameSync.getSharingURL();
                    
                    return e('div', { className: 'card mb-4', style: { background: '#ecfdf5', border: '2px solid #059669' } },
                        e('h3', { className: 'font-semibold text-lg mb-3' }, '🔗 Share This Game'),
                        e('div', { className: 'grid gap-3' },
                            e('div', null,
                                e('label', { className: 'block font-medium mb-1' }, 'Game URL (share with friends):'),
                                e('div', { className: 'flex gap-2' },
                                    e('input', {
                                        type: 'text',
                                        value: sharingURL,
                                        readOnly: true,
                                        className: 'input',
                                        style: { flex: '1', fontSize: '14px' },
                                        onClick: (e) => e.target.select()
                                    }),
                                    e('button', {
                                        onClick: () => {
                                            navigator.clipboard.writeText(sharingURL);
                                            // Simple feedback
                                            const btn = event.target;
                                            const originalText = btn.textContent;
                                            btn.textContent = '✓ Copied!';
                                            setTimeout(() => {
                                                btn.textContent = originalText;
                                            }, 2000);
                                        },
                                        className: 'btn btn-secondary'
                                    }, '📋 Copy')
                                )
                            ),
                            e('div', { className: 'text-sm text-gray-600' },
                                `Game ID: ${gameId} • ${participants.length} player${participants.length !== 1 ? 's' : ''} connected`
                            )
                        )
                    );
                };
                
                // Join game component
                const renderJoinGame = () => {
                    return e('div', { className: 'card text-center' },
                        e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '🔗'),
                        e('h2', { className: 'text-2xl font-bold mb-4' }, 'Join Golf Game'),
                        e('div', { className: 'grid gap-4' },
                            e('div', null,
                                e('label', { className: 'block font-medium mb-2' }, 'Enter Game ID:'),
                                e('input', {
                                    type: 'text',
                                    value: joinGameId,
                                    onChange: (e) => setJoinGameId(e.target.value.toUpperCase()),
                                    placeholder: 'ABC123',
                                    className: 'input',
                                    style: { textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }
                                })
                            ),
                            e('div', { className: 'flex gap-3' },
                                e('button', {
                                    onClick: () => {
                                        setShowJoinGame(false);
                                        setJoinGameId('');
                                    },
                                    className: 'btn btn-secondary',
                                    style: { flex: '1' }
                                }, 'Cancel'),
                                e('button', {
                                    onClick: () => handleJoinGame(joinGameId),
                                    disabled: !joinGameId.trim() || loading,
                                    className: 'btn',
                                    style: { flex: '1' }
                                }, loading ? 'Joining...' : 'Join Game')
                            )
                        )
                    );
                };
                
                // Render based on current step
                if (showJoinGame) {
                    return e('div', null,
                        renderConnectionStatus(),
                        renderJoinGame()
                    );
                }
                
                if (step === 'setup') {
                    return e('div', null,
                        renderConnectionStatus(),
                        e(window.PlayerSetup, {
                            numPlayers,
                            setNumPlayers,
                            players,
                            setPlayers,
                            playTens,
                            setPlayTens,
                            playSkins,
                            setPlaySkins,
                            skinsMode,
                            setSkinsMode,
                            playWolf,
                            setPlayWolf,
                            onContinue: continueToSearch,
                            gameId,
                            onCreateGame: createNewGame,
                            onJoinGame: () => setShowJoinGame(true)
                        })
                    );
                }
                
                if (step === 'course-search') {
                    return e('div', null,
                        renderConnectionStatus(),
                        renderGameSharing(),
                        e(window.CourseSearch, {
                            searchQuery,
                            setSearchQuery,
                            loading,
                            courses,
                            onSearch: searchCourses,
                            onSelectCourse: selectCourse,
                            onBack: () => {
                                setStep('setup');
                                if (gameId) updateGameState({ step: 'setup' });
                            }
                        })
                    );
                }
                
                if (step === 'scorecard' && selectedCourse) {
                    return e('div', null,
                        renderConnectionStatus(),
                        renderGameSharing(),
                        e(window.Scorecard, {
                            course: selectedCourse,
                            players,
                            scores,
                            tensSelections,
                            playTens,
                            playSkins,
                            skinsMode,
                            playWolf,
                            wolfSelections,
                            onUpdateScore: updateScore,
                            onToggleTens: toggleTensSelection,
                            onUpdateWolfSelection: updateWolfSelection,
                            onBack: () => {
                                setStep('course-search');
                                if (gameId) updateGameState({ step: 'course-search' });
                            },
                            onNewRound: startNewRound,
                            gameId,
                            isHost,
                            connectionStatus
                        })
                    );
                }
                
                return e('div', null,
                    renderConnectionStatus(),
                    e('div', { className: 'card text-center' }, 
                        e('h1', { className: 'text-xl font-bold mb-4' }, 'Golf Scorecard Pro'),
                        e('p', { className: 'text-gray-600 mb-6' }, 'Ready to start your round!'),
                        e('div', { className: 'flex gap-3 justify-center' },
                            e('button', {
                                onClick: () => setStep('setup'),
                                className: 'btn'
                            }, '🆕 Start New Round'),
                            e('button', {
                                onClick: () => setShowJoinGame(true),
                                className: 'btn btn-secondary'
                            }, '🔗 Join Game')
                        )
                    )
                );
            };
            
            // Render the application
            GolfUtils.showApp();
            ReactDOM.render(e(GolfScorecardApp), GolfUtils.$('app'));
            console.log('✅ Golf Scorecard Pro loaded successfully with multiplayer support!');
            
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
})(); Try to load local game
                        const savedData = GolfUtils.loadFromStorage('current-round');
                        if (savedData && !savedData.gameId) {
                            // Old local game - load it
                            loadGameState(savedData);
                        }
                    }
                }, []);
                
                // Game state update handler
                const handleGameUpdate = (gameData) => {
                    setConnectionStatus('connected');
                    loadGameState(gameData);
                };
                
                // Load game state from data
                const loadGameState = (gameData) => {
                    setStep(gameData.step || 'setup');
                    setPlayers(gameData.players || players);
                    setPlayTens(gameData.playTens || false);
                    setPlaySkins(gameData.playSkins || false);
                    setSkinsMode(gameData.skinsMode || 'push');
                    setPlayWolf(gameData.playWolf || false);
                    setWolfSelections(gameData.wolfSelections || {});
                    if (gameData.selectedCourse) setSelectedCourse(gameData.selectedCourse);
                    if (gameData.scores) setScores(gameData.scores);
                    if (gameData.tensSelections) setTensSelections(gameData.tensSelections);
                    if (gameData.gameId) {
                        setGameId(gameData.gameId);
                        GameSync.setGameIdInURL(gameData.gameId);
                    }
                };
                
                // Create new multiplayer game
                const createNewGame = async () => {
                    try {
                        setLoading(true);
                        
                        const gameData = {
                            step,
                            players,
                            playTens,
                            playSkins,
                            skinsMode,
                            playWolf,
                            wolfSelections,
                            selectedCourse,
                            scores,
                            tensSelections
                        };
                        
                        const newGameId = await GameSync.createGame(gameData);
                        setGameId(newGameId);
                        setIsHost(true);
                        GameSync.setHost(true);
                        GameSync.setGameIdInURL(newGameId);
                        
                        // Start syncing
                        GameSync.startSync(newGameId, handleGameUpdate);
                        setConnectionStatus('connected');
                        
                    } catch (error) {
                        console.error('Failed to create game:', error);
                        setConnectionStatus('error');
                    } finally {
                        setLoading(false);
                    }
                };
                
                // Join existing game
                const handleJoinGame = async (targetGameId) => {
                    try {
                        setLoading(true);
                        const gameData = await GameSync.joinGame(targetGameId);
                        
                        setGameId(targetGameId);
                        setIsHost(false);
                        GameSync.setHost(false);
                        GameSync.setGameIdInURL(targetGameId);
                        
                        // Load the game state
                        loadGameState(gameData);
                        
                        // Start syncing
                        GameSync.startSync(targetGameId, handleGameUpdate);
                        setConnectionStatus('connected');
                        setShowJoinGame(false);
                        
                    } catch (error) {
                        console.error('Failed to join game:', error);
                        setConnectionStatus('error');
                        alert('Failed to join game. Please check the game ID and try again.');
                    } finally {
                        setLoading(false);
                    }
                };
                
                // Debounced update functions to avoid too many database writes
                const debouncedUpdateScores = GolfUtils.debounce(
                    (newScores) => GameSync.updateScores(newScores), 
                    500
                );
                
                const debouncedUpdateTens = GolfUtils.debounce(
                    (newTensSelections) => GameSync.updateTensSelections(newTensSelections), 
                    300
                );
                
                // Update game state (immediate for important changes)
                const updateGameState = async (updates) => {
                    if (gameId) {
                        try {
                            await GameSync.updateGame(updates);
                        } catch (error) {
                            console.error('Failed to sync game state:', error);
                            setConnectionStatus('error');
                        }
                    }
                };
                
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
                const selectCourse = async (course) => {
                    setSelectedCourse(course);
                    
                    const initialScores = {};
                    const initialTensSelections = {};
                    const initialWolfSelections = {};
                    
                    players.forEach((player, playerIndex) => {
                        initialScores[playerIndex] = {};
                        initialTensSelections[playerIndex] = {};
                        course.holes.forEach(hole => {
                            initialScores[playerIndex][hole.hole] = '';
                            initialTensSelections[playerIndex][hole.hole] = false;
                        });
                    });
                    
                    // Initialize wolf selections for each hole
                    course.holes.forEach(hole => {
                        initialWolfSelections[hole.hole] = null;
                    });
                    
                    setScores(initialScores);
                    setTensSelections(initialTensSelections);
                    setWolfSelections(initialWolfSelections);
                    setStep('scorecard');
                    
                    // Update multiplayer game if connected
                    if (gameId) {
                        await updateGameState({
                            selectedCourse: course,
                            scores: initialScores,
                            tensSelections: initialTensSelections,
                            wolfSelections: initialWolfSelections,
                            step: 'scorecard'
                        });
                    }
                };
                
                // Update player score
                const updateScore = (playerIndex, hole, score) => {
                    const newScores = {
                        ...scores,
                        [playerIndex]: {
                            ...scores[playerIndex],
                            [hole]: score
                        }
                    };
                    setScores(newScores);
                    
                    // Sync to multiplayer game
                    if (gameId) {
                        debouncedUpdateScores(newScores);
                    }
                };
                
                // Toggle tens selection
                const toggleTensSelection = (playerIndex, hole) => {
                    const currentSelections = tensSelections[playerIndex] || {};
                    
                    if (!GolfScoring.canSelectForTens(currentSelections, hole)) {
                        return;
                    }
                    
                    const newTensSelections = {
                        ...tensSelections,
                        [playerIndex]: {
                            ...tensSelections[playerIndex],
                            [hole]: !tensSelections[playerIndex][hole]
                        }
                    };
                    setTensSelections(newTensSelections);
                    
                    //