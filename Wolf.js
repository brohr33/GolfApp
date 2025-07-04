// Wolf Game Component
window.Wolf = (function() {
    'use strict';
    
    const { createElement: e, useState } = React;
    
    return function Wolf({ players, course, scores, wolfSelections, onUpdateWolfSelection }) {
        
        // Calculate who is the Wolf for each hole (simple rotation, no dependencies)
        const getWolfForHole = (holeNumber) => {
            const adjustedHole = holeNumber - 1; // Convert to 0-based index
            // Normal rotation: each player is Wolf once every 4 holes
            return adjustedHole % players.length;
        };
        
        // Calculate points for a specific player
        const calculatePlayerPoints = (playerIndex) => {
            let totalPoints = 0;
            
            course.holes.forEach(hole => {
                const holeResult = calculateHoleResult(hole.hole);
                if (holeResult && holeResult.points && holeResult.points[playerIndex]) {
                    totalPoints += holeResult.points[playerIndex];
                }
            });
            
            return totalPoints;
        };
        
        // Calculate current point standings
        const calculateCurrentStandings = () => {
            const standings = players.map((player, index) => ({
                player,
                playerIndex: index,
                points: calculatePlayerPoints(index)
            }));
            
            return standings.sort((a, b) => b.points - a.points);
        };
        
        // Get Wolf for holes 17-18 (last place player) - separate function to avoid circular dependency
        const getWolfForLateHoles = (holeNumber) => {
            if (holeNumber >= 17) {
                const standings = calculateCurrentStandings();
                if (standings.length > 0) {
                    const lastPlacePlayer = standings[standings.length - 1];
                    return lastPlacePlayer.playerIndex;
                }
            }
            return getWolfForHole(holeNumber);
        };
        
        // Calculate the result for a specific hole
        const calculateHoleResult = (holeNumber) => {
            // Use simple rotation for Wolf determination to avoid circular dependency
            const wolfIndex = getWolfForHole(holeNumber);
            const wolfSelection = wolfSelections[holeNumber];
            
            if (!wolfSelection) {
                return null; // No selection made yet
            }
            
            // Get net scores for all players
            const netScores = players.map((player, index) => {
                const score = parseInt(scores[index]?.[holeNumber]);
                if (!score || score <= 0) return null;
                
                const hole = course.holes.find(h => h.hole === holeNumber);
                const strokes = GolfScoring.getStrokesForHole(player.handicap, hole.handicap);
                return score - strokes;
            });
            
            // Check if we have enough scores to determine winner
            const validScores = netScores.filter(score => score !== null);
            if (validScores.length < 2) {
                return null;
            }
            
            const wolfNetScore = netScores[wolfIndex];
            if (wolfNetScore === null) {
                return null;
            }
            
            const points = {};
            players.forEach((_, index) => {
                points[index] = 0;
            });
            
            if (wolfSelection.mode === 'lone') {
                // Lone Wolf mode - Wolf vs everyone else
                const otherScores = netScores.filter((score, index) => 
                    index !== wolfIndex && score !== null
                );
                const bestOtherScore = Math.min(...otherScores);
                
                if (wolfNetScore < bestOtherScore) {
                    // Wolf wins alone
                    points[wolfIndex] = wolfSelection.isBlind ? 6 : 4; // Blind Wolf gets more points
                } else {
                    // Others win
                    players.forEach((_, index) => {
                        if (index !== wolfIndex && netScores[index] !== null) {
                            points[index] = 1;
                        }
                    });
                }
            } else if (wolfSelection.partnerIndex !== null) {
                // Wolf has a partner
                const partnerIndex = wolfSelection.partnerIndex;
                const partnerNetScore = netScores[partnerIndex];
                
                if (partnerNetScore === null) {
                    return null;
                }
                
                // Best score of Wolf team
                const wolfTeamScore = Math.min(wolfNetScore, partnerNetScore);
                
                // Best score of other team
                const otherTeamScores = netScores.filter((score, index) => 
                    index !== wolfIndex && index !== partnerIndex && score !== null
                );
                
                if (otherTeamScores.length === 0) {
                    return null;
                }
                
                const otherTeamScore = Math.min(...otherTeamScores);
                
                if (wolfTeamScore < otherTeamScore) {
                    // Wolf team wins
                    points[wolfIndex] = 2;
                    points[partnerIndex] = 2;
                } else {
                    // Other team wins
                    players.forEach((_, index) => {
                        if (index !== wolfIndex && index !== partnerIndex && netScores[index] !== null) {
                            points[index] = 3;
                        }
                    });
                }
            }
            
            return {
                wolfIndex,
                wolfSelection,
                netScores,
                points
            };
        };
        
        // Enhanced function to get detailed hole result for display
        const getDetailedHoleResult = (holeNumber) => {
            const result = calculateHoleResult(holeNumber);
            if (!result) return null;
            
            const { wolfIndex, wolfSelection, netScores, points } = result;
            const hole = course.holes.find(h => h.hole === holeNumber);
            
            // Get gross scores
            const grossScores = players.map((player, index) => {
                const score = parseInt(scores[index]?.[holeNumber]);
                return score && score > 0 ? score : null;
            });
            
            // Build detailed result
            const detail = {
                wolfIndex,
                wolfSelection,
                points,
                scores: players.map((player, index) => ({
                    playerIndex: index,
                    playerName: GolfUtils.formatPlayerName(player.name, index),
                    grossScore: grossScores[index],
                    netScore: netScores[index],
                    strokes: grossScores[index] ? GolfScoring.getStrokesForHole(player.handicap, hole.handicap) : 0,
                    pointsEarned: points[index] || 0
                }))
            };
            
            // Determine team compositions and winners
            if (wolfSelection.mode === 'lone') {
                const wolfData = detail.scores[wolfIndex];
                const otherPlayers = detail.scores.filter((_, index) => index !== wolfIndex);
                const bestOtherNet = Math.min(...otherPlayers.filter(p => p.netScore !== null).map(p => p.netScore));
                
                detail.teamInfo = {
                    type: wolfSelection.isBlind ? 'blind' : 'lone',
                    wolfTeam: [wolfData],
                    otherTeam: otherPlayers.filter(p => p.netScore !== null),
                    wolfWon: wolfData.netScore < bestOtherNet,
                    winningScore: wolfData.netScore < bestOtherNet ? wolfData.netScore : bestOtherNet
                };
            } else {
                const wolfData = detail.scores[wolfIndex];
                const partnerData = detail.scores[wolfSelection.partnerIndex];
                const otherPlayers = detail.scores.filter((_, index) => 
                    index !== wolfIndex && index !== wolfSelection.partnerIndex && detail.scores[index].netScore !== null
                );
                
                const wolfTeamBest = Math.min(wolfData.netScore, partnerData.netScore);
                const otherTeamBest = otherPlayers.length > 0 ? Math.min(...otherPlayers.map(p => p.netScore)) : Infinity;
                
                detail.teamInfo = {
                    type: 'partner',
                    wolfTeam: [wolfData, partnerData],
                    otherTeam: otherPlayers,
                    wolfWon: wolfTeamBest < otherTeamBest,
                    winningScore: wolfTeamBest < otherTeamBest ? wolfTeamBest : otherTeamBest,
                    wolfTeamBest,
                    otherTeamBest: otherPlayers.length > 0 ? otherTeamBest : null
                };
            }
            
            return detail;
        };
        
        // Render hole selection interface
        const renderHoleSelection = (hole) => {
            // Use the late holes function for display purposes (holes 17-18)
            const wolfIndex = hole.hole >= 17 ? getWolfForLateHoles(hole.hole) : getWolfForHole(hole.hole);
            const wolfSelection = wolfSelections[hole.hole] || {};
            const holeResult = calculateHoleResult(hole.hole);
            
            // Check if all players have scores for this hole
            const hasAllScores = players.every((_, index) => {
                const score = parseInt(scores[index]?.[hole.hole]);
                return score && score > 0;
            });
            
            if (!hasAllScores) {
                return e('div', { 
                    style: { 
                        padding: '8px 12px', 
                        background: '#f3f4f6', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#6b7280'
                    } 
                }, 'Waiting for scores...');
            }
            
            const wolfName = GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex);
            
            return e('div', { className: 'wolf-hole-selection' },
                e('div', { 
                    style: { 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        color: '#ea580c'
                    } 
                }, `Wolf: ${wolfName}`),
                
                // Selection buttons
                !wolfSelection.mode && e('div', { className: 'grid gap-2' },
                    // Partner selection buttons
                    e('div', { 
                        style: { 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            marginBottom: '4px' 
                        } 
                    }, 'Choose Partner:'),
                    players.map((player, index) => {
                        if (index === wolfIndex) return null;
                        const playerName = GolfUtils.formatPlayerName(player.name, index);
                        return e('button', {
                            key: index,
                            onClick: () => onUpdateWolfSelection(hole.hole, {
                                mode: 'partner',
                                partnerIndex: index,
                                isBlind: false
                            }),
                            className: 'btn btn-secondary',
                            style: { 
                                padding: '4px 8px', 
                                fontSize: '11px',
                                background: '#fed7aa',
                                color: '#ea580c',
                                border: '1px solid #ea580c'
                            }
                        }, `Partner: ${playerName}`);
                    }),
                    
                    // Lone Wolf options
                    e('div', { 
                        style: { 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            margin: '8px 0 4px 0' 
                        } 
                    }, 'Or Go Alone:'),
                    e('button', {
                        onClick: () => onUpdateWolfSelection(hole.hole, {
                            mode: 'lone',
                            partnerIndex: null,
                            isBlind: false
                        }),
                        className: 'btn',
                        style: { 
                            padding: '4px 8px', 
                            fontSize: '11px',
                            background: '#dc2626'
                        }
                    }, '🐺 Lone Wolf (4 pts)'),
                    e('button', {
                        onClick: () => onUpdateWolfSelection(hole.hole, {
                            mode: 'lone',
                            partnerIndex: null,
                            isBlind: true
                        }),
                        className: 'btn',
                        style: { 
                            padding: '4px 8px', 
                            fontSize: '11px',
                            background: '#7c2d12'
                        }
                    }, '🌙 Blind Wolf (6 pts)')
                ),
                
                // Show selection result
                wolfSelection.mode && e('div', { 
                    style: { 
                        background: wolfSelection.mode === 'lone' ? '#fee2e2' : '#ecfdf5',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '12px'
                    }
                },
                    wolfSelection.mode === 'lone' ? 
                        e('div', null,
                            e('strong', null, wolfSelection.isBlind ? 'Blind Wolf! 🌙' : 'Lone Wolf! 🐺'),
                            e('div', { style: { marginTop: '4px' } }, 
                                `${wolfName} vs Everyone (${wolfSelection.isBlind ? '6' : '4'} pts)`
                            )
                        ) :
                        e('div', null,
                            e('strong', null, 'Partnership! 🤝'),
                            e('div', { style: { marginTop: '4px' } }, 
                                `${wolfName} + ${GolfUtils.formatPlayerName(
                                    players[wolfSelection.partnerIndex].name, 
                                    wolfSelection.partnerIndex
                                )} (2 pts each)`
                            )
                        ),
                    
                    // Show result if hole is complete
                    holeResult && e('div', { 
                        style: { 
                            marginTop: '8px', 
                            paddingTop: '8px', 
                            borderTop: '1px solid #e5e7eb',
                            fontWeight: 'bold'
                        } 
                    },
                        Object.entries(holeResult.points).map(([playerIndex, points]) => {
                            if (points === 0) return null;
                            const playerName = GolfUtils.formatPlayerName(
                                players[parseInt(playerIndex)].name, 
                                parseInt(playerIndex)
                            );
                            return e('div', { key: playerIndex }, 
                                `${playerName}: +${points} pts`
                            );
                        }).filter(Boolean)
                    ),
                    
                    // Reset button
                    e('button', {
                        onClick: () => onUpdateWolfSelection(hole.hole, null),
                        style: { 
                            marginTop: '8px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }
                    }, 'Reset')
                )
            );
        };
        
        // Enhanced result display with score details
        const renderDetailedResult = (holeNumber) => {
            const detail = getDetailedHoleResult(holeNumber);
            if (!detail) return '—';
            
            const { teamInfo, scores } = detail;
            
            // Helper function to find who contributed the best score
            const getBestScoreInfo = (teamPlayers, bestScore) => {
                const bestPlayer = teamPlayers.find(p => p.netScore === bestScore);
                if (!bestPlayer) return `Best: ${bestScore}`;
                
                if (bestPlayer.strokes > 0) {
                    return `Best: ${bestPlayer.playerName} ${bestPlayer.grossScore} (${bestScore})`;
                } else {
                    return `Best: ${bestPlayer.playerName} (${bestScore})`;
                }
            };
            
            return e('div', { style: { fontSize: '11px' } },
                // Team composition and scores
                teamInfo.type === 'lone' || teamInfo.type === 'blind' ? 
                    e('div', null,
                        e('div', { 
                            style: { 
                                fontWeight: 'bold', 
                                color: teamInfo.wolfWon ? '#059669' : '#dc2626',
                                marginBottom: '4px'
                            } 
                        }, 
                            teamInfo.wolfWon ? 
                                `🐺 ${teamInfo.wolfTeam[0].playerName} wins!` : 
                                '👥 Others win!'
                        ),
                        // Wolf best score
                        e('div', { style: { marginBottom: '2px' } },
                            `🐺 Wolf: ${getBestScoreInfo(teamInfo.wolfTeam, teamInfo.wolfTeam[0].netScore)}`
                        ),
                        // Others best score
                        e('div', { style: { marginBottom: '4px' } },
                            `👥 Others: ${getBestScoreInfo(teamInfo.otherTeam, Math.min(...teamInfo.otherTeam.map(p => p.netScore)))}`
                        ),
                        // Points awarded
                        e('div', { 
                            style: { 
                                paddingTop: '4px', 
                                borderTop: '1px solid #e5e7eb',
                                fontWeight: 'bold'
                            } 
                        },
                            scores.filter(s => s.pointsEarned > 0).map(player =>
                                e('div', { key: player.playerIndex },
                                    `${player.playerName}: +${player.pointsEarned} pts`
                                )
                            )
                        )
                    ) :
                    // Partner mode
                    e('div', null,
                        e('div', { 
                            style: { 
                                fontWeight: 'bold', 
                                color: teamInfo.wolfWon ? '#059669' : '#dc2626',
                                marginBottom: '4px'
                            } 
                        }, 
                            teamInfo.wolfWon ? 
                                '🐺🤝 Wolf team wins!' : 
                                '👥 Other team wins!'
                        ),
                        // Wolf team best score
                        e('div', { style: { marginBottom: '2px' } },
                            `🐺 Wolf Team: ${getBestScoreInfo(teamInfo.wolfTeam, teamInfo.wolfTeamBest)}`
                        ),
                        // Other team best score
                        teamInfo.otherTeam.length > 0 && e('div', { style: { marginBottom: '4px' } },
                            `👥 Other Team: ${getBestScoreInfo(teamInfo.otherTeam, teamInfo.otherTeamBest)}`
                        ),
                        // Points awarded
                        e('div', { 
                            style: { 
                                paddingTop: '4px', 
                                borderTop: '1px solid #e5e7eb',
                                fontWeight: 'bold'
                            } 
                        },
                            scores.filter(s => s.pointsEarned > 0).map(player =>
                                e('div', { key: player.playerIndex },
                                    `${player.playerName}: +${player.pointsEarned} pts`
                                )
                            )
                        )
                    )
            );
        };
        
        // Render leaderboard
        const standings = calculateCurrentStandings();
        
        return e('div', { className: 'card', style: { background: '#fef3c7', border: '2px solid #f59e0b' } },
            e('h2', { className: 'text-2xl font-bold text-center mb-4' }, 
                '🐺 Wolf Game Results'
            ),
            
            // Current leaderboard
            e('div', { className: 'grid grid-4 gap-4 mb-6' },
                standings.map((data, position) => 
                    e('div', { 
                        key: data.playerIndex,
                        className: 'card',
                        style: { 
                            border: position === 0 && data.points > 0 ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                            background: position === 0 && data.points > 0 ? '#fef3c7' : 'white'
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
                                    color: data.points > 0 ? '#f59e0b' : '#6b7280'
                                } 
                            }, data.points),
                            e('div', { className: 'text-sm text-gray-600' }, 
                                `point${data.points !== 1 ? 's' : ''}`
                            ),
                            position === 0 && data.points > 0 && e('div', { 
                                style: { 
                                    marginTop: '8px', 
                                    fontSize: '24px' 
                                } 
                            }, '👑')
                        )
                    )
                )
            ),
            
            // Hole-by-hole selection interface
            e('div', { className: 'table-container' },
                e('table', null,
                    e('thead', null,
                        e('tr', null,
                            e('th', { style: { textAlign: 'left' } }, 'Hole'),
                            e('th', null, 'Par'),
                            e('th', null, 'Wolf Selection'),
                            e('th', { style: { minWidth: '200px' } }, 'Detailed Results')
                        )
                    ),
                    e('tbody', null,
                        course.holes.map(hole => 
                            e('tr', { 
                                key: hole.hole,
                                style: { background: hole.hole % 2 === 0 ? '#f9fafb' : 'white' }
                            },
                                e('td', { style: { fontWeight: 'bold' } }, hole.hole),
                                e('td', null, hole.par),
                                e('td', null, renderHoleSelection(hole)),
                                e('td', { style: { maxWidth: '250px' } }, renderDetailedResult(hole.hole))
                            )
                        )
                    )
                )
            ),
            
            // Game explanation
            e('div', { className: 'card mt-4', style: { background: '#f9fafb' } },
                e('h3', { className: 'font-semibold mb-3' }, '🐺 Wolf Game Rules'),
                e('div', { className: 'grid grid-4 gap-4 text-sm' },
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Wolf Rotation'),
                        e('div', { className: 'text-gray-600' }, 'Each player takes turns being the Wolf (holes 17-18: last place player)')
                    ),
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Partner Choice'),
                        e('div', { className: 'text-gray-600' }, 'Wolf chooses a partner for 2v2 (2 pts each if win)')
                    ),
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Lone Wolf'),
                        e('div', { className: 'text-gray-600' }, 'Wolf plays alone vs everyone (4 pts if win, 1 pt each to others if lose)')
                    ),
                    e('div', null,
                        e('div', { className: 'font-medium mb-1' }, 'Blind Wolf'),
                        e('div', { className: 'text-gray-600' }, 'Declare Lone Wolf before seeing any shots (6 pts if win)')
                    )
                )
            )
        );
    };
})();