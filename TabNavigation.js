// Tab Navigation Component
window.TabNavigation = (function() {
    'use strict';
    
    const { createElement: e } = React;
    
    return function TabNavigation({ 
        activeTab, 
        setActiveTab, 
        playTens, 
        playSkins, 
        playWolf 
    }) {
        
        const tabs = [
            { id: 'scorecard', label: 'Scorecard', icon: '⛳', color: '#059669', shortLabel: 'Card' },
            ...(playTens ? [{ id: 'tens', label: 'Game of Tens', icon: '🏆', color: '#7c3aed', shortLabel: 'Tens' }] : []),
            ...(playSkins ? [{ id: 'skins', label: 'Skins', icon: '🎯', color: '#ea580c', shortLabel: 'Skins' }] : []),
            ...(playWolf ? [{ id: 'wolf', label: 'Wolf', icon: '🐺', color: '#f59e0b', shortLabel: 'Wolf' }] : [])
        ];
        
        const getTabStyle = (tab) => ({
            padding: '12px 16px',
            border: 'none',
            background: activeTab === tab.id ? tab.color : 'white',
            color: activeTab === tab.id ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === tab.id ? '600' : '500',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: '1',
            justifyContent: 'center',
            minWidth: '0', // Allow shrinking
            position: 'relative',
            border: activeTab === tab.id ? 'none' : '1px solid #e5e7eb',
            borderBottom: 'none'
        });
        
        return e('div', { 
            style: { 
                background: '#f3f4f6',
                borderRadius: '8px 8px 0 0',
                marginBottom: '0',
                padding: '4px 4px 0 4px'
            }
        },
            e('div', { 
                style: { 
                    display: 'flex',
                    gap: '2px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                },
                className: 'tab-container'
            },
                tabs.map(tab => 
                    e('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        style: getTabStyle(tab),
                        onMouseEnter: (e) => {
                            if (activeTab !== tab.id) {
                                e.target.style.background = '#f9fafb';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }
                        },
                        onMouseLeave: (e) => {
                            if (activeTab !== tab.id) {
                                e.target.style.background = 'white';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        },
                        className: 'tab-button'
                    },
                        e('span', { 
                            style: { 
                                fontSize: '16px',
                                minWidth: '20px',
                                textAlign: 'center'
                            } 
                        }, tab.icon),
                        e('span', { 
                            className: 'tab-label-full',
                            style: { whiteSpace: 'nowrap' }
                        }, tab.label),
                        e('span', { 
                            className: 'tab-label-short',
                            style: { 
                                whiteSpace: 'nowrap',
                                display: 'none'
                            }
                        }, tab.shortLabel)
                    )
                )
            )
        );
    };
})();