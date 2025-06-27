// Wolf Game Component
window.Wolf = (function() {
    'use strict';
    
    const { createElement: e, useState } = React;
    
    return function Wolf({ players, course, scores, wolfSelections, onUpdateWolfSelection }) {
        
        // Debug props at the component level
        console.log('Wolf component rendered with props:', {
            players: players?.length,
            course: course?.name,
            scores: scores,
            wolfSelections: wolfSelections,
            onUpdateWolfSelection: typeof onUpdateWolfSelection
        });
        
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
            
            // Wolf Selection Interface (separate from results)
            e('div', { className: 'card mt-4', style: { background: '#f9fafb' } },
                e('h3', { className: 'font-semibold mb-4 text-center' }, '🐺 Wolf Selections'),
                
                e('div', { className: 'grid gap-4' },
                    course.holes.map(hole => {
                        const wolfIndex = hole.hole >= 17 ? getWolfForLateHoles(hole.hole) : getWolfForHole(hole.hole);
                        const wolfSelection = wolfSelections[hole.hole] || {};
                        
                        // Check if ANY players have scores for this hole (simplified check)
                        const playersWithScores = players.filter((_, index) => {
                            const score = parseInt(scores[index]?.[hole.hole]);
                            return score && score > 0;
                        });
                        
                        const hasScores = playersWithScores.length > 0;
                        
                        // Debug info for this specific hole
                        const scoresDebug = players.map((_, index) => {
                            const score = parseInt(scores[index]?.[hole.hole]);
                            return `P${index}:${score || 'X'}`;
                        }).join(', ');
                        
                        console.log(`Hole ${hole.hole} check:`, {
                            playersWithScores: playersWithScores.length,
                            hasScores,
                            scoresDebug,
                            wolfSelection
                        });
                        
                        if (!hasScores) {
                            return null; // Don't show holes without any scores
                        }
                        
                        return e('div', { 
                            key: hole.hole,
                            className: 'card',
                            style: { 
                                border: wolfSelection.mode ? '2px solid #10b981' : '2px solid #f59e0b',
                                background: wolfSelection.mode ? '#ecfdf5' : '#fef3c7'
                            }
                        },
                            e('h4', { 
                                className: 'font-bold mb-2 text-center',
                                style: { color: wolfSelection.mode ? '#059669' : '#ea580c' }
                            }, `Hole ${hole.hole} - Wolf: ${GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex)} ${wolfSelection.mode ? '✅' : '⏳'}`),
                            
                            // Debug info for this hole
                            e('div', { style: { fontSize: '9px', color: '#6b7280', marginBottom: '8px', textAlign: 'center' } },
                                `Scores: ${scoresDebug} | Players with scores: ${playersWithScores.length}/${players.length}`
                            ),
                            
                            // Force show the selection interface regardless of score completeness
                            e('div', { className: 'wolf-hole-selection' },
                                e('div', { 
                                    style: { 
                                        fontWeight: 'bold', 
                                        marginBottom: '8px',
                                        color: '#ea580c'
                                    } 
                                }, `Wolf: ${GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex)}`),
                                
                                // Always show selection options if we have any scores
                                e('div', { className: 'grid gap-2' },
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
                                        const isSelected = wolfSelection.mode === 'partner' && wolfSelection.partnerIndex === index;
                                        
                                        return e('button', {
                                            key: index,
                                            onClick: (evt) => {
                                                evt.preventDefault();
                                                console.log(`Clicked partner button for player ${index} (${playerName}) on hole ${hole.hole}`);
                                                onUpdateWolfSelection(hole.hole, {
                                                    mode: 'partner',
                                                    partnerIndex: index,
                                                    isBlind: false
                                                });
                                            },
                                            className: 'btn btn-secondary',
                                            style: { 
                                                padding: '6px 10px', 
                                                fontSize: '12px',
                                                background: isSelected ? '#059669' : '#fed7aa',
                                                color: isSelected ? 'white' : '#ea580c',
                                                border: `2px solid ${isSelected ? '#059669' : '#ea580c'}`,
                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                cursor: 'pointer',
                                                margin: '2px'
                                            }
                                        }, isSelected ? `✓ ${playerName}` : `Partner: ${playerName}`);
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
                                        onClick: (evt) => {
                                            evt.preventDefault();
                                            console.log(`Clicked Lone Wolf for hole ${hole.hole}`);
                                            onUpdateWolfSelection(hole.hole, {
                                                mode: 'lone',
                                                partnerIndex: null,
                                                isBlind: false
                                            });
                                        },
                                        className: 'btn',
                                        style: { 
                                            padding: '6px 10px', 
                                            fontSize: '12px',
                                            background: wolfSelection.mode === 'lone' && !wolfSelection.isBlind ? '#059669' : '#dc2626',
                                            fontWeight: wolfSelection.mode === 'lone' && !wolfSelection.isBlind ? 'bold' : 'normal',
                                            cursor: 'pointer',
                                            margin: '2px'
                                        }
                                    }, wolfSelection.mode === 'lone' && !wolfSelection.isBlind ? '✓ Lone Wolf (4 pts)' : '🐺 Lone Wolf (4 pts)'),
                                    e('button', {
                                        onClick: (evt) => {
                                            evt.preventDefault();
                                            console.log(`Clicked Blind Wolf for hole ${hole.hole}`);
                                            onUpdateWolfSelection(hole.hole, {
                                                mode: 'lone',
                                                partnerIndex: null,
                                                isBlind: true
                                            });
                                        },
                                        className: 'btn',
                                        style: { 
                                            padding: '6px 10px', 
                                            fontSize: '12px',
                                            background: wolfSelection.mode === 'lone' && wolfSelection.isBlind ? '#059669' : '#7c2d12',
                                            fontWeight: wolfSelection.mode === 'lone' && wolfSelection.isBlind ? 'bold' : 'normal',
                                            cursor: 'pointer',
                                            margin: '2px'
                                        }
                                    }, wolfSelection.mode === 'lone' && wolfSelection.isBlind ? '✓ Blind Wolf (6 pts)' : '🌙 Blind Wolf (6 pts)')
                                ),
                                
                                // Show current selection and reset option
                                wolfSelection.mode && e('div', { 
                                    style: { 
                                        background: '#ecfdf5',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        marginTop: '8px',
                                        border: '1px solid #10b981'
                                    }
                                },
                                    e('div', { style: { fontWeight: 'bold', color: '#059669', marginBottom: '4px' } },
                                        'Current Selection:'
                                    ),
                                    e('div', { style: { marginBottom: '8px' } },
                                        wolfSelection.mode === 'lone' ? 
                                            (wolfSelection.isBlind ? '🌙 Blind Wolf (6 pts)' : '🐺 Lone Wolf (4 pts)') :
                                            `🤝 ${GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex)} + ${GolfUtils.formatPlayerName(
                                                players[wolfSelection.partnerIndex].name, 
                                                wolfSelection.partnerIndex
                                            )} (2 pts each)`
                                    ),
                                    
                                    // Reset button
                                    e('button', {
                                        onClick: (evt) => {
                                            evt.preventDefault();
                                            console.log(`Reset selection for hole ${hole.hole}`);
                                            onUpdateWolfSelection(hole.hole, null);
                                        },
                                        style: { 
                                            marginTop: '8px',
                                            padding: '4px 8px',
                                            fontSize: '10px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }
                                    }, '🔄 Reset Selection')
                                )
                            )
                        );
                    }).filter(Boolean)
                ),
                
                // Show message if no holes have scores yet
                (() => {
                    const holesWithScores = course.holes.filter(hole => {
                        return players.some((_, index) => {
                            const score = parseInt(scores[index]?.[hole.hole]);
                            return score && score > 0;
                        });
                    });
                    
                    if (holesWithScores.length === 0) {
                        return e('div', { 
                            className: 'text-center text-gray-600',
                            style: { padding: '20px' }
                        }, 
                            e('div', { style: { fontSize: '2rem', marginBottom: '8px' } }, '🎯'),
                            'Enter scores for each hole to make Wolf selections!'
                        );
                    }
                    
                    return null;
                })()
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
        
        // Render leaderboard
        const standings = calculateCurrentStandings();
        
        // Add a simple scores summary at the top for debugging
        const totalScoresEntered = Object.keys(scores).reduce((total, playerIndex) => {
            const playerScores = scores[playerIndex] || {};
            return total + Object.keys(playerScores).filter(hole => {
                const score = parseInt(playerScores[hole]);
                return score && score > 0;
            }).length;
        }, 0);
        
        return e('div', { className: 'card', style: { background: '#fef3c7', border: '2px solid #f59e0b' } },
            e('h2', { className: 'text-2xl font-bold text-center mb-4' }, 
                '🐺 Wolf Game Results'
            ),
            
            // Debug info at top
            e('div', { 
                style: { 
                    background: '#fee2e2', 
                    padding: '8px', 
                    marginBottom: '16px', 
                    borderRadius: '6px',
                    fontSize: '12px'
                }
            },
                e('strong', null, 'Debug Info: '),
                `Total scores entered: ${totalScoresEntered} | `,
                `Players: ${players.length} | `,
                `Holes: ${course.holes.length} | `,
                `Wolf selections: ${Object.keys(wolfSelections).length}`
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
            
            // Hole-by-hole results table with detailed explanations
            e('div', { className: 'table-container' },
                e('table', null,
                    e('thead', null,
                        e('tr', null,
                            e('th', { style: { textAlign: 'left' } }, 'Hole'),
                            e('th', null, 'Par'),
                            e('th', null, 'Wolf & Selection'),
                            e('th', null, 'Net Scores'),
                            e('th', null, 'Result & Points')
                        )
                    ),
                    e('tbody', null,
                        course.holes.map(hole => {
                            const wolfIndex = hole.hole >= 17 ? getWolfForLateHoles(hole.hole) : getWolfForHole(hole.hole);
                            const wolfSelection = wolfSelections[hole.hole];
                            const holeResult = calculateHoleResult(hole.hole);
                            
                            return e('tr', { 
                                key: hole.hole,
                                style: { background: hole.hole % 2 === 0 ? '#f9fafb' : 'white' }
                            },
                                // Hole number and par
                                e('td', { style: { fontWeight: 'bold' } }, hole.hole),
                                e('td', null, hole.par),
                                
                                // Wolf and selection details
                                e('td', null,
                                    e('div', { style: { textAlign: 'center' } },
                                        e('div', { 
                                            style: { 
                                                fontWeight: 'bold', 
                                                color: '#ea580c',
                                                marginBottom: '4px'
                                            } 
                                        }, `🐺 ${GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex)}`),
                                        
                                        wolfSelection ? e('div', { 
                                            style: { 
                                                fontSize: '12px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: wolfSelection.mode === 'lone' ? 
                                                    (wolfSelection.isBlind ? '#7c2d12' : '#dc2626') : 
                                                    '#fed7aa',
                                                color: wolfSelection.mode === 'lone' ? 'white' : '#ea580c',
                                                fontWeight: '500'
                                            }
                                        },
                                            wolfSelection.mode === 'lone' ? 
                                                (wolfSelection.isBlind ? '🌙 Blind Wolf' : '🐺 Lone Wolf') :
                                                `🤝 + ${GolfUtils.formatPlayerName(players[wolfSelection.partnerIndex].name, wolfSelection.partnerIndex)}`
                                        ) : e('div', { 
                                            style: { 
                                                fontSize: '11px', 
                                                color: '#6b7280',
                                                fontStyle: 'italic'
                                            } 
                                        }, 'No selection')
                                    )
                                ),
                                
                                // Net scores for all players
                                e('td', null,
                                    (() => {
                                        // Calculate net scores for all players on this hole
                                        const holeData = course.holes.find(h => h.hole === hole.hole);
                                        if (!holeData) return e('div', { style: { fontSize: '11px', color: '#6b7280', fontStyle: 'italic' } }, 'Hole not found');
                                        
                                        const playerNetScores = players.map((player, index) => {
                                            const grossScore = parseInt(scores[index]?.[hole.hole]);
                                            if (!grossScore || grossScore <= 0) {
                                                return { index, name: player.name, grossScore: null, netScore: null };
                                            }
                                            
                                            const strokes = GolfScoring.getStrokesForHole(player.handicap, holeData.handicap);
                                            const netScore = grossScore - strokes;
                                            
                                            return { 
                                                index, 
                                                name: player.name, 
                                                grossScore, 
                                                netScore,
                                                strokes
                                            };
                                        });
                                        
                                        const hasAnyScores = playerNetScores.some(p => p.netScore !== null);
                                        
                                        if (!hasAnyScores) {
                                            return e('div', { style: { fontSize: '11px', color: '#6b7280', fontStyle: 'italic' } }, 'No scores yet');
                                        }
                                        
                                        return e('div', { style: { fontSize: '12px' } },
                                            playerNetScores.map((playerData, index) => {
                                                const isWolf = index === wolfIndex;
                                                const isPartner = wolfSelection && wolfSelection.partnerIndex === index;
                                                
                                                return e('div', { 
                                                    key: index,
                                                    style: { 
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '1px 4px',
                                                        background: isWolf ? '#fef3c7' : isPartner ? '#ecfdf5' : 'transparent',
                                                        borderRadius: '3px',
                                                        marginBottom: '1px'
                                                    }
                                                },
                                                    e('span', { 
                                                        style: { 
                                                            fontSize: '10px',
                                                            fontWeight: isWolf || isPartner ? 'bold' : 'normal'
                                                        } 
                                                    }, 
                                                        `${GolfUtils.formatPlayerName(playerData.name, index)}${isWolf ? ' 🐺' : isPartner ? ' 🤝' : ''}`
                                                    ),
                                                    e('span', { 
                                                        style: { 
                                                            fontWeight: 'bold',
                                                            color: playerData.netScore !== null ? '#374151' : '#9ca3af'
                                                        } 
                                                    }, 
                                                        playerData.netScore !== null ? 
                                                            `${playerData.grossScore}(${playerData.netScore})` : 
                                                            '—'
                                                    )
                                                );
                                            })
                                        );
                                    })()
                                ),
                                
                                // Detailed result explanation
                                e('td', null,
                                    holeResult ? e('div', { style: { fontSize: '12px' } },
                                        (() => {
                                            const points = holeResult.points;
                                            const winners = Object.entries(points).filter(([_, pts]) => pts > 0);
                                            
                                            if (winners.length === 0) {
                                                return e('div', { 
                                                    style: { 
                                                        color: '#6b7280',
                                                        fontStyle: 'italic'
                                                    } 
                                                }, 'No winner');
                                            }
                                            
                                            // Determine what happened and explain it
                                            let explanation = '';
                                            let resultColor = '#059669';
                                            
                                            if (wolfSelection.mode === 'lone') {
                                                const wolfNetScore = holeResult.netScores[wolfIndex];
                                                const otherScores = holeResult.netScores.filter((score, index) => 
                                                    index !== wolfIndex && score !== null
                                                );
                                                const bestOtherScore = Math.min(...otherScores);
                                                
                                                if (wolfNetScore < bestOtherScore) {
                                                    explanation = wolfSelection.isBlind ? 
                                                        `🌙 Blind Wolf wins! ${wolfNetScore} beats ${bestOtherScore}` :
                                                        `🐺 Lone Wolf wins! ${wolfNetScore} beats ${bestOtherScore}`;
                                                } else {
                                                    explanation = `😔 Wolf loses. Others win: ${bestOtherScore} beats ${wolfNetScore}`;
                                                    resultColor = '#dc2626';
                                                }
                                            } else {
                                                // Partnership mode
                                                const wolfNetScore = holeResult.netScores[wolfIndex];
                                                const partnerNetScore = holeResult.netScores[wolfSelection.partnerIndex];
                                                const wolfTeamScore = Math.min(wolfNetScore, partnerNetScore);
                                                
                                                const otherScores = holeResult.netScores.filter((score, index) => 
                                                    index !== wolfIndex && index !== wolfSelection.partnerIndex && score !== null
                                                );
                                                const otherTeamScore = Math.min(...otherScores);
                                                
                                                if (wolfTeamScore < otherTeamScore) {
                                                    explanation = `🤝 Wolf team wins! ${wolfTeamScore} beats ${otherTeamScore}`;
                                                } else {
                                                    explanation = `💪 Others win! ${otherTeamScore} beats ${wolfTeamScore}`;
                                                    resultColor = '#dc2626';
                                                }
                                            }
                                            
                                            return e('div', null,
                                                e('div', { 
                                                    style: { 
                                                        color: resultColor,
                                                        fontWeight: '500',
                                                        marginBottom: '4px'
                                                    } 
                                                }, explanation),
                                                
                                                // Show points awarded
                                                e('div', { style: { fontSize: '11px' } },
                                                    winners.map(([playerIndex, pts]) => {
                                                        const playerName = GolfUtils.formatPlayerName(
                                                            players[parseInt(playerIndex)].name, 
                                                            parseInt(playerIndex)
                                                        );
                                                        return e('div', { 
                                                            key: playerIndex,
                                                            style: { 
                                                                background: '#d1fae5',
                                                                color: '#059669',
                                                                padding: '1px 4px',
                                                                borderRadius: '3px',
                                                                marginBottom: '1px',
                                                                fontWeight: 'bold'
                                                            }
                                                        }, `${playerName}: +${pts} pts`);
                                                    })
                                                )
                                            );
                                        })()
                                    ) : e('div', { 
                                        style: { 
                                            fontSize: '11px', 
                                            color: '#6b7280',
                                            fontStyle: 'italic'
                                        } 
                                    }, 'Awaiting selection')
                                )
                            );
                        })
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