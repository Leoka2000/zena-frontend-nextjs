"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import { AppUser } from "@/types/AppUser"

export default function CurrentUserInfo() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = getToken()
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch("http://localhost:8080/users/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || `Request failed with status ${response.status}`
          )
        }

        const userData = await response.json()
        console.log("User data received:", userData)
        
        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          enabled: userData.enabled
        })
      } catch (err) {
        console.error("Error fetching user:", err)
        setError(
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Failed to fetch user data"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return <div className="p-4">Loading user information...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
        <button 
          onClick={() => window.location.reload()}
          className="ml-2 text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!user) {
    return <div className="p-4">No user data available</div>
  }

  return (
    <div className="p-4 space-y-2 bg-gray-50 dark:bg-neutral-900 rounded-lg">
      <h2 className="text-lg font-semibold">User Profile</h2>
      <div className="space-y-1">
        <p><span className="font-medium">ID:</span> {user.id}</p>
        <p><span className="font-medium">Username:</span> {user.username}</p>
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Status:</span> 
          {user.enabled ? (
            <span className="text-green-500"> Active</span>
          ) : (
            <span className="text-red-500"> Inactive</span>
          )}
        </p>
      </div>
    </div>
  )
}