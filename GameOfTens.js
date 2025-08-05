// Game of Tens Component
window.GameOfTens = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function GameOfTens({ players, course, scores, tensSelections }) {
        
        const calculatePlayerTensData = (playerIndex) => {
            const playerScores = scores[playerIndex] || {};
            const playerTensSelections = tensSelections[playerIndex] || {};
            const player = players[playerIndex];
            
            return GolfScoring.calculateTensScore(
                playerScores, 
                playerTensSelections, 
                course, 
                player.handicap
            );
        };
        
        const getLeaderboardPosition = (playerIndex) => {
            const allTensData = players.map((_, index) => ({
                playerIndex: index,
                ...calculatePlayerTensData(index)
            }));
            
            // Sort by net score (lower is better)
            allTensData.sort((a, b) => {
                // First, sort by number of holes selected (must have 10)
                if (a.selectedHoles !== b.selectedHoles) {
                    return b.selectedHoles - a.selectedHoles;
                }
                // Then by net score
                return a.netScore - b.netScore;
            });
            
            const position = allTensData.findIndex(data => data.playerIndex === playerIndex);
            return position + 1;
        };
        
        const getPositionColor = (position) => {
            switch (position) {
                case 1: return '#d97706'; // Gold
                case 2: return '#6b7280'; // Silver
                case 3: return '#92400e'; // Bronze
                default: return '#4b5563'; // Gray
            }
        };
        
        const getPositionEmoji = (position) => {
            switch (position) {
                case 1: return '🥇';
                case 2: return '🥈';
                case 3: return '🥉';
                default: return `#${position}`;
            }
        };
        
        const renderPlayerCard = (player, playerIndex) => {
            const tensData = calculatePlayerTensData(playerIndex);
            const overUnder = tensData.netScore - tensData.parTotal;
            const position = getLeaderboardPosition(playerIndex);
            const isComplete = tensData.selectedHoles === 10;
            
            return e('div', { 
                key: playerIndex, 
                className: 'card',
                style: { 
                    border: `2px solid ${isComplete ? '#a855f7' : '#e5e7eb'}`,
                    opacity: isComplete ? 1 : 0.7
                }
            },
                // Player header with position
                e('div', { className: 'flex-between mb-3' },
                    e('h3', { className: 'font-bold text-lg' }, 
                        GolfUtils.formatPlayerName(player.name, playerIndex)
                    ),
                    isComplete && e('div', { 
                        style: { 
                            fontSize: '24px', 
                            color: getPositionColor(position) 
                        } 
                    }, getPositionEmoji(position))
                ),
                
                // Stats grid
                e('div', { className: 'grid gap-2 text-sm' },
                    e('div', { className: 'flex-between' },
                        e('span', null, 'Holes Selected:'),
                        e('span', { 
                            className: 'font-bold',
                            style: { 
                                color: tensData.selectedHoles === 10 ? '#059669' : '#dc2626' 
                            }
                        }, `${tensData.selectedHoles}/10`)
                    ),
                    
                    tensData.selectedHoles > 0 && e('div', { className: 'flex-between' },
                        e('span', null, 'Gross Score:'),
                        e('span', { className: 'font-bold' }, 
                            course.holes.reduce((total, hole) => {
                                if (tensSelections[playerIndex]?.[hole.hole]) {
                                    const score = parseInt(scores[playerIndex]?.[hole.hole]);
                                    return total + (score || 0);
                                }
                                return total;
                            }, 0) || 0
                        )
                    ),
                    
                    tensData.selectedHoles > 0 && e('div', { className: 'flex-between' },
                        e('span', null, 'Net Score:'),
                        e('span', { className: 'font-bold' }, tensData.netScore || 0)
                    ),
                    
                    tensData.selectedHoles > 0 && e('div', { className: 'flex-between' },
                        e('span', null, 'Par Total:'),
                        e('span', { className: 'font-bold' }, tensData.parTotal || 0)
                    ),
                    
                    tensData.selectedHoles === 0 && e('div', { 
                        className: 'flex-between',
                        style: { 
                            borderTop: '1px solid #e5e7eb', 
                            paddingTop: '8px', 
                            marginTop: '8px' 
                        }
                    },
                        e('span', { className: 'font-medium' }, 'vs Par:'),
                        e('span', { 
                            className: 'font-bold',
                            style: { 
                                color: overUnder > 0 ? '#dc2626' : overUnder < 0 ? '#059669' : '#6b7280',
                                fontSize: '18px'
                            }
                        }, GolfScoring.formatToPar(tensData.netScore, tensData.parTotal))
                    )
                ),
                
                // Progress indicator
                !isComplete && e('div', { className: 'mt-3' },
                    e('div', { className: 'text-xs text-gray-500 mb-1' }, 
                        `Select ${10 - tensData.selectedHoles} more hole${10 - tensData.selectedHoles !== 1 ? 's' : ''}`
                    ),
                    e('div', { 
                        style: { 
                            width: '100%', 
                            height: '4px', 
                            background: '#e5e7eb', 
                            borderRadius: '2px',
                            overflow: 'hidden'
                        } 
                    },
                        e('div', { 
                            style: { 
                                width: `${(tensData.selectedHoles / 10) * 100}%`, 
                                height: '100%', 
                                background: '#a855f7',
                                transition: 'width 0.3s ease'
                            } 
                        })
                    )
                )
            );
        };
        
        const renderSelectedHolesList = (playerIndex) => {
            const selectedHoles = course.holes.filter(hole => 
                tensSelections[playerIndex]?.[hole.hole]
            ).sort((a, b) => a.hole - b.hole);
            
            if (selectedHoles.length === 0) return null;
            
            return e('div', { className: 'mt-3' },
                e('div', { className: 'text-xs font-medium text-gray-700 mb-2' }, 
                    'Selected Holes:'
                ),
                e('div', { className: 'flex flex-wrap gap-1' },
                    selectedHoles.map(hole => {
                        const score = parseInt(scores[playerIndex]?.[hole.hole]);
                        const strokes = GolfScoring.getStrokesForHole(players[playerIndex].handicap, hole.handicap);
                        const netScore = score && score > 0 ? score - strokes : null;
                        
                        return e('div', { 
                            key: hole.hole,
                            style: { 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                background: '#f3e8ff', 
                                border: '1px solid #a855f7',
                                borderRadius: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '32px'
                            } 
                        },
                            e('div', { style: { fontWeight: 'bold' } }, hole.hole),
                            score && e('div', { style: { color: '#6b7280' } }, 
                                netScore !== null ? `${score}(${netScore > 0 ? '+' : ''}${netScore - hole.par})` : score
                            )
                        );
                    })
                )
            );
        };
        
        // Calculate overall leaderboard
        const getOverallLeaderboard = () => {
            return players.map((player, index) => ({
                player,
                playerIndex: index,
                ...calculatePlayerTensData(index)
            }))
            .filter(data => data.selectedHoles === 10) // Only complete tens
            .sort((a, b) => a.netScore - b.netScore); // Sort by net score
        };
        
        const leaderboard = getOverallLeaderboard();
        const hasCompleteRounds = leaderboard.length > 0;
        
        return e('div', { 
            className: 'card', 
            style: { background: '#f3e8ff' } 
        },
            e('h2', { className: 'text-2xl font-bold text-center mb-6' }, 
                '🏆 Game of Tens Leaderboard'
            ),
            
            // Player cards
            e('div', { className: 'grid grid-4 gap-4 mb-6' },
                players.map((player, index) => 
                    e('div', { key: index },
                        renderPlayerCard(player, index),
                        renderSelectedHolesList(index)
                    )
                )
            ),
            
            // Overall leaderboard for completed rounds
            hasCompleteRounds && e('div', { className: 'card mb-4' },
                e('h3', { className: 'font-bold text-lg mb-4 text-center' }, 
                    '🏅 Final Leaderboard'
                ),
                e('div', { className: 'space-y-2' },
                    leaderboard.map((data, index) => {
                        const overUnder = data.netScore - data.parTotal;
                        return e('div', { 
                            key: data.playerIndex,
                            className: 'flex-between p-3 rounded',
                            style: { 
                                background: index === 0 ? '#fef3c7' : '#f9fafb',
                                border: index === 0 ? '2px solid #d97706' : '1px solid #e5e7eb'
                            }
                        },
                            e('div', { className: 'flex gap-3' },
                                e('span', { 
                                    style: { 
                                        fontSize: '18px',
                                        color: getPositionColor(index + 1)
                                    } 
                                }, getPositionEmoji(index + 1)),
                                e('span', { className: 'font-semibold' }, 
                                    GolfUtils.formatPlayerName(data.player.name, data.playerIndex)
                                )
                            ),
                            e('div', { className: 'text-right' },
                                e('div', { className: 'font-bold' }, 
                                    GolfScoring.formatToPar(data.netScore, data.parTotal)
                                ),
                                e('div', { className: 'text-sm text-gray-600' }, 
                                    `${data.netScore} net`
                                )
                            )
                        );
                    })
                )
            ),
            
            // Instructions
            e('div', { className: 'text-center text-sm text-gray-600' },
                hasCompleteRounds ? 
                    'Congratulations to all players! Game of Tens complete.' :
                    'Select your best 10 holes by clicking the "Tens" button below each score. Only completed tens (10/10 holes) will appear in the final leaderboard.'
            )
        );
    };
})();
