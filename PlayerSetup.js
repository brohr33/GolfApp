// Player Setup Component
window.PlayerSetup = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function PlayerSetup({ 
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

        onContinue 
    }) {
        
        const updatePlayer = (index, field, value) => {
            const newPlayers = [...players];
            newPlayers[index] = { ...newPlayers[index], [field]: value };
            setPlayers(newPlayers);
        };
        
        const validateSetup = () => {
            // Wolf requires exactly 4 players
            if (playWolf && numPlayers !== 4) {
                return false;
            }
            return players.some(player => 
                GolfUtils.validatePlayerName(player.name)
            );
        };
        
        const getSkinsModeName = (mode) => {
            switch(mode) {
                case 'push': return 'Push';
                case 'carryover': return 'Carryover';
                case 'null': return 'Null';
                default: return 'Push';
            }
        };
        
        const getSkinsDescription = (mode) => {
            switch(mode) {
                case 'push': return 'Tied holes have no winner (skin is lost)';
                case 'carryover': return 'Tied holes carry skin value to next hole';
                case 'null': return 'Tied holes have no winner, no carryover';
                default: return 'Tied holes have no winner (skin is lost)';
            }
        };
        
        // Auto-adjust number of players if Wolf is enabled
        const handleWolfToggle = (enabled) => {
            if (enabled && numPlayers !== 4) {
                setNumPlayers(4);
            }
            setPlayWolf(enabled);
        };

        return e('div', { className: 'card' },
            e('div', { className: 'text-center mb-8' },
                e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '⛳'),
                e('h1', { className: 'text-3xl font-bold mb-2' }, 'Golf Scorecard Pro'),
                e('p', { className: 'text-gray-600' }, 'Professional golf scoring with handicap system')
            ),
            
            e('div', { className: 'grid gap-6' },
                // Number of Players Selection
                e('div', null,
                    e('label', { className: 'block font-semibold mb-3' }, '👥 Number of Players'),
                    e('div', { className: 'grid grid-4 gap-3' },
                        [1, 2, 3, 4].map(num => 
                            e('button', {
                                key: num,
                                onClick: () => setNumPlayers(num),
                                disabled: playWolf && num !== 4, // Wolf requires 4 players
                                className: `btn ${numPlayers === num ? '' : 'btn-secondary'}`,
                                style: { 
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    fontWeight: numPlayers === num ? '600' : '500',
                                    opacity: playWolf && num !== 4 ? 0.5 : 1
                                }
                            }, `${num} Player${num > 1 ? 's' : ''}`)
                        )
                    ),
                    playWolf && numPlayers !== 4 && e('div', { 
                        className: 'text-sm text-orange-600 mt-2',
                        style: { color: '#ea580c' }
                    }, '🐺 Wolf game requires exactly 4 players')
                ),
                
                // Player Details Forms
                e('div', { className: 'grid gap-4' },
                    players.map((player, index) =>
                        e('div', { 
                            key: index, 
                            className: 'card', 
                            style: { background: '#f9fafb' } 
                        },
                            e('h3', { className: 'font-semibold mb-3' }, `Player ${index + 1}`),
                            e('div', { className: 'grid grid-2 gap-4' },
                                e('div', null,
                                    e('label', { className: 'block font-medium mb-1' }, 'Name'),
                                    e('input', {
                                        type: 'text',
                                        value: player.name,
                                        onChange: (evt) => updatePlayer(index, 'name', evt.target.value),
                                        placeholder: `Player ${index + 1}`,
                                        className: 'input'
                                    })
                                ),
                                e('div', null,
                                    e('label', { className: 'block font-medium mb-1' }, '🎯 Handicap'),
                                    e('input', {
                                        type: 'number',
                                        value: player.handicap,
                                        onChange: (evt) => updatePlayer(index, 'handicap', parseInt(evt.target.value) || 0),
                                        min: '0',
                                        max: '54',
                                        className: 'input'
                                    })
                                )
                            )
                        )
                    )
                ),
                
                // Game of Tens Toggle
                e('div', { 
                    className: 'card', 
                    style: { background: '#f3e8ff', border: '2px solid #a855f7' } 
                },
                    e('div', { className: 'flex-between' },
                        e('div', null,
                            e('h3', { className: 'font-semibold text-lg mb-1' }, '🏆 Game of Tens'),
                            e('p', { className: 'text-gray-600' }, 'Select your best 10 holes for a side competition')
                        ),
                        e('div', {
                            className: `toggle ${playTens ? 'active' : ''}`,
                            onClick: () => setPlayTens(!playTens)
                        },
                            e('div', { className: 'toggle-thumb' })
                        )
                    )
                ),
                
                // Skins Game Toggle and Mode Selection
                e('div', { 
                    className: 'card', 
                    style: { background: '#fed7aa', border: '2px solid #ea580c' } 
                },
                    e('div', { className: 'flex-between mb-4' },
                        e('div', null,
                            e('h3', { className: 'font-semibold text-lg mb-1' }, '🎯 Skins Game'),
                            e('p', { className: 'text-gray-600' }, 'Lowest net score wins each hole')
                        ),
                        e('div', {
                            className: `toggle ${playSkins ? 'active skins' : ''}`,
                            onClick: () => setPlaySkins(!playSkins)
                        },
                            e('div', { className: 'toggle-thumb' })
                        )
                    ),
                    
                    // Skins mode selection (only show when skins is enabled)
                    playSkins && e('div', null,
                        e('label', { className: 'block font-medium mb-3' }, 'Tie Handling Mode:'),
                        e('div', { className: 'grid grid-3 gap-3' },
                            ['push', 'carryover', 'null'].map(mode => 
                                e('button', {
                                    key: mode,
                                    onClick: () => setSkinsMode(mode),
                                    className: `btn ${skinsMode === mode ? '' : 'btn-secondary'}`,
                                    style: { 
                                        padding: '8px 12px',
                                        fontSize: '13px',
                                        fontWeight: skinsMode === mode ? '600' : '500'
                                    }
                                }, getSkinsModeName(mode))
                            )
                        ),
                        e('div', { 
                            className: 'mt-3 text-sm text-gray-700',
                            style: { 
                                background: 'rgba(255, 255, 255, 0.7)', 
                                padding: '8px 12px', 
                                borderRadius: '6px' 
                            }
                        }, getSkinsDescription(skinsMode))
                    )
                ),
                
                // Wolf Game Toggle
                e('div', { 
                    className: 'card', 
                    style: { background: '#fef3c7', border: '2px solid #f59e0b' } 
                },
                    e('div', { className: 'flex-between' },
                        e('div', null,
                            e('h3', { className: 'font-semibold text-lg mb-1' }, '🐺 Wolf Game'),
                            e('p', { className: 'text-gray-600' }, 'Strategic partnerships and lone wolf battles'),
                            numPlayers !== 4 && e('p', { 
                                className: 'text-sm mt-1',
                                style: { color: '#ea580c' }
                            }, 'Requires exactly 4 players')
                        ),
                        e('div', {
                            className: `toggle ${playWolf ? 'active' : ''}`,
                            style: { background: playWolf ? '#f59e0b' : '#d1d5db' },
                            onClick: () => handleWolfToggle(!playWolf)
                        },
                            e('div', { className: 'toggle-thumb' })
                        )
                    )
                ),

                // Continue Button
                e('button', {
                    onClick: onContinue,
                    className: 'btn',
                    style: { width: '100%', padding: '16px' },
                    disabled: !validateSetup()
                }, '🔍 Find Golf Course →')
            ),
            
            // Game Info
            (playTens || playSkins || playWolf) && e('div', { className: 'status status-info mt-4' },
                (() => {
                    const activeGames = [];
                    if (playTens) activeGames.push('Game of Tens');
                    if (playSkins) activeGames.push('Skins');
                    if (playWolf) activeGames.push('Wolf');
                    
                    if (activeGames.length > 1) {
                        return e('div', null,
                            e('strong', null, 'Multiple Games: '),
                            `Playing ${activeGames.join(', ')}! Multiple ways to compete and win.`
                        );
                    } else if (playTens) {
                        return e('div', null,
                            e('strong', null, 'Game of Tens: '),
                            'Each player will select their best 10 holes after the round.'
                        );
                    } else if (playSkins) {
                        return e('div', null,
                            e('strong', null, 'Skins Game: '),
                            `Lowest net score wins each hole. Ties are ${skinsMode === 'push' ? 'pushed (no winner)' : skinsMode === 'carryover' ? 'carried over to next hole' : 'nullified (no winner, no carryover)'}.`
                        );
                    } else if (playWolf) {
                        return e('div', null,
                            e('strong', null, 'Wolf Game: '),
                            'Players rotate as the Wolf, choosing partners or going alone for strategic point battles.'
                        );
                    }
                })()

            )
        );
    };
})();