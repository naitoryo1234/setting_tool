// Data provided directly by user
const data = [
    { no: 238, big: 26, games: 2770, actualDiff: -500 },
    { no: 239, big: 14, games: 911, actualDiff: 500 },
    { no: 240, big: 7, games: 1259, actualDiff: -1000 },
    { no: 241, big: 22, games: 3256, actualDiff: -2000 },
    { no: 242, big: 14, games: 1692, actualDiff: -500 },
    { no: 243, big: 29, games: 2217, actualDiff: -1000 },
    { no: 244, big: 5, games: 1015, actualDiff: 0 },
    { no: 245, big: 62, games: 2459, actualDiff: 7500 }, // Outlier (Superior AT?)
    { no: 246, big: 0, games: 1010, actualDiff: -1500 },
    { no: 247, big: 16, games: 2067, actualDiff: -1000 },
    { no: 248, big: 32, games: 3997, actualDiff: -2000 },
    { no: 249, big: 2, games: 804, actualDiff: -1000 },
    { no: 250, big: 36, games: 2574, actualDiff: 1000 },
];

// Separate normal data and outliers (diff > 5000)
const normalData = data.filter(d => d.actualDiff < 5000);
const outlierData = data.filter(d => d.actualDiff >= 5000);

function calculateError(dataset, a, b) {
    let totalAbsError = 0;
    for (const d of dataset) {
        const predicted = Math.round((d.big * a) - (d.games * b));
        totalAbsError += Math.abs(predicted - d.actualDiff);
    }
    return Math.round(totalAbsError / dataset.length);
}

console.log("--- Analysis V3: Separating Outliers ---");

// 1. Find best fit for Normal Data with CoinsPerBig fixed around 130 (120-140)
let bestNormalError = Infinity;
let bestNormalA = 0;
let bestNormalB = 0;

for (let a = 120; a <= 150; a += 1) {
    for (let b = 1.0; b <= 3.0; b += 0.01) {
        const err = calculateError(normalData, a, b);
        if (err < bestNormalError) {
            bestNormalError = err;
            bestNormalA = a;
            bestNormalB = b;
        }
    }
}

console.log(`\nOptimal Normal Stats: CoinsPerBig(a) = ${bestNormalA}, CoinsPerGame(b) = ${bestNormalB.toFixed(2)}`);
console.log(`Avg Error (Normal only): ${bestNormalError}`);

console.log("\n--- Verification on Normal Data ---");
for (const d of normalData) {
    const predicted = Math.round((d.big * bestNormalA) - (d.games * bestNormalB));
    console.log(`No:${d.no} Act:${d.actualDiff} Pred:${predicted} (Diff: ${predicted - d.actualDiff})`);
}

// 2. Apply Average Normal Stats to Outlier
console.log("\n--- Outlier Analysis ---");
for (const d of outlierData) {
    const predicted = Math.round((d.big * bestNormalA) - (d.games * bestNormalB));
    console.log(`No:${d.no} Act:${d.actualDiff} Pred(NormalParams):${predicted} (Diff: ${predicted - d.actualDiff})`);

    // Reverse calculate 'a' for this outlier, assuming 'b' is constant
    // Diff = a * BIG - b * Games  =>  a = (Diff + b * Games) / BIG
    const impliedA = (d.actualDiff + (d.games * bestNormalB)) / d.big;
    console.log(`  -> Implied CoinsPerBig for this record: ${Math.round(impliedA)}`);
}
