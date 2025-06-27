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
            { id: 'scorecard', label: '⛳ Scorecard', icon: '📊' },
            ...(playTens ? [{ id: 'tens', label: '🏆 Game of Tens', icon: '🎯' }] : []),
            ...(playSkins ? [{ id: 'skins', label: '🎯 Skins', icon: '🔥' }] : []),
            ...(playWolf ? [{ id: 'wolf', label: '🐺 Wolf', icon: '⚔️' }] : [])
        ];
        
        const getTabStyle = (tabId) => ({
            padding: '12px 20px',
            border: 'none',
            background: activeTab === tabId ? '#059669' : '#f3f4f6',
            color: activeTab === tabId ? 'white' : '#374151',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === tabId ? '600' : '500',
            fontSize: '14px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '120px',
            justifyContent: 'center'
        });
        
        const getTabHoverStyle = (tabId) => ({
            ...getTabStyle(tabId),
            ...(activeTab !== tabId ? {
                background: '#e5e7eb',
                color: '#1f2937'
            } : {})
        });
        
        return e('div', { 
            style: { 
                background: 'white',
                borderRadius: '8px 8px 0 0',
                marginBottom: '0',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
            }
        },
            e('div', { 
                style: { 
                    display: 'flex',
                    gap: '2px',
                    padding: '8px 8px 0 8px',
                    background: '#f9fafb',
                    borderRadius: '8px 8px 0 0'
                }
            },
                tabs.map(tab => 
                    e('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        style: getTabStyle(tab.id),
                        onMouseEnter: (e) => {
                            if (activeTab !== tab.id) {
                                Object.assign(e.target.style, {
                                    background: '#e5e7eb',
                                    color: '#1f2937'
                                });
                            }
                        },
                        onMouseLeave: (e) => {
                            Object.assign(e.target.style, getTabStyle(tab.id));
                        }
                    },
                        e('span', { style: { fontSize: '16px' } }, tab.icon),
                        e('span', null, tab.label.replace(/^[^\s]+ /, '')) // Remove emoji from label
                    )
                )
            )
        );
    };
})();