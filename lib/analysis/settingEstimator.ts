
// Setting Estimation Logic using Bayesian Inference

export type Setting = 1 | 2 | 3 | 4 | 5 | 6

export interface MachineSpec {
    machineName: string
    settings: {
        setting: Setting
        bonusProb: number // Combined or Main probability (1/X)
        regProb?: number  // Specific probability for REG/AT (1/X)
        bigProb?: number  // Specific probability for BIG (1/X)
        payout?: number   // Payout percentage
    }[]
}

// Specs for Hokuto Tensei (assuming REG = AT Initial Hit)
// Values from user provided image/text
/*
Setting 1: 1/366.0
Setting 2: 1/357.0
Setting 3: 1/336.3
Setting 4: 1/298.7
Setting 5: 1/283.2
Setting 6: 1/273.1
*/
export const HOKUTO_TENSEI_SPEC: MachineSpec = {
    machineName: '北斗の拳 転生の章',
    settings: [
        { setting: 1, bonusProb: 1 / 366.0, regProb: 1 / 366.0, payout: 97.6 },
        { setting: 2, bonusProb: 1 / 357.0, regProb: 1 / 357.0, payout: 98.4 },
        { setting: 3, bonusProb: 1 / 336.3, regProb: 1 / 336.3, payout: 100.7 },
        { setting: 4, bonusProb: 1 / 298.7, regProb: 1 / 298.7, payout: 106.2 },
        { setting: 5, bonusProb: 1 / 283.2, regProb: 1 / 283.2, payout: 111.1 },
        { setting: 6, bonusProb: 1 / 273.1, regProb: 1 / 273.1, payout: 114.9 },
    ]
}

export interface EstimationResult {
    setting: Setting
    probability: number // 0-100%
}

/**
 * Calculate setting probabilities based on game count and hit count.
 * Uses Binomial Distribution for likelihood.
 * 
 * @param games Total games played
 * @param hits Number of hits (e.g., REG count for Hokuto)
 * @param spec Machine specification
 * @param priors Prior probabilities for each setting (default: uniform)
 */
export function estimateSetting(
    games: number,
    hits: number,
    spec: MachineSpec,
    priors: number[] = [1, 1, 1, 1, 1, 1].map(v => v / 6) // Default uniform
): EstimationResult[] {
    if (games === 0) {
        return spec.settings.map((s, i) => ({ setting: s.setting, probability: priors[i] * 100 }))
    }

    // Likelihood calculation using Binomial Distribution
    // P(Data|Setting) = nCk * p^k * (1-p)^(n-k)
    // We can ignore nCk as it's constant for all settings
    // We use Log Likelihood to avoid underflow

    const logLikelihoods = spec.settings.map(s => {
        const p = s.regProb ? s.regProb : s.bonusProb // Use REG prob if available (for Hokuto), else generic bonusProb
        // If data is provided as 1/X decimal directly in spec: s.regProb is 1/X so we use it directly.

        // Note: s.regProb is defined as 1/366.0 (~0.0027), so we use it as is.

        const prob = p

        // Log Likelihood: k * ln(p) + (n-k) * ln(1-p)
        return hits * Math.log(prob) + (games - hits) * Math.log(1 - prob)
    })

    // Bayesian Inference: P(Setting|Data) ∝ P(Data|Setting) * P(Setting)
    // Log Posterior = Log Likelihood + Log Prior
    const logPosteriors = logLikelihoods.map((ll, i) => ll + Math.log(priors[i]))

    // Convert back from log to probability
    // Subtract max log value to avoid overflow when exp()
    const maxLogPosterior = Math.max(...logPosteriors)
    const unnormalizedPosteriors = logPosteriors.map(lp => Math.exp(lp - maxLogPosterior))

    const sumPosteriors = unnormalizedPosteriors.reduce((a, b) => a + b, 0)

    return spec.settings.map((s, i) => ({
        setting: s.setting,
        probability: (unnormalizedPosteriors[i] / sumPosteriors) * 100
    }))
}

// Helper to get spec by machine name (fuzzy match or ID mapping in future)
export function getMachineSpec(machineName: string): MachineSpec | null {
    if (machineName.includes('北斗') && machineName.includes('転生')) {
        return HOKUTO_TENSEI_SPEC
    }
    return null
}
