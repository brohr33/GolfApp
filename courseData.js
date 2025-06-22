// Course data generation and famous course hole layouts
window.CourseData = (function() {
    'use strict';
    
    // Calculate hole difficulty for handicap assignment
    const calculateHoleDifficulty = (hole) => {
        let difficulty = 0;
        difficulty += hole.par * 10; // Par value weight
        difficulty += hole.yardage * 0.05; // Yardage weight
        
        // Additional difficulty factors
        if (hole.par === 3 && hole.yardage > 200) difficulty += 20;
        if (hole.par === 5 && hole.yardage > 550) difficulty += 15;
        if (hole.par === 4 && hole.yardage > 450) difficulty += 10;
        
        return difficulty;
    };
    
    // Assign proper handicaps based on difficulty (1 = hardest, 18 = easiest)
    const assignProperHandicaps = (holes) => {
        const holesWithDifficulty = holes.map(hole => ({
            ...hole,
            difficulty: calculateHoleDifficulty(hole)
        }));
        
        // Sort by difficulty (hardest first)
        holesWithDifficulty.sort((a, b) => b.difficulty - a.difficulty);
        
        // Assign handicaps 1-18
        holesWithDifficulty.forEach((hole, index) => {
            hole.handicap = index + 1;
        });
        
        // Sort back to hole order
        holesWithDifficulty.sort((a, b) => a.hole - b.hole);
        
        // Remove difficulty property
        return holesWithDifficulty.map(({ difficulty, ...hole }) => hole);
    };
    
const generatePebbleBeachHoles = () => {
        return [
            { hole: 1, par: 4, yardage: 381, handicap: 13 },
            { hole: 2, par: 5, yardage: 502, handicap: 7 },
            { hole: 3, par: 4, yardage: 390, handicap: 11 },
            { hole: 4, par: 4, yardage: 331, handicap: 17 },
            { hole: 5, par: 3, yardage: 188, handicap: 15 },
            { hole: 6, par: 5, yardage: 513, handicap: 1 },
            { hole: 7, par: 3, yardage: 106, handicap: 9 },
            { hole: 8, par: 4, yardage: 431, handicap: 3 },
            { hole: 9, par: 4, yardage: 464, handicap: 5 },
            { hole: 10, par: 4, yardage: 446, handicap: 8 },
            { hole: 11, par: 4, yardage: 390, handicap: 18 },
            { hole: 12, par: 3, yardage: 202, handicap: 12 },
            { hole: 13, par: 4, yardage: 399, handicap: 14 },
            { hole: 14, par: 5, yardage: 580, handicap: 2 },
            { hole: 15, par: 4, yardage: 397, handicap: 10 },
            { hole: 16, par: 4, yardage: 402, handicap: 16 },
            { hole: 17, par: 3, yardage: 178, handicap: 6 },
            { hole: 18, par: 5, yardage: 543, handicap: 4 }
        ];
    };    
// Generate realistic default holes
    const generateDefaultHoles = (targetPar = 72) => {
        const holes = [];
        
        // Realistic par distribution for 18 holes
        const parDistribution = [4,5,4,4,3,5,3,4,4,4,4,3,4,5,4,4,3,5];
        
        // Adjust if needed to match target par
        let currentPar = parDistribution.reduce((sum, par) => sum + par, 0);
        if (currentPar !== targetPar) {
            // Simple adjustment - change last par 4 to match target
            const diff = targetPar - currentPar;
            if (Math.abs(diff) <= 2) {
                for (let i = parDistribution.length - 1; i >= 0 && diff !== 0; i--) {
                    if (parDistribution[i] === 4) {
                        parDistribution[i] += diff > 0 ? 1 : -1;
                        break;
                    }
                }
            }
        }
        
        for (let i = 1; i <= 18; i++) {
            const par = parDistribution[i - 1];
            
            // Generate realistic yardages based on par
            let yardage;
            if (par === 3) {
                yardage = 120 + Math.floor(Math.random() * 140); // 120-260 yards
            } else if (par === 4) {
                yardage = 280 + Math.floor(Math.random() * 200); // 280-480 yards
            } else { // par 5
                yardage = 450 + Math.floor(Math.random() * 150); // 450-600 yards
            }
            
            holes.push({
                hole: i,
                par: par,
                yardage: yardage,
                handicap: i // Will be reassigned by assignProperHandicaps
            });
        }
        
        return assignProperHandicaps(holes);
    };
    
    // Famous course hole data with accurate information
    const generateAugustaNationalHoles = () => {
        return [
            { hole: 1, par: 4, yardage: 445, handicap: 10 },
            { hole: 2, par: 5, yardage: 575, handicap: 16 },
            { hole: 3, par: 4, yardage: 350, handicap: 14 },
            { hole: 4, par: 3, yardage: 240, handicap: 6 },
            { hole: 5, par: 4, yardage: 495, handicap: 2 },
            { hole: 6, par: 3, yardage: 180, handicap: 18 },
            { hole: 7, par: 4, yardage: 450, handicap: 12 },
            { hole: 8, par: 5, yardage: 570, handicap: 8 },
            { hole: 9, par: 4, yardage: 460, handicap: 4 },
            { hole: 10, par: 4, yardage: 495, handicap: 1 },
            { hole: 11, par: 4, yardage: 520, handicap: 3 },
            { hole: 12, par: 3, yardage: 155, handicap: 17 },
            { hole: 13, par: 5, yardage: 510, handicap: 9 },
            { hole: 14, par: 4, yardage: 440, handicap: 11 },
            { hole: 15, par: 5, yardage: 550, handicap: 5 },
            { hole: 16, par: 3, yardage: 170, handicap: 15 },
            { hole: 17, par: 4, yardage: 440, handicap: 13 },
            { hole: 18, par: 4, yardage: 465, handicap: 7 }
        ];
    };
    
    const generateStAndrewsHoles = () => {
        return [
            { hole: 1, par: 4, yardage: 376, handicap: 13 },
            { hole: 2, par: 4, yardage: 453, handicap: 7 },
            { hole: 3, par: 4, yardage: 397, handicap: 11 },
            { hole: 4, par: 4, yardage: 480, handicap: 3 },
            { hole: 5, par: 5, yardage: 568, handicap: 9 },
            { hole: 6, par: 4, yardage: 412, handicap: 15 },
            { hole: 7, par: 4, yardage: 371, handicap: 17 },
            { hole: 8, par: 3, yardage: 175, handicap: 5 },
            { hole: 9, par: 4, yardage: 352, handicap: 1 },
            { hole: 10, par: 4, yardage: 342, handicap: 18 },
            { hole: 11, par: 3, yardage: 174, handicap: 16 },
            { hole: 12, par: 4, yardage: 348, handicap: 14 },
            { hole: 13, par: 4, yardage: 465, handicap: 4 },
            { hole: 14, par: 5, yardage: 618, handicap: 2 },
            { hole: 15, par: 4, yardage: 455, handicap: 12 },
            { hole: 16, par: 4, yardage: 423, handicap: 6 },
            { hole: 17, par: 4, yardage: 495, handicap: 8 },
            { hole: 18, par: 4, yardage: 357, handicap: 10 }
        ];
    };
    
    // Generate fallback courses based on search query
    const generateFallbackCourses = (searchQuery) => {
        const searchLower = searchQuery.toLowerCase();
        
        if (searchLower.includes('pebble')) {
            return [{
                id: 'pebble-beach-fallback',
                name: 'Pebble Beach Golf Links',
                city: 'Pebble Beach',
                state: 'CA',
                country: 'USA',
                par: 72,
                yardage: 7040,
                rating: 74.5,
                slope: 142,
                holes: generatePebbleBeachHoles()
            }];
        } else if (searchLower.includes('augusta')) {
            return [{
                id: 'augusta-national-fallback',
                name: 'Augusta National Golf Club',
                city: 'Augusta',
                state: 'GA',
                country: 'USA',
                par: 72,
                yardage: 7475,
                rating: 76.2,
                slope: 137,
                holes: generateAugustaNationalHoles()
            }];
        } else if (searchLower.includes('st andrews') || searchLower.includes('st. andrews')) {
            return [{
                id: 'st-andrews-fallback',
                name: 'The Old Course at St Andrews',
                city: 'St Andrews',
                state: 'Fife',
                country: 'Scotland',
                par: 72,
                yardage: 7297,
                rating: 75.1,
                slope: 139,
                holes: generateStAndrewsHoles()
            }];
        } else if (searchLower.includes('bethpage')) {
            return [{
                id: 'bethpage-black-fallback',
                name: 'Bethpage State Park (Black Course)',
                city: 'Farmingdale',
                state: 'NY',
                country: 'USA',
                par: 71,
                yardage: 7468,
                rating: 77.0,
                slope: 148,
                holes: generateBethpageBlackHoles()
            }];
        } else {
            // Generate multiple generic courses
            return [
                {
                    id: `${searchQuery.replace(/\s+/g, '-').toLowerCase()}-gc`,
                    name: `${searchQuery} Golf Club`,
                    city: 'Sample City',
                    state: 'CA',
                    country: 'USA',
                    par: 72,
                    yardage: 6800,
                    rating: 72.1,
                    slope: 125,
                    holes: generateDefaultHoles(72)
                },
                {
                    id: `${searchQuery.replace(/\s+/g, '-').toLowerCase()}-cc`,
                    name: `${searchQuery} Country Club`,
                    city: 'Sample Town',
                    state: 'TX',
                    country: 'USA',
                    par: 71,
                    yardage: 6650,
                    rating: 71.8,
                    slope: 128,
                    holes: generateDefaultHoles(71)
                }
            ];
        }
    };
    
    const generateBethpageBlackHoles = () => {
        return [
            { hole: 1, par: 4, yardage: 430, handicap: 7 },
            { hole: 2, par: 4, yardage: 389, handicap: 15 },
            { hole: 3, par: 3, yardage: 213, handicap: 11 },
            { hole: 4, par: 5, yardage: 517, handicap: 1 },
            { hole: 5, par: 4, yardage: 451, handicap: 9 },
            { hole: 6, par: 4, yardage: 408, handicap: 17 },
            { hole: 7, par: 4, yardage: 492, handicap: 3 },
            { hole: 8, par: 3, yardage: 210, handicap: 13 },
            { hole: 9, par: 4, yardage: 413, handicap: 5 },
            { hole: 10, par: 4, yardage: 492, handicap: 2 },
            { hole: 11, par: 4, yardage: 435, handicap: 12 },
            { hole: 12, par: 5, yardage: 499, handicap: 6 },
            { hole: 13, par: 3, yardage: 160, handicap: 18 },
            { hole: 14, par: 4, yardage: 442, handicap: 14 },
            { hole: 15, par: 5, yardage: 478, handicap: 4 },
            { hole: 16, par: 4, yardage: 490, handicap: 8 },
            { hole: 17, par: 3, yardage: 207, handicap: 16 },
            { hole: 18, par: 4, yardage: 411, handicap: 10 }
        ];
    };
    
    // Validate and fix course holes data
    const validateAndFixHoles = (holes) => {
        if (!holes || !Array.isArray(holes) || holes.length !== 18) {
            console.log('Invalid holes data, generating default');
            return generateDefaultHoles(72);
        }
        
        // Ensure all holes have required properties
        const validatedHoles = holes.map((hole, index) => ({
            hole: hole.hole || (index + 1),
            par: parseInt(hole.par) || 4,
            yardage: parseInt(hole.yardage) || (hole.par === 3 ? 150 : hole.par === 5 ? 500 : 350),
            handicap: parseInt(hole.handicap) || (index + 1)
        }));
        
        // Check if handicaps are properly assigned (1-18, no duplicates)
        const handicaps = validatedHoles.map(h => h.handicap).filter(h => h >= 1 && h <= 18);
        const uniqueHandicaps = [...new Set(handicaps)];
        
        if (uniqueHandicaps.length !== 18) {
            console.log('Reassigning handicaps based on difficulty');
            return assignProperHandicaps(validatedHoles);
        }
        
        return validatedHoles;
    };
    
    // Public API
    return {
        generateDefaultHoles,
        generatePebbleBeachHoles,
        generateAugustaNationalHoles,
        generateStAndrewsHoles,
        generateBethpageBlackHoles,
        generateFallbackCourses,
        validateAndFixHoles,
        assignProperHandicaps,
        calculateHoleDifficulty
    };
})();