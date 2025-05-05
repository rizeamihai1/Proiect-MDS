"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Calculator, Plus, Trash2 } from "lucide-react"
import { calculateArbitrageBets } from "@/lib/betting-utils"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function KellyCalculatorPage() {
  const [investmentAmount, setInvestmentAmount] = useState<number>(100)
  const [outcomes, setOutcomes] = useState([
    { name: "Outcome 1", bookmaker: "", odds: 0 },
    { name: "Outcome 2", bookmaker: "", odds: 0 },
  ])
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)

  const addOutcome = () => {
    setOutcomes([...outcomes, { name: `Outcome ${outcomes.length + 1}`, bookmaker: "", odds: 0 }])
  }

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 2) return
    const newOutcomes = [...outcomes]
    newOutcomes.splice(index, 1)
    setOutcomes(newOutcomes)
  }

  const updateOutcome = (index: number, field: string, value: string) => {
    const newOutcomes = [...outcomes]
    newOutcomes[index] = { ...newOutcomes[index], [field]: field === "odds" ? Number.parseFloat(value) || 0 : value }
    setOutcomes(newOutcomes)
  }

  const calculateKelly = () => {
    // Format outcomes for the calculation
    const formattedOdds = outcomes.map((outcome) => ({
      bookmaker: outcome.bookmaker || "Unknown",
      type: outcome.name,
      odds: outcome.odds,
    }))

    // Calculate Kelly criterion
    const results = calculateArbitrageBets(formattedOdds, investmentAmount)
    setResults(results)
    setShowResults(true)
  }

  const isValid = outcomes.every((outcome) => outcome.odds > 0)

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelly Criterion Calculator</h1>
          <p className="text-muted-foreground">Calculate optimal bet distribution for arbitrage betting</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back to Matches</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Betting Odds</CardTitle>
          <CardDescription>Add the best available odds for each possible outcome</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <Label>Outcome</Label>
              </div>
              <div className="col-span-4">
                <Label>Bookmaker</Label>
              </div>
              <div className="col-span-2">
                <Label>Odds</Label>
              </div>
              <div className="col-span-1"></div>
            </div>

            {outcomes.map((outcome, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <Input
                    value={outcome.name}
                    onChange={(e) => updateOutcome(index, "name", e.target.value)}
                    placeholder="Outcome name"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={outcome.bookmaker}
                    onChange={(e) => updateOutcome(index, "bookmaker", e.target.value)}
                    placeholder="Bookmaker name"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1.01"
                    step="0.01"
                    value={outcome.odds || ""}
                    onChange={(e) => updateOutcome(index, "odds", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOutcome(index)}
                    disabled={outcomes.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addOutcome} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Outcome
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="investment-amount">Investment Amount</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                />
              </div>
              <Button onClick={calculateKelly} disabled={!isValid} className="gap-2">
                <Calculator className="h-4 w-4" />
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResults && results && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={results.arbitrageExists ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Arbitrage Opportunity</CardTitle>
                  {results.arbitrageExists ? (
                    <Badge className="bg-green-500">Available</Badge>
                  ) : (
                    <Badge variant="outline">Not Available</Badge>
                  )}
                </div>
                <CardDescription>
                  Sum of implied probabilities: {results.sumOfProbabilities}
                  {results.sumOfProbabilities < 1 ? " (Arbitrage exists when < 1)" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Profit:</span>
                    <span className={`font-medium ${results.expectedProfit > 0 ? "text-green-600" : "text-red-600"}`}>
                      {results.expectedProfit > 0 ? "+" : ""}
                      {results.expectedProfit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected ROI:</span>
                    <span className={`font-medium ${results.expectedROI > 0 ? "text-green-600" : "text-red-600"}`}>
                      {results.expectedROI > 0 ? "+" : ""}
                      {results.expectedROI}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Bet Distribution</CardTitle>
              <CardDescription>How to distribute your {investmentAmount} investment</CardDescription>
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
                  {results.bets.map((bet, index) => (
                    <TableRow key={index}>
                      <TableCell>{outcomes[index].name}</TableCell>
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

          {results.arbitrageExists ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle>Arbitrage opportunity detected!</AlertTitle>
              <AlertDescription>
                By placing bets as recommended above, you can secure a profit of {results.expectedProfit} (
                {results.expectedROI}% ROI) regardless of the outcome.
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
