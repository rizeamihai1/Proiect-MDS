"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Pause, Play } from "lucide-react"
import { useRefresh } from "@/contexts/refresh-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RefreshButton() {
  const { lastRefreshed, isRefreshing, refreshData, autoRefreshEnabled, setAutoRefreshEnabled, secondsUntilRefresh } =
    useRefresh()

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="default"
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data Now
          </Button>

          {autoRefreshEnabled && (
            <Badge variant="outline" className="text-sm">
              Next refresh in: <span className="font-bold ml-1">{secondsUntilRefresh}s</span>
            </Badge>
          )}

          <div className="flex items-center space-x-2 ml-2">
            <Switch id="auto-refresh" checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? "Pause auto-refresh" : "Enable auto-refresh"}
            >
              {autoRefreshEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {lastRefreshed && (
          <div className="text-xs text-muted-foreground mt-2">Last updated: {lastRefreshed.toLocaleTimeString()}</div>
        )}
      </CardContent>
    </Card>
  )
}
