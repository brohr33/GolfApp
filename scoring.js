// Golf Scoring System
window.GolfScoring = (function() {
    'use strict';
    
    // Calculate handicap strokes for a hole
    const getStrokesForHole = (playerHandicap, holeHandicap) => {
        if (playerHandicap >= holeHandicap) {
            const baseStrokes = Math.floor(playerHandicap / 18);
            const extraStrokes = playerHandicap % 18;
            return baseStrokes + (holeHandicap <= extraStrokes ? 1 : 0);
        }
        return 0;
    };
    
    // Calculate total gross score for a player
    const calculateTotal = (playerScores, course) => {
        return course.holes.reduce((total, hole) => {
            const score = parseInt(playerScores[hole.hole]);
            return total + (score || 0);
        }, 0);
    };
    
    // Calculate net score (gross minus handicap strokes)
    const calculateNetScore = (playerScores, course, handicap) => {
        return course.holes.reduce((total, hole) => {
            const score = parseInt(playerScores[hole.hole]);
            if (score && score > 0) {
                const strokes = getStrokesForHole(handicap, hole.handicap);
                return total + score - strokes;
            }
            return total;
        }, 0);
    };
    
    // Format score relative to par
    const formatToPar = (score, par) => {
        const toPar = score - par;
        if (toPar === 0) return 'E';
        return toPar > 0 ? `+${toPar}` : `${toPar}`;
    };
    
    // Check if player can select hole for Game of Tens
    const canSelectForTens = (currentSelections, hole) => {
        const selectedCount = Object.values(currentSelections).filter(Boolean).length;
        return selectedCount < 10 || currentSelections[hole];
    };
    
    // Calculate Game of Tens score
    const calculateTensScore = (playerScores, tensSelections, course, handicap) => {
        const selectedHoles = course.holes.filter(hole => tensSelections[hole.hole]);
        
        let grossScore = 0;
        let netScore = 0;
        let parTotal = 0;
        
        selectedHoles.forEach(hole => {
            const score = parseInt(playerScores[hole.hole]);
            if (score && score > 0) {
                grossScore += score;
                const strokes = getStrokesForHole(handicap, hole.handicap);
                netScore += score - strokes;
                parTotal += hole.par;
            }
        });
        
        return {
            selectedHoles: selectedHoles.length,
            grossScore,
            netScore,
            parTotal
        };
    };
    
    // Calculate individual hole score relative to par
    const getHoleScore = (strokes, par) => {
        const diff = strokes - par;
        if (diff <= -2) return 'Eagle';
        if (diff === -1) return 'Birdie';
        if (diff === 0) return 'Par';
        if (diff === 1) return 'Bogey';
        if (diff === 2) return 'Double';
        return 'Triple+';
    };
    
    // Calculate Stableford points
    const calculateStablefordPoints = (strokes, par, handicapStrokes) => {
        const netStrokes = strokes - handicapStrokes;
        const diff = netStrokes - par;
        
        if (diff <= -3) return 6; // Albatross
        if (diff === -2) return 5; // Eagle
        if (diff === -1) return 4; // Birdie
        if (diff === 0) return 3;  // Par
        if (diff === 1) return 2;  // Bogey
        if (diff === 2) return 1;  // Double Bogey
        return 0; // Triple or worse
    };
    
    return {
        getStrokesForHole,
        calculateTotal,
        calculateNetScore,
        formatToPar,
        canSelectForTens,
        calculateTensScore,
        getHoleScore,
        calculateStablefordPoints
    };
})();