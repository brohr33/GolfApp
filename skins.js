// Skins Game Component
window.Skins = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function Skins({ players, course, scores, skinsMode }) {
        
        // Calculate who wins each hole (or if it's tied)
        const calculateHoleWinner = (hole) => {
            const holeScores = [];
            
            // Get net scores for all players for this hole
            players.forEach((player, playerIndex) => {
                const score = parseInt(scores[playerIndex]?.[hole.hole]);
                if (score && score > 0) {
                    const strokes = GolfScoring.getStrokesForHole(player.handicap, hole.handicap);
                    const netScore = score - strokes;
                    holeScores.push({
                        playerIndex,
                        netScore,
                        grossScore: score
                    });
                }
            });
            
            if (holeScores.length < 2) {
                return { winner: null, tied: false, scores: holeScores };
            }
            
            // Sort by net score (lowest wins)
            holeScores.sort((a, b) => a.netScore - b.netScore);
            
            const lowestScore = holeScores[0].netScore;
            const winners = holeScores.filter(s => s.netScore === lowestScore);
            
            if (winners.length === 1) {
                return { winner: winners[0].playerIndex, tied: false, scores: holeScores };
            } else {
                return { winner: null, tied: true, scores: holeScores };
            }
        };
        
        // Calculate all skins results based on the selected mode
        const calculateSkinsResults = () => {
            const results = {};
            let carryover = 0;
            
            course.holes.forEach(hole => {
                const holeResult = calculateHoleWinner(hole);
                const skinValue = 1 + carryover;
                
                if (holeResult.winner !== null) {
                    // Someone won the skin
                    results[hole.hole] = {
                        winner: holeResult.winner,
                        value: skinValue,
                        tied: false,
                        carryover: carryover,
                        scores: holeResult.scores
                    };
                    carryover = 0;
                } else if (holeResult.tied) {
                    // Tied hole - handle based on mode
                    if (skinsMode === 'push') {
                        results[hole.hole] = {
                            winner: null,
                            value: 0,
                            tied: true,
                            carryover: carryover,
                            scores: holeResult.scores
                        };
                        // Skin value is lost (pushed)
                    } else if (skinsMode === 'carryover') {
                        results[hole.hole] = {
                            winner: null,
                            value: 0,
                            tied: true,
                            carryover: carryover,
                            scores: holeResult.scores
                        };
                        carryover += 1;
                    } else { // null
                        results[hole.hole] = {
                            winner: null,
                            value: 0,
                            tied: true,
                            carryover: carryover,
                            scores: holeResult.scores
                        };
                        // No carryover, just no winner
                    }
                } else {
                    // Not enough players with scores
                    results[hole.hole] = {
                        winner: null,
                        value: 0,
                        tied: false,
                        carryover: carryover,
                        scores: holeResult.scores
                    };
                }
            });
            
            return { results, finalCarryover: carryover };
        };
        
        // Calculate player totals
        const calculatePlayerTotals = (skinsResults) => {
            const totals = {};
            players.forEach((_, playerIndex) => {
                totals[playerIndex] = Object.values(skinsResults.results)
                    .filter(result => result.winner === playerIndex)
                    .reduce((sum, result) => sum + result.value, 0);
            });
            return totals;
        };
        
        // Get skins mode display text
        const getSkinsModeName = () => {
            switch(skinsMode) {
                case 'push': return 'Push (Ties = No Winner)';
                case 'carryover': return 'Carryover (Ties = Next Hole)';
                case 'null': return 'Null (Ties = No Winner, No Carryover)';
                default: return 'Unknown Mode';
            }
        };
        
        const skinsResults = calculateSkinsResults();
        const playerTotals = calculatePlayerTotals(skinsResults);
        
        // Create leaderboard
        const leaderboard = players.map((player, index) => ({
            player,
            playerIndex: index,
            skins: playerTotals[index] || 0
        })).sort((a, b) => b.skins - a.skins);
        
        const renderHoleResult = (hole) => {
            const result = skinsResults.results[hole.hole];
            if (!result) return null;
            
            let statusText = '';
            let statusColor = '#6b7280';
            
            if (result.winner !== null) {
                const winnerName = GolfUtils.formatPlayerName(players[result.winner].name, result.winner);
                statusText = `${winnerName} wins ${result.value} skin${result.value > 1 ? 's' : ''}`;
                statusColor = '#059669';
            } else if (result.tied) {
                if (skinsMode === 'push') {
                    statusText = 'Tied - Pushed';
                    statusColor = '#6b7280';
                } else if (skinsMode === 'carryover') {
                    statusText = 'Tied - Carries over';
                    statusColor = '#d97706';
                } else {
                    statusText = 'Tied - No winner';
                    statusColor = '#6b7280';
                }
            } else {
                statusText = 'No winner';
                statusColor = '#6b7280';
            }
            
            return e('tr', { 
                key: hole.hole,
                style: { background: hole.hole % 2 === 0 ? '#f9fafb' : 'white' }
            },
                e('td', { style: { fontWeight: 'bold', textAlign: 'left' } }, hole.hole),
                e('td', null, hole.par),
                result.scores.map((scoreData, index) => {
                    const player = players[scoreData.playerIndex];
                    const isWinner = result.winner === scoreData.playerIndex;
                    return e('td', { 
                        key: scoreData.playerIndex,
                        style: { 
                            fontWeight: isWinner ? 'bold' : 'normal',
                            color: isWinner ? '#059669' : '#374151'
                        }
                    }, scoreData.netScore);
                }),
                // Fill empty cells for players who didn't score
                Array.from({ length: players.length - result.scores.length }, (_, i) => 
                    e('td', { key: `empty-${i}` }, '—')
                ),
                e('td', { 
                    style: { 
                        fontWeight: 'bold',
                        color: statusColor,
                        fontSize: '12px'
                    }
                }, result.value > 0 ? result.value : '—'),
                e('td', { 
                    style: { 
                        fontSize: '12px',
                        color: statusColor
                    }
                }, statusText)
            );
        };
        
        return e('div', { className: 'skins-card card' },
            e('h2', { className: 'text-2xl font-bold text-center mb-4' }, 
                '🎯 Skins Game Results'
            ),
            
            // Mode indicator
            e('div', { className: 'text-center mb-4 text-sm' },
                e('span', { 
                    style: { 
                        background: '#fed7aa', 
                        color: '#ea580c', 
                        padding: '4px 12px', 
                        borderRadius: '16px',
                        fontWeight: '500'
                    } 
                }, `Mode: ${getSkinsModeName()}`)
            ),
            
            // Leaderboard
            e('div', { className: 'grid grid-4 gap-4 mb-6' },
                leaderboard.map((data, position) => 
                    e('div', { 
                        key: data.playerIndex,
                        className: 'card',
                        style: { 
                            border: position === 0 && data.skins > 0 ? '2px solid #ea580c' : '2px solid #e5e7eb',
                            background: position === 0 && data.skins > 0 ? '#fed7aa' : 'white'
                        }
                    },
                        e('div', { className: 'text-center' },
                            e('h3', { className: 'font-bold text-lg mb-2' }, 
                                GolfUtils.formatPlayerName(data.player.name, data.playerIndex)
                            ),
                            e('div', { 
                                style: { 
                                    fontSize: '2rem', 
                                    fontWeight: 'bold',
                                    color: data.skins > 0 ? '#ea580c' : '#6b7280'
                                } 
                            }, data.skins),
                            e('div', { className: 'text-sm text-gray-600' }, 
                                `skin${data.skins !== 1 ? 's' : ''}`
                            ),
                            position === 0 && data.skins > 0 && e('div', { 
                                style: { 
                                    marginTop: '8px', 
                                    fontSize: '24px' 
                                } 
                            }, '👑')
                        )
                    )
                )
            ),
            
            // Detailed hole-by-hole results
            e('div', { className: 'table-container' },
                e('table', null,
                    e('thead', null,
                        e('tr', null,
                            e('th', { style: { textAlign: 'left' } }, 'Hole'),
                            e('th', null, 'Par'),
                            players.map((player, index) =>
                                e('th', { key: index }, 
                                    GolfUtils.formatPlayerName(player.name, index)
                                )
                            ),
                            e('th', null, 'Value'),
                            e('th', null, 'Result')
                        )
                    ),
                    e('tbody', null,
                        course.holes.map(hole => renderHoleResult(hole))
                    )
                )
            ),
            
            // Final carryover note
            skinsResults.finalCarryover > 0 && e('div', { 
                className: 'status-warning mt-4',
                style: { textAlign: 'center' }
            },
                e('strong', null, 'Note: '),
                `${skinsResults.finalCarryover} skin${skinsResults.finalCarryover > 1 ? 's' : ''} carried over from final holes with no winner.`
            ),
            
            // Game explanation
            e('div', { className: 'card mt-4', style: { background: '#f9fafb' } },
                e('h3', { className: 'font-semibold mb-3' }, '🎯 Skins Game Rules'),
                e('div', { className: 'grid grid-3 gap-4 text-sm' },
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'How to Win'),
                        e('div', { className: 'text-gray-600' }, 'Lowest net score on each hole wins the skin for that hole')
                    ),
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Scoring'),
                        e('div', { className: 'text-gray-600' }, 'Net scores are used (gross score minus handicap strokes)')
                    ),
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Tie Handling'),
                        e('div', { className: 'text-gray-600' }, 
                            skinsMode === 'push' ? 'Tied holes have no winner (skin is lost)' :
                            skinsMode === 'carryover' ? 'Tied holes carry the skin to the next hole' :
                            'Tied holes have no winner and no carryover'
                        )
                    )
                )
            )
        );
    };
})();