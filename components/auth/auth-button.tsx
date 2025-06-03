"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function AuthButton() {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">{user.email}</span>
        <button onClick={signOut} className="text-sm font-medium text-gray-700 hover:text-gray-900">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
        Sign in
      </Link>
      <Link
        href="/signup"
        className="text-sm font-medium bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
      >
        Sign up
      </Link>
    </div>
  )
}
