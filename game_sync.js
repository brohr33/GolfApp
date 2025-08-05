// Real-time Game Synchronization
window.GameSync = (function() {
    'use strict';
    
    let currentGameId = null;
    let gameRef = null;
    let listeners = new Map();
    let isHost = false;
    let localPlayerId = null;
    
    // Generate unique game ID
    const generateGameId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };
    
    // Generate unique player ID for this browser session
    const generatePlayerId = () => {
        let playerId = GolfUtils.loadFromStorage('player-id');
        if (!playerId) {
            playerId = Math.random().toString(36).substring(2, 10);
            GolfUtils.saveToStorage('player-id', playerId);
        }
        return playerId;
    };
    
    // Get game ID from URL
    const getGameIdFromURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('game') || window.location.hash.substring(1);
    };
    
    // Set game ID in URL
    const setGameIdInURL = (gameId) => {
        const newUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        window.history.replaceState({}, '', newUrl);
    };
    
    // Create a new game
    const createGame = async (gameData) => {
        if (FirebaseConfig.isDemoMode()) {
            // Demo mode - use localStorage simulation
            const gameId = generateGameId();
            GolfUtils.saveToStorage(`game-${gameId}`, {
                ...gameData,
                gameId,
                created: Date.now(),
                lastUpdated: Date.now(),
                host: localPlayerId,
                participants: { [localPlayerId]: { joinedAt: Date.now() } }
            });
            return gameId;
        }
        
        try {
            const gameId = generateGameId();
            const database = FirebaseConfig.getDatabase();
            
            const newGameData = {
                ...gameData,
                gameId,
                created: Date.now(),
                lastUpdated: Date.now(),
                host: localPlayerId,
                participants: {
                    [localPlayerId]: {
                        joinedAt: Date.now()
                    }
                }
            };
            
            await database.ref(`games/${gameId}`).set(newGameData);
            return gameId;
            
        } catch (error) {
            console.error('Failed to create game:', error);
            throw new Error('Failed to create game. Please try again.');
        }
    };
    
    // Join an existing game
    const joinGame = async (gameId) => {
        if (FirebaseConfig.isDemoMode()) {
            // Demo mode - check localStorage
            const gameData = GolfUtils.loadFromStorage(`game-${gameId}`);
            if (!gameData) {
                throw new Error('Game not found');
            }
            return gameData;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            const snapshot = await database.ref(`games/${gameId}`).once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Game not found');
            }
            
            const gameData = snapshot.val();
            
            // Add this player to participants
            await database.ref(`games/${gameId}/participants/${localPlayerId}`).set({
                joinedAt: Date.now()
            });
            
            return gameData;
            
        } catch (error) {
            console.error('Failed to join game:', error);
            throw new Error('Failed to join game. Please check the game ID.');
        }
    };
    
    // Start syncing a game
    const startSync = (gameId, onUpdate) => {
        currentGameId = gameId;
        localPlayerId = generatePlayerId();
        
        if (FirebaseConfig.isDemoMode()) {
            // Demo mode - simulate with localStorage polling
            const pollInterval = setInterval(() => {
                const gameData = GolfUtils.loadFromStorage(`game-${gameId}`);
                if (gameData) {
                    onUpdate(gameData);
                }
            }, 1000);
            
            listeners.set('demo-poll', () => clearInterval(pollInterval));
            return;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            gameRef = database.ref(`games/${gameId}`);
            
            // Listen for game updates
            const gameListener = gameRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const gameData = snapshot.val();
                    onUpdate(gameData);
                }
            });
            
            listeners.set('game', () => gameRef.off('value', gameListener));
            
            // Update last seen timestamp
            const presenceRef = database.ref(`games/${gameId}/participants/${localPlayerId}/lastSeen`);
            presenceRef.set(Date.now());
            
            // Update presence every 30 seconds
            const presenceInterval = setInterval(() => {
                presenceRef.set(Date.now());
            }, 30000);
            
            listeners.set('presence', () => clearInterval(presenceInterval));
            
        } catch (error) {
            console.error('Failed to start sync:', error);
        }
    };
    
    // Update game data
    const updateGame = async (updates) => {
        if (!currentGameId) return;
        
        if (FirebaseConfig.isDemoMode()) {
            // Demo mode - update localStorage
            const gameData = GolfUtils.loadFromStorage(`game-${currentGameId}`);
            if (gameData) {
                const updatedData = {
                    ...gameData,
                    ...updates,
                    lastUpdated: Date.now(),
                    lastUpdatedBy: localPlayerId
                };
                GolfUtils.saveToStorage(`game-${currentGameId}`, updatedData);
            }
            return;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            const updateData = {
                ...updates,
                lastUpdated: Date.now(),
                lastUpdatedBy: localPlayerId
            };
            
            await database.ref(`games/${currentGameId}`).update(updateData);
            
        } catch (error) {
            console.error('Failed to update game:', error);
            throw new Error('Failed to save changes. Please try again.');
        }
    };
    
    // Update just the scores (more efficient for frequent updates)
    const updateScores = async (scores) => {
        if (!currentGameId) return;
        
        if (FirebaseConfig.isDemoMode()) {
            const gameData = GolfUtils.loadFromStorage(`game-${currentGameId}`);
            if (gameData) {
                gameData.scores = scores;
                gameData.lastUpdated = Date.now();
                gameData.lastUpdatedBy = localPlayerId;
                GolfUtils.saveToStorage(`game-${currentGameId}`, gameData);
            }
            return;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            await database.ref(`games/${currentGameId}/scores`).set(scores);
            await database.ref(`games/${currentGameId}/lastUpdated`).set(Date.now());
            await database.ref(`games/${currentGameId}/lastUpdatedBy`).set(localPlayerId);
            
        } catch (error) {
            console.error('Failed to update scores:', error);
        }
    };
    
    // Update Game of Tens selections
    const updateTensSelections = async (tensSelections) => {
        if (!currentGameId) return;
        
        if (FirebaseConfig.isDemoMode()) {
            const gameData = GolfUtils.loadFromStorage(`game-${currentGameId}`);
            if (gameData) {
                gameData.tensSelections = tensSelections;
                gameData.lastUpdated = Date.now();
                gameData.lastUpdatedBy = localPlayerId;
                GolfUtils.saveToStorage(`game-${currentGameId}`, gameData);
            }
            return;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            await database.ref(`games/${currentGameId}/tensSelections`).set(tensSelections);
            await database.ref(`games/${currentGameId}/lastUpdated`).set(Date.now());
            
        } catch (error) {
            console.error('Failed to update tens selections:', error);
        }
    };
    
    // Update Wolf selections
    const updateWolfSelections = async (wolfSelections) => {
        if (!currentGameId) return;
        
        if (FirebaseConfig.isDemoMode()) {
            const gameData = GolfUtils.loadFromStorage(`game-${currentGameId}`);
            if (gameData) {
                gameData.wolfSelections = wolfSelections;
                gameData.lastUpdated = Date.now();
                gameData.lastUpdatedBy = localPlayerId;
                GolfUtils.saveToStorage(`game-${currentGameId}`, gameData);
            }
            return;
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            await database.ref(`games/${currentGameId}/wolfSelections`).set(wolfSelections);
            await database.ref(`games/${currentGameId}/lastUpdated`).set(Date.now());
            
        } catch (error) {
            console.error('Failed to update wolf selections:', error);
        }
    };
    
    // Get sharing URL
    const getSharingURL = () => {
        if (!currentGameId) return null;
        return `${window.location.origin}${window.location.pathname}?game=${currentGameId}`;
    };
    
    // Stop syncing and cleanup
    const stopSync = () => {
        listeners.forEach(cleanup => cleanup());
        listeners.clear();
        
        if (gameRef) {
            gameRef.off();
            gameRef = null;
        }
        
        currentGameId = null;
        isHost = false;
    };
    
    // Get current participants
    const getParticipants = async () => {
        if (!currentGameId) return [];
        
        if (FirebaseConfig.isDemoMode()) {
            const gameData = GolfUtils.loadFromStorage(`game-${currentGameId}`);
            return gameData?.participants ? Object.keys(gameData.participants) : [];
        }
        
        try {
            const database = FirebaseConfig.getDatabase();
            const snapshot = await database.ref(`games/${currentGameId}/participants`).once('value');
            return snapshot.exists() ? Object.keys(snapshot.val()) : [];
            
        } catch (error) {
            console.error('Failed to get participants:', error);
            return [];
        }
    };
    
    // Check if current user is the host
    const isGameHost = () => {
        return isHost;
    };
    
    // Set host status
    const setHost = (hostStatus) => {
        isHost = hostStatus;
    };
    
    // Get current game ID
    const getCurrentGameId = () => {
        return currentGameId;
    };
    
    // Get current player ID
    const getLocalPlayerId = () => {
        return localPlayerId;
    };
    
    return {
        generateGameId,
        getGameIdFromURL,
        setGameIdInURL,
        createGame,
        joinGame,
        startSync,
        updateGame,
        updateScores,
        updateTensSelections,
        updateWolfSelections,
        getSharingURL,
        stopSync,
        getParticipants,
        isGameHost,
        setHost,
        getCurrentGameId,
        getLocalPlayerId
    };
})();