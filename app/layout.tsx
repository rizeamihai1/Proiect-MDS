import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Your existing layout content */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
