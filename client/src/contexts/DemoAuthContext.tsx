import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DemoUser {
  id: string
  email: string
  display_name: string
  profile_image?: string
  bio?: string
  dark_mode: boolean
  audio_enabled: boolean
}

interface DemoAuthContextType {
  user: DemoUser | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<DemoUser>) => Promise<{ error: string | null }>
}

const DemoAuthContext = createContext<DemoAuthContextType>({
  user: null,
  loading: false,
  signUp: async () => ({ error: 'Demo mode' }),
  signIn: async () => ({ error: 'Demo mode' }),
  signOut: async () => {},
  updateProfile: async () => ({ error: 'Demo mode' })
})

export const useDemoAuth = () => useContext(DemoAuthContext)

export const DemoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loading, setLoading] = useState(false)

  // Demo users for testing
  const demoUsers: Record<string, { password: string; user: DemoUser }> = {
    'demo@example.com': {
      password: 'demo123',
      user: {
        id: 'demo-user-1',
        email: 'demo@example.com',
        display_name: 'Demo User',
        bio: 'This is a demo account for testing the multi-user wedding gallery platform.',
        dark_mode: false,
        audio_enabled: true
      }
    },
    'test@example.com': {
      password: 'test123',
      user: {
        id: 'demo-user-2',
        email: 'test@example.com',
        display_name: 'Test User',
        bio: 'Another demo account to showcase user separation.',
        dark_mode: true,
        audio_enabled: true
      }
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (demoUsers[email]) {
      setLoading(false)
      return { error: 'User already exists' }
    }

    // Create new demo user
    const newUser: DemoUser = {
      id: `demo-user-${Date.now()}`,
      email,
      display_name: displayName,
      dark_mode: false,
      audio_enabled: true
    }

    setUser(newUser)
    localStorage.setItem('demo_user', JSON.stringify(newUser))
    setLoading(false)
    
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const demoUser = demoUsers[email]
    if (!demoUser || demoUser.password !== password) {
      setLoading(false)
      return { error: 'Invalid email or password' }
    }

    setUser(demoUser.user)
    localStorage.setItem('demo_user', JSON.stringify(demoUser.user))
    setLoading(false)
    
    return { error: null }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('demo_user')
  }

  const updateProfile = async (updates: Partial<DemoUser>) => {
    if (!user) return { error: 'No user logged in' }

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('demo_user', JSON.stringify(updatedUser))
    
    return { error: null }
  }

  // Load user from localStorage on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('demo_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('demo_user')
      }
    }
  }, [])

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  )
}