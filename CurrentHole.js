// Current Hole Component - Focused single hole entry
window.CurrentHole = (function() {
    'use strict';
    
    const { createElement: e, useState, useEffect } = React;
    
    return function CurrentHole({ 
        course, 
        players, 
        scores, 
        playWolf,
        wolfSelections,
        onUpdateScore, 
        onUpdateWolfSelection 
    }) {
        
        const [currentHoleNumber, setCurrentHoleNumber] = useState(1);
        
        // Auto-advance to next incomplete hole on mount
        useEffect(() => {
            const findNextIncompleteHole = () => {
                for (let holeNum = 1; holeNum <= 18; holeNum++) {
                    const hasAllScores = players.every((_, playerIndex) => {
                        const score = parseInt(scores[playerIndex]?.[holeNum]);
                        return score && score > 0;
                    });
                    if (!hasAllScores) {
                        return holeNum;
                    }
                }
                return 18; // Default to 18 if all complete
            };
            
            setCurrentHoleNumber(findNextIncompleteHole());
        }, [scores, players]);
        
        const currentHole = course.holes.find(h => h.hole === currentHoleNumber);
        
        if (!currentHole) {
            return e('div', { className: 'card text-center' },
                e('h3', { className: 'text-xl font-bold mb-4' }, 'Invalid Hole'),
                e('p', null, 'Could not find hole data.')
            );
        }
        
        // Check if all players have scores for current hole
        const hasAllScores = players.every((_, playerIndex) => {
            const score = parseInt(scores[playerIndex]?.[currentHoleNumber]);
            return score && score > 0;
        });
        
        // Get Wolf for current hole
        const getWolfForHole = (holeNumber) => {
            const adjustedHole = holeNumber - 1;
            return adjustedHole % players.length;
        };
        
        const wolfIndex = playWolf ? getWolfForHole(currentHoleNumber) : null;
        const wolfSelection = playWolf ? (wolfSelections[currentHoleNumber] || {}) : {};
        
        // Advance to next hole (manual only now)
        const advanceToNextHole = () => {
            if (currentHoleNumber < 18) {
                setCurrentHoleNumber(currentHoleNumber + 1);
            }
        };
        
        // Check if we should show the advance button
        const canAdvance = hasAllScores && (!playWolf || wolfSelection.mode);
        
        // Handle score input (no auto-advance)
        const handleScoreUpdate = (playerIndex, value) => {
            onUpdateScore(playerIndex, currentHoleNumber, value);
        };
        
        // Calculate player's current total score vs par
        const calculatePlayerCurrentScore = (playerIndex) => {
            const playerScores = scores[playerIndex] || {};
            let totalGross = 0;
            let totalPar = 0;
            
            course.holes.forEach(hole => {
                const score = parseInt(playerScores[hole.hole]);
                if (score && score > 0) {
                    totalGross += score;
                    totalPar += hole.par;
                }
            });
            
            if (totalGross === 0) return null;
            return totalGross - totalPar;
        };
        
        // Get Wolf indicator for display
        const getWolfIndicator = () => {
            if (!playWolf || wolfIndex === null) return null;
            
            return e('div', { 
                className: 'card',
                style: { 
                    background: '#fef3c7', 
                    border: '2px solid #f59e0b',
                    textAlign: 'center',
                    marginBottom: '20px'
                }
            },
                e('h3', { 
                    className: 'font-bold text-xl mb-2',
                    style: { color: '#f59e0b' }
                }, '🐺 Wolf This Hole'),
                e('div', { 
                    style: { 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#92400e'
                    }
                }, GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex)),
                e('div', { 
                    style: { 
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '4px'
                    }
                }, 'Choose your strategy after all scores are entered')
            );
        };
        
        // Navigation functions
        const goToPreviousHole = () => {
            if (currentHoleNumber > 1) {
                setCurrentHoleNumber(currentHoleNumber - 1);
            }
        };
        
        const goToNextHole = () => {
            if (currentHoleNumber < 18) {
                setCurrentHoleNumber(currentHoleNumber + 1);
            }
        };
        
        // Quick hole selection
        const renderHoleSelector = () => {
            return e('div', { className: 'flex gap-1 mb-4 justify-center flex-wrap' },
                Array.from({ length: 18 }, (_, i) => i + 1).map(holeNum => {
                    const isComplete = players.every((_, playerIndex) => {
                        const score = parseInt(scores[playerIndex]?.[holeNum]);
                        return score && score > 0;
                    });
                    
                    return e('button', {
                        key: holeNum,
                        onClick: () => setCurrentHoleNumber(holeNum),
                        style: {
                            padding: '6px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            background: currentHoleNumber === holeNum ? '#059669' : 
                                       isComplete ? '#d1fae5' : 'white',
                            color: currentHoleNumber === holeNum ? 'white' : 
                                   isComplete ? '#059669' : '#374151',
                            cursor: 'pointer',
                            fontWeight: currentHoleNumber === holeNum ? 'bold' : 'normal'
                        }
                    }, holeNum);
                })
            );
        };
        
        // Render Wolf selection for current hole
        const renderWolfSelection = () => {
            if (!playWolf || wolfIndex === null) return null;
            
            const wolfName = GolfUtils.formatPlayerName(players[wolfIndex].name, wolfIndex);
            
            return e('div', { 
                className: 'card',
                style: { 
                    background: '#fef3c7', 
                    border: '2px solid #f59e0b'
                }
            },
                e('h3', { 
                    className: 'font-bold text-lg mb-3 text-center',
                    style: { color: '#f59e0b' }
                }, `🐺 ${wolfName}'s Choice`),
                
                !wolfSelection.mode ? e('div', { className: 'grid gap-3' },
                    // Partner selection
                    e('div', null,
                        e('div', { 
                            className: 'font-medium mb-2',
                            style: { fontSize: '14px' }
                        }, 'Choose Your Partner:'),
                        e('div', { className: 'grid grid-2 gap-2' },
                            players.map((player, index) => {
                                if (index === wolfIndex) return null;
                                const playerName = GolfUtils.formatPlayerName(player.name, index);
                                return e('button', {
                                    key: index,
                                    onClick: () => onUpdateWolfSelection(currentHoleNumber, {
                                        mode: 'partner',
                                        partnerIndex: index,
                                        isBlind: false
                                    }),
                                    className: 'btn',
                                    style: { 
                                        padding: '12px',
                                        background: '#fed7aa',
                                        color: '#ea580c',
                                        border: '2px solid #ea580c',
                                        fontWeight: '600'
                                    }
                                }, `🤝 ${playerName}`);
                            })
                        )
                    ),
                    
                    // Lone Wolf options
                    e('div', null,
                        e('div', { 
                            className: 'font-medium mb-2',
                            style: { fontSize: '14px' }
                        }, 'Or Go It Alone:'),
                        e('div', { className: 'grid grid-2 gap-2' },
                            e('button', {
                                onClick: () => onUpdateWolfSelection(currentHoleNumber, {
                                    mode: 'lone',
                                    partnerIndex: null,
                                    isBlind: false
                                }),
                                className: 'btn',
                                style: { 
                                    padding: '12px',
                                    background: '#dc2626',
                                    fontWeight: '600'
                                }
                            }, '🐺 Lone Wolf\n(4 pts)'),
                            e('button', {
                                onClick: () => onUpdateWolfSelection(currentHoleNumber, {
                                    mode: 'lone',
                                    partnerIndex: null,
                                    isBlind: true
                                }),
                                className: 'btn',
                                style: { 
                                    padding: '12px',
                                    background: '#7c2d12',
                                    fontWeight: '600'
                                }
                            }, '🌙 Blind Wolf\n(6 pts)')
                        )
                    )
                ) : e('div', { 
                    className: 'text-center',
                    style: { 
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '16px',
                        borderRadius: '8px'
                    }
                },
                    wolfSelection.mode === 'lone' ? e('div', null,
                        e('div', { 
                            className: 'font-bold text-lg mb-2',
                            style: { color: wolfSelection.isBlind ? '#7c2d12' : '#dc2626' }
                        }, wolfSelection.isBlind ? '🌙 Blind Wolf!' : '🐺 Lone Wolf!'),
                        e('div', { style: { fontSize: '14px' } }, 
                            `${wolfName} vs Everyone (${wolfSelection.isBlind ? '6' : '4'} pts)`
                        )
                    ) : e('div', null,
                        e('div', { 
                            className: 'font-bold text-lg mb-2',
                            style: { color: '#ea580c' }
                        }, '🤝 Partnership!'),
                        e('div', { style: { fontSize: '14px' } }, 
                            `${wolfName} + ${GolfUtils.formatPlayerName(
                                players[wolfSelection.partnerIndex].name, 
                                wolfSelection.partnerIndex
                            )} (2 pts each)`
                        )
                    ),
                    
                    e('button', {
                        onClick: () => onUpdateWolfSelection(currentHoleNumber, null),
                        style: { 
                            marginTop: '12px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }
                    }, 'Change Selection'')
                )
            );
        };')
                )
            );
        };
        
        return e('div', null,
            // Hole selector
            renderHoleSelector(),
            
            // Current hole header
            e('div', { 
                className: 'card text-center',
                style: { 
                    background: hasAllScores ? '#d1fae5' : '#fef3c7',
                    border: `2px solid ${hasAllScores ? '#059669' : '#f59e0b'}`
                }
            },
                e('div', { className: 'flex-between mb-4' },
                    e('button', {
                        onClick: goToPreviousHole,
                        disabled: currentHoleNumber === 1,
                        className: 'btn btn-secondary',
                        style: { opacity: currentHoleNumber === 1 ? 0.5 : 1 }
                    }, '← Prev'),
                    e('div', { className: 'text-center' },
                        e('h1', { className: 'text-3xl font-bold mb-2' }, 
                            `Hole ${currentHoleNumber}`
                        ),
                        e('div', { className: 'flex justify-center gap-6 text-lg' },
                            e('span', null, `⛳ Par ${currentHole.par}`),
                            e('span', null, `📏 ${currentHole.yardage} yds`),
                            e('span', null, `🎯 HCP ${currentHole.handicap}`)
                        )
                    ),
                    e('button', {
                        onClick: goToNextHole,
                        disabled: currentHoleNumber === 18,
                        className: 'btn btn-secondary',
                        style: { opacity: currentHoleNumber === 18 ? 0.5 : 1 }
                    }, 'Next →')
                ),
                
                hasAllScores && e('div', { 
                    style: { 
                        background: 'rgba(5, 150, 105, 0.1)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        color: '#059669',
                        fontWeight: 'bold',
                        display: 'inline-block'
                    }
                }, '✅ Hole Complete!')
            ),
            
            // Player score inputs
            e('div', { className: 'grid gap-4 mb-6' },
                players.map((player, playerIndex) => {
                    const playerScore = scores[playerIndex]?.[currentHoleNumber] || '';
                    const strokes = GolfScoring.getStrokesForHole(player.handicap, currentHole.handicap);
                    const netScore = playerScore ? parseInt(playerScore) - strokes : null;
                    const currentScore = calculatePlayerCurrentScore(playerIndex);
                    const playerTensSelections = tensSelections[playerIndex] || {};
                    const isSelectedForTens = playerTensSelections[currentHoleNumber];
                    const canSelectForTens = playTens && GolfScoring.canSelectForTens(playerTensSelections, currentHoleNumber);
                    
                    return e('div', { 
                        key: playerIndex,
                        className: 'card',
                        style: { 
                            background: playerScore ? '#d1fae5' : '#f9fafb',
                            border: `2px solid ${playerScore ? '#059669' : '#e5e7eb'}`
                        }
                    },
                        e('div', { className: 'flex-between mb-3' },
                            e('div', null,
                                e('h3', { className: 'font-bold text-lg' }, 
                                    GolfUtils.formatPlayerName(player.name, playerIndex)
                                ),
                                currentScore !== null && e('div', { 
                                    style: { 
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: currentScore > 0 ? '#dc2626' : currentScore < 0 ? '#059669' : '#6b7280'
                                    }
                                }, `Current: ${GolfScoring.formatToPar(currentScore, 0)}`)
                            ),
                            e('div', { className: 'text-sm text-gray-600' },
                                `Handicap: ${player.handicap}`
                            )
                        ),
                        
                        e('div', { className: 'grid grid-2 gap-4 mb-3' },
                            e('div', null,
                                e('label', { className: 'block font-medium mb-2' }, 'Gross Score'),
                                e('input', {
                                    type: 'number',
                                    value: playerScore,
                                    onChange: (evt) => handleScoreUpdate(playerIndex, evt.target.value),
                                    min: '1',
                                    max: '15',
                                    className: 'input current-hole-input',
                                    style: { 
                                        fontSize: '24px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        height: '56px'
                                    },
                                    placeholder: '0'
                                })
                            ),
                            e('div', null,
                                e('div', { className: 'font-medium mb-2' }, 'Net Score'),
                                e('div', { 
                                    style: { 
                                        height: '56px',
                                        background: '#f3f4f6',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: netScore !== null ? '#059669' : '#9ca3af'
                                    }
                                }, netScore !== null ? netScore : '—')
                            )
                        ),
                        
                        strokes > 0 && e('div', { 
                            className: 'text-center mb-3',
                            style: { 
                                background: '#dbeafe',
                                color: '#2563eb',
                                padding: '8px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }
                        }, `Receives ${strokes} stroke${strokes > 1 ? 's' : ''}`),
                        
                        // Tens selection button
                        playTens && playerScore && e('div', { className: 'text-center' },
                            e('button', {
                                onClick: () => onToggleTens(playerIndex, currentHoleNumber),
                                disabled: !canSelectForTens,
                                className: `btn ${isSelectedForTens ? '' : 'btn-secondary'}`,
                                style: { 
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    background: isSelectedForTens ? '#7c3aed' : undefined,
                                    color: isSelectedForTens ? 'white' : undefined,
                                    opacity: !canSelectForTens ? 0.5 : 1
                                }
                            }, isSelectedForTens ? '✓ Selected for Tens' : 'Select for Tens')
                        )
                    );
                })
            ),
            
            // Wolf indicator (if enabled)
            getWolfIndicator(),
            
            // Wolf selection (if enabled and all scores entered)
            playWolf && hasAllScores && renderWolfSelection(),
            
            // Hole completion confirmation
            hasAllScores && e('div', { 
                className: 'card text-center',
                style: { 
                    background: canAdvance ? '#d1fae5' : '#fef3c7',
                    border: `2px solid ${canAdvance ? '#059669' : '#f59e0b'}`,
                    marginTop: '20px'
                }
            },
                e('h3', { 
                    className: 'font-bold text-lg mb-3',
                    style: { color: canAdvance ? '#059669' : '#f59e0b' }
                }, canAdvance ? '✅ Hole Complete!' : '⏳ Waiting for Wolf Selection'),
                
                canAdvance && currentHoleNumber < 18 && e('button', {
                    onClick: advanceToNextHole,
                    className: 'btn',
                    style: { 
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        background: '#059669'
                    }
                }, `Continue to Hole ${currentHoleNumber + 1} →`),
                
                canAdvance && currentHoleNumber === 18 && e('div', { 
                    style: {
                        background: '#d1fae5',
                        color: '#059669',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }
                }, '🏁 Round Complete! Check other tabs for results.')
            ),
            
            // Navigation and completion
            e('div', { className: 'flex-between mt-6' },
                e('button', {
                    onClick: goToPreviousHole,
                    disabled: currentHoleNumber === 1,
                    className: 'btn btn-secondary'
                }, '← Previous Hole'),
                
                e('button', {
                    onClick: goToNextHole,
                    disabled: currentHoleNumber === 18,
                    className: 'btn btn-secondary'
                }, 'Next Hole →')
            ),
            
            // Progress indicator
            e('div', { className: 'mt-6' },
                e('div', { className: 'text-center text-sm text-gray-600 mb-2' },
                    (() => {
                        const completedHoles = Array.from({ length: 18 }, (_, i) => i + 1).filter(holeNum => {
                            return players.every((_, playerIndex) => {
                                const score = parseInt(scores[playerIndex]?.[holeNum]);
                                return score && score > 0;
                            });
                        }).length;
                        return `${completedHoles}/18 holes complete`;
                    })()
                ),
                e('div', { 
                    style: { 
                        width: '100%', 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                    } 
                },
                    e('div', { 
                        style: { 
                            width: `${(Array.from({ length: 18 }, (_, i) => i + 1).filter(holeNum => {
                                return players.every((_, playerIndex) => {
                                    const score = parseInt(scores[playerIndex]?.[holeNum]);
                                    return score && score > 0;
                                });
                            }).length / 18) * 100}%`, 
                            height: '100%', 
                            background: '#059669',
                            transition: 'width 0.3s ease'
                        } 
                    })
                )
            )
        );
    };
})();