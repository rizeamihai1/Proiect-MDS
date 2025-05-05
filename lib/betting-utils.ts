/**
 * Calculates the optimal bet distribution using Kelly criterion for arbitrage betting
 * @param odds Array of odds from different bookmakers for different outcomes
 * @param investmentAmount Total amount to invest
 * @returns Object with bet distribution and expected profit
 */
export function calculateArbitrageBets(
  odds: { bookmaker: string; type: string; odds: number }[],
  investmentAmount: number,
) {
  // Calculate the arbitrage opportunity
  const impliedProbabilities = odds.map((odd) => 1 / odd.odds)
  const sumOfProbabilities = impliedProbabilities.reduce((sum, prob) => sum + prob, 0)

  // Check if arbitrage exists (sum of implied probabilities < 1)
  const arbitrageExists = sumOfProbabilities < 1

  // Calculate the Kelly stake for each outcome
  const bets = odds.map((odd, index) => {
    const impliedProb = impliedProbabilities[index]
    const kellyPercentage = arbitrageExists ? impliedProb / sumOfProbabilities : impliedProb

    const stakeAmount = kellyPercentage * investmentAmount
    const potentialReturn = stakeAmount * odd.odds

    return {
      bookmaker: odd.bookmaker,
      type: odd.type,
      odds: odd.odds,
      stakeAmount: Number.parseFloat(stakeAmount.toFixed(2)),
      potentialReturn: Number.parseFloat(potentialReturn.toFixed(2)),
      kellyPercentage: Number.parseFloat((kellyPercentage * 100).toFixed(2)),
    }
  })

  // Calculate expected profit
  let expectedProfit = 0
  if (arbitrageExists) {
    // In arbitrage, the expected return is the same regardless of outcome
    const firstBet = bets[0]
    expectedProfit = firstBet.potentialReturn - investmentAmount
  } else {
    // If no arbitrage, calculate weighted average profit
    expectedProfit = bets.reduce((sum, bet) => {
      const impliedProb = 1 / bet.odds
      return sum + (bet.potentialReturn - investmentAmount) * impliedProb
    }, 0)
  }

  return {
    bets,
    arbitrageExists,
    expectedProfit: Number.parseFloat(expectedProfit.toFixed(2)),
    expectedROI: Number.parseFloat(((expectedProfit / investmentAmount) * 100).toFixed(2)),
    sumOfProbabilities: Number.parseFloat(sumOfProbabilities.toFixed(4)),
  }
}

/**
 * Finds the best arbitrage opportunity among multiple bookmakers
 * @param allOdds Array of all available odds from different bookmakers
 * @returns The best combination for arbitrage betting
 */
export function findBestArbitrageOpportunity(
  allOdds: {
    bookmaker: string
    home_win: number
    draw: number
    away_win: number
  }[],
) {
  const outcomes = ["home_win", "draw", "away_win"]
  const outcomeLabels = {
    home_win: "1",
    draw: "X",
    away_win: "2",
  }

  // Find the best odds for each outcome across all bookmakers
  const bestOdds = outcomes.map((outcome) => {
    const bestOdd = allOdds.reduce(
      (best, current) => {
        return current[outcome] > best.odds ? { bookmaker: current.bookmaker, odds: current[outcome] } : best
      },
      { bookmaker: "", odds: 0 },
    )

    return {
      bookmaker: bestOdd.bookmaker,
      type: outcomeLabels[outcome],
      odds: bestOdd.odds,
      outcome,
    }
  })

  return bestOdds
}
