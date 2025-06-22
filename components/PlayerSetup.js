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
        onContinue 
    }) {
        
        const updatePlayer = (index, field, value) => {
            const newPlayers = [...players];
            newPlayers[index] = { ...newPlayers[index], [field]: value };
            setPlayers(newPlayers);
        };
        
        const validateSetup = () => {
            // Check if at least one player has a name
            const hasValidPlayer = players.some(player => 
                GolfUtils.validatePlayerName(player.name)
            );
            return hasValidPlayer;
        };
        
        return e('div', { className: 'card' },
            e('div', { className: 'text-center mb-8' },
                e('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '⛳'),
                e('h1', { className: 'text-3xl font-bold mb-2' }, 'Golf Scorecard Pro'),
                e('p', { className: 'text-gray-600' }, 'Professional golf scoring with handicap system')
            ),
            
            e('div', { className: 'grid gap-6' },
                // Number of players selector
                e('div', null,
                    e('label', { className: 'block font-semibold mb-2' }, '👥 Number of Players'),
                    e('select', {
                        value: numPlayers,
                        onChange: (evt) => setNumPlayers(parseInt(evt.target.value)),
                        className: 'input'
                    },
                        [1, 2, 3, 4].map(num => 
                            e('option', { key: num, value: num }, `${num} Player${num > 1 ? 's' : ''}`)
                        )
                    )
                ),
                
                // Player configuration
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
                
                // Game of Tens toggle
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
                
                // Continue button
                e('button', {
                    onClick: onContinue,
                    className: 'btn',
                    style: { width: '100%', padding: '16px' },
                    disabled: !validateSetup()
                }, '🔍 Find Golf Course →')
            ),
            
            // Help text
            playTens && e('div', { className: 'status status-info mt-4' },
                e('strong', null, 'Game of Tens: '),
                'Each player will select their best 10 holes after the round. Only those holes count towards the Tens competition!'
            )
        );
    };
})();