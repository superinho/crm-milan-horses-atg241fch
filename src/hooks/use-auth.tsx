import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase/client'

type CrmUser = User & {
  name?: string
  avatar?: string
}

interface AuthContextType {
  user: CrmUser | null
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const allowAnonTestMode = import.meta.env.VITE_ALLOW_ANON_TEST_MODE === 'true'
const testUser = {
  id: 'local-test-user',
  email: 'teste@milanhorses.local',
  name: 'Teste Milan Horses',
  avatar: undefined,
} as CrmUser

const mapUser = (user: User | null): CrmUser | null => {
  if (!user) return null
  return {
    ...user,
    name:
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split('@')[0],
    avatar: user.user_metadata?.avatar_url as string | undefined,
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CrmUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (allowAnonTestMode) {
      setUser(testUser)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user || null))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user || null))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    if (allowAnonTestMode) return { error: null }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (allowAnonTestMode) {
      setUser(testUser)
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (allowAnonTestMode) {
      setUser(testUser)
      return
    }

    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
