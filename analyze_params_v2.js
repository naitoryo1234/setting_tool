// Data provided directly by user and extracted from image
const data = [
    { no: 238, big: 26, games: 2770, actualDiff: -500 },
    { no: 239, big: 14, games: 911, actualDiff: 500 },
    { no: 240, big: 7, games: 1259, actualDiff: -1000 },
    { no: 241, big: 22, games: 3256, actualDiff: -2000 },
    { no: 242, big: 14, games: 1692, actualDiff: -500 },
    { no: 243, big: 29, games: 2217, actualDiff: -1000 },
    { no: 244, big: 5, games: 1015, actualDiff: 0 },
    { no: 245, big: 62, games: 2459, actualDiff: 7500 },
    { no: 246, big: 0, games: 1010, actualDiff: -1500 },
    { no: 247, big: 16, games: 2067, actualDiff: -1000 },
    { no: 248, big: 32, games: 3997, actualDiff: -2000 },
    { no: 249, big: 2, games: 804, actualDiff: -1000 },
    { no: 250, big: 36, games: 2574, actualDiff: 1000 },
];

function calculateError(a, b) {
    let totalAbsError = 0;
    for (const d of data) {
        const predicted = Math.round((d.big * a) - (d.games * b));
        totalAbsError += Math.abs(predicted - d.actualDiff);
    }
    return Math.round(totalAbsError / data.length);
}

console.log("--- Refined Analysis ---");

// Try fixed CoinsPerBig ranges to see sensitivity
// Smash Hokuto Tensei might have around 2.5~3.0 coins/game IN, 
// and AT payout might be around 400-500 coins per set (BIG count).
// Let's assume 'BIG' count is the number of sets or bonuses.

const scenarios = [
    { a: 179, b: 1.9 }, // Previous optimal
    { a: 200, b: 2.1 },
    { a: 300, b: 3.2 },
    { a: 400, b: 4.3 },
    { a: 150, b: 1.6 },
];

for (const s of scenarios) {
    const err = calculateError(s.a, s.b);
    console.log(`a=${s.a}, b=${s.b} => AvgError: ${err}`);
}

console.log("\n--- Detailed View for Optimal (179, 1.9) ---");
const bestA = 179;
const bestB = 1.9;
for (const d of data) {
    const predicted = Math.round((d.big * bestA) - (d.games * bestB));
    const error = predicted - d.actualDiff;
    console.log(`No:${d.no} Act:${d.actualDiff} Pred:${predicted} (Diff: ${error > 0 ? '+' : ''}${error}) [B:${d.big} G:${d.games}]`);
}
