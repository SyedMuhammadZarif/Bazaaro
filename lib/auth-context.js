"use client"

import { createContext, useContext, useReducer, useEffect } from "react"

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null }
    case "LOGIN_SUCCESS":
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null }
    case "LOGIN_ERROR":
      return { ...state, loading: false, error: action.payload, isAuthenticated: false }
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false, loading: false, error: null }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        dispatch({ type: "LOGIN_SUCCESS", payload: userData.user })
      } else {
        dispatch({ type: "LOGOUT" })
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      dispatch({ type: "LOGOUT" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" })
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        dispatch({ type: "LOGIN_SUCCESS", payload: data.user })
        return { success: true, user: data.user }
      } else {
        dispatch({ type: "LOGIN_ERROR", payload: data.message })
        return { success: false, error: data.message }
      }
    } catch (error) {
      const errorMessage = "Login failed. Please try again."
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const signup = async (name, email, password, role) => {
    dispatch({ type: "LOGIN_START" })
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await response.json()

      if (response.ok) {
        dispatch({ type: "LOGIN_SUCCESS", payload: data.user })
        return { success: true, user: data.user }
      } else {
        dispatch({ type: "LOGIN_ERROR", payload: data.message })
        return { success: false, error: data.message }
      }
    } catch (error) {
      const errorMessage = "Signup failed. Please try again."
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      dispatch({ type: "LOGOUT" })
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        return true
      } else {
        dispatch({ type: "LOGOUT" })
        return false
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      dispatch({ type: "LOGOUT" })
      return false
    }
  }

  const value = {
    ...state,
    login,
    signup,
    logout,
    refreshToken,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
