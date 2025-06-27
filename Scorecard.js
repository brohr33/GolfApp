// Main Scorecard Component with Tabbed Interface
window.Scorecard = (function() {
    'use strict';
    
    const { createElement: e, useState } = React;
    
    return function Scorecard({ 
        course, 
        players, 
        scores, 
        tensSelections, 
        playTens,
        playSkins,
        skinsMode,
        playWolf,
        wolfSelections,
        onUpdateScore, 
        onToggleTens,
        onUpdateWolfSelection,
        onBack, 
        onNewRound 
    }) {
        
        const [activeTab, setActiveTab] = useState('scorecard');
        
        const renderHoleRow = (hole, holeIndex) => {
            const isEvenRow = holeIndex % 2 === 0;
            
            return e('tr', { 
                key: hole.hole, 
                style: isEvenRow ? { background: '#f9fafb' } : {} 
            },
                // Hole number
                e('td', { style: { fontWeight: 'bold' } }, hole.hole),
                // Par
                e('td', null, hole.par),
                // Yardage
                e('td', null, hole.yardage),
                // Handicap
                e('td', null, hole.handicap),
                // Player scores
                players.map((player, playerIndex) => {
                    const playerScores = scores[playerIndex] || {};
                    const playerTensSelections = tensSelections[playerIndex] || {};
                    const strokes = GolfScoring.getStrokesForHole(player.handicap, hole.handicap);
                    const isSelectedForTens = playerTensSelections[hole.hole];
                    const canSelectForTens = GolfScoring.canSelectForTens(playerTensSelections, hole.hole);
                    
                    return e('td', { key: playerIndex },
                        e('div', { 
                            style: { 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                gap: '4px' 
                            } 
                        },
                            // Score input
                            e('input', {
                                type: 'number',
                                value: playerScores[hole.hole] || '',
                                onChange: (evt) => onUpdateScore(playerIndex, hole.hole, evt.target.value),
                                min: '1',
                                max: '15',
                                className: 'score-input',
                                placeholder: '0'
                            }),
                            // Stroke indicator
                            strokes > 0 && e('div', { 
                                style: { 
                                    fontSize: '11px', 
                                    color: '#2563eb', 
                                    fontWeight: '500' 
                                } 
                            }, `${strokes} stroke${strokes > 1 ? 's' : ''}`),
                            // Tens button
                            playTens && e('button', {
                                onClick: () => onToggleTens(playerIndex, hole.hole),
                                disabled: !canSelectForTens,
                                className: `tens-btn ${isSelectedForTens ? 'selected' : ''}`
                            }, isSelectedForTens ? '✓ Tens' : 'Tens')
                        )
                    );
                })
            );
        };
        
        const renderSubtotalRow = (label, holes, className) => {
            const parTotal = holes.reduce((sum, h) => sum + h.par, 0);
            
            return e('tr', { key: label.toLowerCase(), className },
                e('td', { style: { fontWeight: 'bold' } }, label),
                e('td', { style: { fontWeight: 'bold' } }, parTotal),
                e('td', null, '—'),
                e('td', null, '—'),
                players.map((player, playerIndex) => {
                    const playerScores = scores[playerIndex] || {};
                    
                    const grossTotal = holes.reduce((total, hole) => {
                        return total + (parseInt(playerScores[hole.hole]) || 0);
                    }, 0);
                    
                    const netTotal = holes.reduce((total, hole) => {
                        const score = parseInt(playerScores[hole.hole]);
                        if (score && score > 0) {
                            const strokes = GolfScoring.getStrokesForHole(player.handicap, hole.handicap);
                            return total + score - strokes;
                        }
                        return total;
                    }, 0);
                    
                    return e('td', { key: playerIndex, style: { fontWeight: 'bold' } },
                        e('div', null, grossTotal || 0),
                        e('div', { 
                            style: { fontSize: '11px', color: '#6b7280' } 
                        }, `Net: ${netTotal || 0}`)
                    );
                })
            );
        };
        
        const renderTotalRow = () => {
            return e('tr', { 
                key: 'total', 
                style: { 
                    background: '#d1fae5', 
                    fontWeight: 'bold', 
                    fontSize: '16px' 
                } 
            },
                e('td', null, 'TOTAL'),
                e('td', null, course.par),
                e('td', null, '—'),
                e('td', null, '—'),
                players.map((player, playerIndex) => {
                    const playerScores = scores[playerIndex] || {};
                    const totalGross = GolfScoring.calculateTotal(playerScores, course);
                    const totalNet = GolfScoring.calculateNetScore(playerScores, course, player.handicap);
                    const toPar = totalGross - course.par;
                    
                    return e('td', { key: playerIndex },
                        e('div', null, totalGross || 0),
                        e('div', { 
                            style: { fontSize: '12px', color: '#6b7280' } 
                        }, `Net: ${totalNet || 0}`),
                        totalGross > 0 && e('div', { 
                            style: { 
                                fontSize: '11px', 
                                color: toPar > 0 ? '#dc2626' : toPar < 0 ? '#059669' : '#6b7280',
                                fontWeight: 'bold'
                            } 
                        }, GolfScoring.formatToPar(totalGross, course.par))
                    );
                })
            );
        };
        
        const renderScorecardContent = () => {
            return e('div', null,
                // Scorecard table
                e('div', { className: 'table-container mb-6' },
                    e('table', null,
                        // Table header
                        e('thead', null,
                            e('tr', null,
                                e('th', { style: { textAlign: 'left' } }, 'Hole'),
                                e('th', null, 'Par'),
                                e('th', null, 'Yards'),
                                e('th', null, 'HCP'),
                                players.map((player, index) =>
                                    e('th', { key: index },
                                        e('div', null, GolfUtils.formatPlayerName(player.name, index)),
                                        e('div', { 
                                            style: { 
                                                fontSize: '12px', 
                                                fontWeight: 'normal', 
                                                color: '#6b7280' 
                                            } 
                                        }, `HCP: ${player.handicap}`)
                                    )
                                )
                            )
                        ),
                        // Table body
                        e('tbody', null,
                            // Front 9 holes
                            course.holes.slice(0, 9).map((hole, index) => renderHoleRow(hole, index)),
                            
                            // Front 9 subtotal
                            renderSubtotalRow('FRONT 9', course.holes.slice(0, 9), 'front-nine'),
                            
                            // Back 9 holes
                            course.holes.slice(9, 18).map((hole, index) => renderHoleRow(hole, index + 9)),
                            
                            // Back 9 subtotal
                            renderSubtotalRow('BACK 9', course.holes.slice(9, 18), 'back-nine'),
                            
                            // Total row
                            renderTotalRow()
                        )
                    )
                ),
                
                // Scoring help
                e('div', { className: 'card mt-6' },
                    e('h3', { className: 'font-semibold mb-3' }, '📊 Scoring Help'),
                    e('div', { className: 'grid grid-3 gap-4 text-sm' },
                        e('div', null,
                            e('div', { className: 'font-medium mb-1' }, 'Gross Score'),
                            e('div', { className: 'text-gray-600' }, 'Your actual strokes on each hole')
                        ),
                        e('div', null,
                            e('div', { className: 'font-medium mb-1' }, 'Net Score'),
                            e('div', { className: 'text-gray-600' }, 'Gross score minus handicap strokes')
                        ),
                        e('div', null,
                            e('div', { className: 'font-medium mb-1' }, 'Handicap Strokes'),
                            e('div', { className: 'text-gray-600' }, 'Extra strokes based on hole difficulty')
                        )
                    )
                )
            );
        };
        
        const renderTabContent = () => {
            switch (activeTab) {
                case 'scorecard':
                    return renderScorecardContent();
                case 'tens':
                    return playTens && window.GameOfTens ? 
                        e(window.GameOfTens, {
                            players,
                            course,
                            scores,
                            tensSelections
                        }) : null;
                case 'skins':
                    return playSkins && window.Skins ? 
                        e(window.Skins, {
                            players,
                            course,
                            scores,
                            skinsMode
                        }) : null;
                case 'wolf':
                    return playWolf && window.Wolf ? 
                        e(window.Wolf, {
                            players,
                            course,
                            scores,
                            wolfSelections,
                            onUpdateWolfSelection
                        }) : null;
                default:
                    return renderScorecardContent();
            }
        };
        
        return e('div', null,
            // Course header
            e('div', { className: 'card text-center mb-6' },
                e('h1', { className: 'text-3xl font-bold mb-2' }, course.name),
                e('div', { className: 'text-gray-600' },
                    e('div', null, `📍 ${course.city}, ${course.state}`),
                    e('div', { className: 'flex justify-center gap-6 mt-2 text-sm' },
                        e('span', null, `⛳ Par ${course.par}`),
                        course.yardage && e('span', null, `📏 ${course.yardage} yards`),
                        course.rating && e('span', null, `📊 ${course.rating}`),
                        course.slope && e('span', null, `📈 ${course.slope}`)
                    )
                )
            ),
            
            // Tab Navigation
            window.TabNavigation && e(window.TabNavigation, {
                activeTab,
                setActiveTab,
                playTens,
                playSkins,
                playWolf
            }),
            
            // Tab Content Container
            e('div', { 
                style: {
                    background: 'white',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '24px',
                    marginBottom: '24px'
                }
            }, renderTabContent()),
            
            // Navigation and actions
            e('div', { className: 'flex-between mt-8 no-print' },
                e('button', {
                    onClick: onBack,
                    className: 'btn btn-secondary'
                }, '← Change Course'),
                e('div', { className: 'flex gap-3' },
                    e('button', {
                        onClick: () => window.print(),
                        className: 'btn btn-secondary'
                    }, '🖨️ Print Scorecard'),
                    e('button', {
                        onClick: onNewRound,
                        className: 'btn'
                    }, '🆕 New Round')
                )
            )
        );
    };
})();