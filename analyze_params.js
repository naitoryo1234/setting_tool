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

// Linear Regression to find best fit for:
// Diff = a * BIG - b * Games + c
// Simplified: Diff = CoinsPerBig * BIG - CoinsPerGame * Games

function solve() {
    let bestError = Infinity;
    let bestA = 0;
    let bestB = 0;

    // Brute force search for reasonable expected values
    // CoinsPerBig (a): 100 ~ 500 (Net increase per BIG count)
    // CoinsPerGame (b): 1.0 ~ 3.0 (Net decrease per Game)

    for (let a = 100; a <= 600; a += 1) {
        for (let b = 1.0; b <= 4.0; b += 0.1) {
            let currentError = 0;
            for (const d of data) {
                const predicted = (d.big * a) - (d.games * b);
                currentError += Math.pow(d.actualDiff - predicted, 2);
            }

            if (currentError < bestError) {
                bestError = currentError;
                bestA = a;
                bestB = b;
            }
        }
    }

    console.log(`Optimal Parameters: CoinsPerBig(a) = ${bestA}, CoinsPerGame(b) = ${bestB.toFixed(1)}`);
    console.log("---------------------------------------------------");
    console.log("No\tBIG\tGames\tActual\tPredicted\tError");

    let totalAbsError = 0;
    for (const d of data) {
        const predicted = Math.round((d.big * bestA) - (d.games * bestB));
        const error = predicted - d.actualDiff;
        totalAbsError += Math.abs(error);
        console.log(`${d.no}\t${d.big}\t${d.games}\t${d.actualDiff}\t${predicted}\t${error > 0 ? '+' : ''}${error}`);
    }
    console.log("---------------------------------------------------");
    console.log(`Average Absolute Error: ${Math.round(totalAbsError / data.length)}`);
}

solve();
