import { createContext, useContext, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const mockUser: User = {
  id: 'admin-user-id',
  email: 'admin@milanhorses.com',
  user_metadata: {
    full_name: 'Admin Milan',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const mockSession: Session = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
} as Session

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<User | null>(mockUser)
  const [session] = useState<Session | null>(mockSession)
  const [loading] = useState(false)

  const signUp = async () => ({ error: null })
  const signIn = async () => ({ error: null })
  const signOut = async () => ({ error: null })

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
