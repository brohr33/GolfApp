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
    const generatePebbleBeachHoles = () => {
        return [
            { hole: 1, par: 4, yardage: 381, handicap: 11 },
            { hole: 2, par: 5, yardage: 502, handicap: 13 },
            { hole: 3, par: 4, yardage: 390, handicap: 9 },
            { hole: 4, par: 4, yardage: 331, handicap: 15 },
            { hole: 5, par: 3, yardage: 188, handicap: 17 },
            { hole: 6, par: 5, yardage: 513, handicap: 5 },
            { hole: 7, par: 3, yardage: 106, handicap: 7 },
            { hole: 8, par: 4, yardage: 418, handicap: 1 },
            { hole: 9, par: 4, yardage: 464, handicap: 3 },
            { hole: 10, par: 4, yardage: 446, handicap: 6 },
            { hole: 11, par: 4, yardage: 390, handicap: 14 },
            { hole: 12, par: 3, yardage: 202, handicap: 16 },
            { hole: 13, par: 4, yardage: 399, handicap: 8 },
            { hole: 14, par: 5, yardage: 572, handicap: 2 },
            { hole: 15, par: 4, yardage: 397, handicap: 12 },
            { hole: 16, par: 4, yardage: 402, handicap: 10 },
            { hole: 17, par: 3, yardage: 178, handicap: 18 },
            { hole: 18, par: 5, yardage: 543, handicap: 4 }
        ];
    };