'use client'
// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AuthState, User } from '@/types'
import { login as apiLogin, logout as apiLogout } from '@/lib/api'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Restore session from localStorage
    try {
      const token = localStorage.getItem('assocham_token')
      const userStr = localStorage.getItem('assocham_user')
      if (token && userStr) {
        const user: User = JSON.parse(userStr)
        setState({ user, token, isLoading: false, isAuthenticated: true })
        return
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem('assocham_token')
      localStorage.removeItem('assocham_user')
    }
    setState(s => ({ ...s, isLoading: false }))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password })
    setState({
      user: res.data,
      token: res.access_token,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false })
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
