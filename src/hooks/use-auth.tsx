import React from 'react'

export const useAuth = () => ({
  user: {
    id: 'public',
    name: 'Admin',
    email: 'admin@milanhorses.com',
  },
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  loading: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)
