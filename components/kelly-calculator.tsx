"use client"

import { useState } from "react"
import { calculateArbitrageBets, findBestArbitrageOpportunity } from "@/lib/betting-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calculator, Check, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface KellyCalculatorProps {
  odds: {
    bookmaker: string
    home_win: number
    draw: number
    away_win: number
  }[]
  team1: string
  team2: string
}

export function KellyCalculator({ odds, team1, team2 }: KellyCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState<number>(100)
  const [showResults, setShowResults] = useState<boolean>(false)

  const handleCalculate = () => {
    setShowResults(true)
  }

  // Find the best odds for each outcome
  const bestOdds = findBestArbitrageOpportunity(odds)

  // Calculate the Kelly criterion recommendations
  const recommendations = calculateArbitrageBets(bestOdds, investmentAmount)

  const outcomeLabels = {
    home_win: `${team1} Win (1)`,
    draw: "Draw (X)",
    away_win: `${team2} Win (2)`,
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Kelly Criterion Betting Calculator</CardTitle>
          <CardDescription>Calculate optimal bet distribution across bookmakers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="investment-amount" className="text-sm font-medium">
                Investment Amount
              </label>
              <Input
                id="investment-amount"
                type="number"
                min="1"
                step="1"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button onClick={handleCalculate} className="gap-2">
              <Calculator className="h-4 w-4" />
              Calculate
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={recommendations.arbitrageExists ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Arbitrage Opportunity</CardTitle>
                  {recommendations.arbitrageExists ? (
                    <Badge className="bg-green-500">Available</Badge>
                  ) : (
                    <Badge variant="outline">Not Available</Badge>
                  )}
                </div>
                <CardDescription>
                  Sum of implied probabilities: {recommendations.sumOfProbabilities}
                  {recommendations.sumOfProbabilities < 1 ? " (Arbitrage exists when < 1)" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Profit:</span>
                    <span
                      className={`font-medium ${recommendations.expectedProfit > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {recommendations.expectedProfit > 0 ? "+" : ""}
                      {recommendations.expectedProfit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected ROI:</span>
                    <span
                      className={`font-medium ${recommendations.expectedROI > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {recommendations.expectedROI > 0 ? "+" : ""}
                      {recommendations.expectedROI}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Best Odds Selected</CardTitle>
                <CardDescription>The best available odds for each outcome</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bestOdds.map((odd) => (
                    <div key={odd.outcome} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{outcomeLabels[odd.outcome]}:</span>
                      <span className="font-medium">
                        {odd.bookmaker} ({odd.odds})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Bet Distribution</CardTitle>
              <CardDescription>How to distribute your {investmentAmount} investment across bookmakers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Bookmaker</TableHead>
                    <TableHead>Odds</TableHead>
                    <TableHead>Stake Amount</TableHead>
                    <TableHead>Kelly %</TableHead>
                    <TableHead>Potential Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.bets.map((bet, index) => (
                    <TableRow key={index}>
                      <TableCell>{outcomeLabels[bestOdds[index].outcome]}</TableCell>
                      <TableCell>{bet.bookmaker}</TableCell>
                      <TableCell>{bet.odds}</TableCell>
                      <TableCell className="font-medium">{bet.stakeAmount}</TableCell>
                      <TableCell>{bet.kellyPercentage}%</TableCell>
                      <TableCell>{bet.potentialReturn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {recommendations.arbitrageExists ? (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle>Arbitrage opportunity detected!</AlertTitle>
              <AlertDescription>
                By placing bets as recommended above, you can secure a profit of {recommendations.expectedProfit} (
                {recommendations.expectedROI}% ROI) regardless of the match outcome.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No arbitrage opportunity</AlertTitle>
              <AlertDescription>
                There is no guaranteed profit opportunity with the current odds. The recommended distribution maximizes
                your expected value based on the Kelly criterion.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
