"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function MainNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Matches",
      href: "/dashboard/matches",
    },
    {
      name: "Preferences",
      href: "/dashboard/preferences",
    },
    {
      name: "Saved Bets",
      href: "/dashboard/saved-bets",
    },
  ]

  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.name}
        </Link>
      ))}
      {user && (
        <Button variant="ghost" onClick={() => signOut()}>
          Sign Out
        </Button>
      )}
    </div>
  )
}
